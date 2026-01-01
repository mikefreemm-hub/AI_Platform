import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import archiver from "archiver";
import { fileURLToPath } from "url";

import {
  loadSpec,
  saveSpec,
  loadConversation,
  appendConversation,
  resetSite
} from "./memory/siteStore.js";

import { renderHtml } from "./renderer/renderHtml.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use("/builds", express.static(path.join(__dirname, "builds")));

let currentSpec = loadSpec();
let conversation = loadConversation();

/* ---------------- CHAT ---------------- */

app.post("/chat", async (req, res) => {
  const { message } = req.body;
  appendConversation({ role: "user", content: message });
  conversation = loadConversation();

  res.json({ spec: currentSpec });
});

/* ---------------- EXPORT HTML ---------------- */

app.post("/export", (req, res) => {
  if (!currentSpec) {
    return res.status(400).json({ error: "No site to export" });
  }

  const html = renderHtml(currentSpec);
  const outDir = path.join(__dirname, "builds", "site");
  const outPath = path.join(outDir, "index.html");

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, html, "utf-8");

  res.json({ ok: true, path: "/builds/site/index.html" });
});

/* ---------------- EXPORT ZIP ---------------- */

app.post("/export.zip", (req, res) => {
  if (!currentSpec) {
    return res.status(400).json({ error: "No site to export" });
  }

  const outDir = path.join(__dirname, "builds", "site");
  const zipPath = path.join(__dirname, "builds", "site.zip");

  // Ensure HTML exists
  const html = renderHtml(currentSpec);
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "index.html"), html, "utf-8");

  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => {
    res.download(zipPath, "site.zip");
  });

  archive.on("error", err => {
    throw err;
  });

  archive.pipe(output);
  archive.directory(outDir, false);
  archive.finalize();
});

/* ---------------- RESET ---------------- */

app.post("/reset", (req, res) => {
  resetSite();
  currentSpec = null;
  conversation = [];
  res.json({ ok: true });
});

app.listen(3001, () => {
  console.log("🚀 AI Platform v0.19 (ZIP export) running at http://localhost:3001");
});
