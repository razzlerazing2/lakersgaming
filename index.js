import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { createBareServer } from "@nebula-services/bare-server-node";
import chalk from "chalk";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import basicAuth from "express-basic-auth";
import mime from "mime";
import fetch from "node-fetch";
// import { setupMasqr } from "./Masqr.js";
import config from "./config.js";

console.log(chalk.yellow("Starting Node Package Manager server and installing dependencies"));

// Use current working directory as __dirname
const __dirname = process.cwd();

const server = http.createServer();
const app = express();
const bareServer = createBareServer("/fq/");
const PORT = process.env.PORT || 8000;

const cache = new Map();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // Cache for 30 Days

if (config.challenge !== false) {
  console.log(chalk.green("🔒 Password protection is enabled! Listing logins below"));
  Object.entries(config.users).forEach(([username, password]) => {
    console.log(chalk.blue(`Username: ${username}, Password: ${password}`));
  });
  app.use(basicAuth({ users: config.users, challenge: true }));
}

app.get("/e/*", async (req, res, next) => {
  try {
    if (cache.has(req.path)) {
      const { data, contentType, timestamp } = cache.get(req.path);
      if (Date.now() - timestamp > CACHE_TTL) {
        cache.delete(req.path);
      } else {
        res.writeHead(200, { "Content-Type": contentType });
        return res.end(data);
      }
    }

    const baseUrls = {
      "/e/1/": "https://raw.githubusercontent.com/qrs/x/fixy/",
      "/e/2/": "https://raw.githubusercontent.com/3v1/V5-Assets/main/",
      "/e/3/": "https://raw.githubusercontent.com/3v1/V5-Retro/master/",
    };

    let reqTarget;
    for (const [prefix, baseUrl] of Object.entries(baseUrls)) {
      if (req.path.startsWith(prefix)) {
        reqTarget = baseUrl + req.path.slice(prefix.length);
        break;
      }
    }

    if (!reqTarget) {
      return next();
    }

    const asset = await fetch(reqTarget);
    if (!asset.ok) {
      return next();
    }

    const data = Buffer.from(await asset.arrayBuffer());
    const ext = path.extname(reqTarget);
    const no = [".unityweb"];
    const contentType = no.includes(ext)
      ? "application/octet-stream"
      : mime.getType(ext);

    cache.set(req.path, { data, contentType, timestamp: Date.now() });
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  } catch (error) {
    console.error("Error fetching asset:", error);
    res.setHeader("Content-Type", "text/html");
    res.status(500).send("Error fetching the asset");
  }
});

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve all static files from "static" folder at root level
app.use(express.static(path.join(__dirname, 'static')));

app.use("/fq", cors({ origin: true }));

const routes = [
  { path: "/about", file: "about.html" },
  { path: "/apps", file: "apps.html" },
  { path: "/games", file: "Gamess.html" },
  { path: "/play.html", file: "games.html" },
  { path: "/settings", file: "settings.html" },
  { path: "/proxy", file: "tabs.html" },
  { path: "/home", file: "index.html" },
  { path: "/exthangr", file: "proxy.html" },
  { path: "/contact", file: "contactsupport.html" },
  { path: "/search", file: "search.html" },
  { path: "/trickedtheteachers", file: "trickedtheteachers.html" },
];

// Serve other routes from the "static" folder
routes.forEach((route) => {
  app.get(route.path, (_req, res) => {
    res.sendFile(path.join(__dirname, "static", route.file));
  });
});

// 404 handler — serve 404.html from "static"
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, "static", "404.html"));
});

// 500 error handler — serve 404.html from "static"
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, "static", "404.html"));
});

// Bare server and http server setup
server.on("request", (req, res) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeRequest(req, res);
  } else {
    app(req, res);
  }
});

server.on("upgrade", (req, socket, head) => {
  if (bareServer.shouldRoute(req)) {
    bareServer.routeUpgrade(req, socket, head);
  } else {
    socket.end();
  }
});

server.on("listening", () => {
  console.log(
    chalk.green(`NPM Node.js Skelly server will start to run on http://localhost:${PORT}`)
  );
});

console.log(chalk.white("✅ Server is fully operational and ready to accept connections!"));
console.log(chalk.red("Removed pnpm-lock.yaml because of some deploying issues"));
console.log(chalk.blue("Fun fact: did you know that the only reason you can deploy/use npm is because of package.json, index.js and package-lock.json?"));

server.listen({ port: PORT });

// @razzlerazing2 was here >:) SO IF U R HERE THEN LEAVE (jk CUH) so u got rizz or soda fizz
