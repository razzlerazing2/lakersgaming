// skids, better hop off
import fs from "node:fs"
import http from "node:http";
import path from "node:path";
import { createBareServer } from "@nebula-services/bare-server-node";
import chalk from "chalk";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mime from "mime";
import fetch from "node-fetch";

console.log(chalk.yellow("Running server..."));

const __dirname = process.cwd();
const server = http.createServer();
const app = express();
const bareServer = createBareServer("/fq/");
const PORT = process.env.PORT || 5000;
const cache = new Map();
const CACHE_TTL = 30 * 24 * 60 * 60 * 1000; // Cache for 30 Days

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

// Add cache control headers for Replit environment
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

app.use(express.static(path.join(__dirname, "totallynotthefrontendtrust")));
app.use("/fq", cors({ origin: true }));

const routes = [
  { path: "/URLexeNcode_Iframe5.js", file: "/real_files/apps.html" },
  { path: "/URLexeNcode_Iframe3.js", file: "/real_files/games.html" },
  { path: "/URLexeNcode_Iframe6.js", file: "/real_files/settings.html"},
  { path: "/URLexeNcode_Iframe7.js", file: "/real_files/proxysearch.html" },
  { path: "/learnmathhere", file: "/trick_files/index.html" },
  { path: "/signup", file: "/trick_files/password_input.html" },
  { path: "/URLexeNcode_Iframe4.js", file: "/real_files/index.html" },
  { path: "/URLexeNcode_Iframe2.js", file: "/real_files/anime.html" },
  { path: "/URLexeNcode_Iframe1.js", file: "/real_files/song.html" },
  { path: "/testing", file: "/real_files/testing.html" },
  { path: "/m", file: "/real_files/m.html" },
  { path: "/ts_1.js", file: "test_files/test_subject1.html"},
    { path: "/ts_2.js", file: "test_files/test_subject2.html"},
];

// biome-ignore lint/complexity/noForEach:
routes.forEach((route) => {
  app.get(route.path, (_req, res) => {
    res.sendFile(path.join(__dirname, "totallynotthefrontendtrust", route.file));
  });
});

app.use((req, res, next) => {
  res.status(404).sendFile(path.join(__dirname, "totallynotthefrontendtrust", "404.html"));
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).sendFile(path.join(__dirname, "totallynotthefrontendtrust", "404.html"));
});

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
  console.log(chalk.whiteBright("✅ Destiny Rise server ready at:"), chalk.cyan(`http://localhost:${PORT}`));
});
  console.log(chalk.white("✅ Server is fully operational and ready to accept connections!"));
  console.log(chalk.red("Removed pnpm-lock.yaml because of some deploying issues"));
server.listen({ port: PORT, host: '0.0.0.0' });
// @razzlerazing2: "You don't got rizz u got soda fizz" Audience: "OHHHHHHHHHH ROAST W @razzlerazing2"