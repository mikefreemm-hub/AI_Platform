import express from "express";
import fs from "fs";
import path from "path";
import cors from "cors";
import archiver from "archiver";
import { fileURLToPath } from "url";

import {
  getLast,
  setLast,
  loadSpec,
  saveSpec,
  appendConversation,
  resetAllState
} from "./memory/siteStore.js";

import { renderHtml } from "./renderer/renderHtml.js";
import { createNewSpec, refineSpec } from "./spec/universalBrain.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/builds", express.static(path.join(__dirname, "builds")));

/* ---------------- CHAT (UNIVERSAL) ---------------- */

app.post("/chat", async (req, res) => {
  const { message } = req.body || {};
  const text = String(message || "").trim();
  if (!text) return res.status(400).json({ error: "Missing message" });

  const last = getLast();
  const site = last.site || "default";

  appendConversation(site, { role: "user", content: text });

  const existing = loadSpec(site);
  const next = existing ? refineSpec(existing, text) : createNewSpec(text);

  saveSpec(site, next);
  setLast({ site, revision: Date.now(), currentPage: "index", ts: Date.now() });

  res.json({ mode: "chat", site, spec: next });
});

/* ---------------- EXPORT HTML ---------------- */

app.post("/export", (req, res) => {
  const last = getLast();
  const site = last.site || "default";
  const spec = loadSpec(site);

  if (!spec) return res.status(400).json({ error: "No site to export" });

  const html = renderHtml(spec);
  const outDir = path.join(__dirname, "builds", site);
  const outPath = path.join(outDir, "index.html");

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, html, "utf-8");

  res.json({ ok: true, path: `/builds/${site}/index.html` });
});

/* ---------------- EXPORT ZIP ---------------- */

app.post("/export.zip", (req, res) => {
  const last = getLast();
  const site = last.site || "default";
  const spec = loadSpec(site);

  if (!spec) return res.status(400).json({ error: "No site to export" });

  const html = renderHtml(spec);
  const outDir = path.join(__dirname, "builds", site);
  const outPath = path.join(outDir, "index.html");

  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(outPath, html, "utf-8");

  const zipPath = path.join(__dirname, "builds", `${site}.zip`);
  const output = fs.createWriteStream(zipPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  output.on("close", () => res.download(zipPath, "site.zip"));
  archive.on("error", err => { throw err; });

  archive.pipe(output);
  archive.directory(outDir, false);
  archive.finalize();
});

/* ---------------- RESET ---------------- */

app.post("/reset", (req, res) => {
  resetAllState();
  res.json({ ok: true });
});

app.listen(3001, () => {
  console.log("🚀 AI Platform v0.20 (Universal Chat) running at http://localhost:3001");
});
