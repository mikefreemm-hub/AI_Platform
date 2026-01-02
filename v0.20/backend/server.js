import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import { fileURLToPath } from "url";
import archiver from "archiver";

import { planInstruction } from "./spec/planner.js";
import { applyPatch } from "./spec/applyPatch.js";
import { createNewSpec } from "./spec/universalBrain.js";
import { buildSite } from "./build/buildSite.js";
import { diffSpecs } from "./spec/diffEngine.js";
import { parseUndoRequest, resolveUndoTarget } from "./spec/undoEngine.js";

import {
  ensureSite,
  loadSiteSpec,
  loadRevisionSpec,
  saveSiteSpec,
  appendConversation,
  listRevisions,
  createRevision,
  setCurrentRevision,
  getCurrentRevision,
  getBuildIndexPath,
  getStateRoot,
  getBuildRoot,
} from "./state/state.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: "2mb" }));

// No-cache for everything (UI + preview correctness)
app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  res.setHeader("Surrogate-Control", "no-store");
  next();
});

// Static UI + builds
app.use("/builds", express.static(getBuildRoot(), { etag: false, lastModified: false }));
app.use("/", express.static(path.join(__dirname, "public"), { etag: false, lastModified: false }));

/* ---------------------------------------------------------
   API: Health
--------------------------------------------------------- */
app.get("/health", (req, res) => {
  const site = String(req.query?.site || "default").trim() || "default";
  ensureSite(site);
  res.json({ ok: true, site });
});

/* ---------------------------------------------------------
   API: Revisions
--------------------------------------------------------- */
app.get("/revisions", (req, res) => {
  const site = String(req.query?.site || "default").trim() || "default";
  ensureSite(site);
  const current = getCurrentRevision(site);
  const revisions = listRevisions(site);
  res.json({ ok: true, site, current, revisions });
});

app.post("/revisions/set", (req, res) => {
  const site = String(req.body?.site || "default").trim() || "default";
  const revision = String(req.body?.revision || "").trim();
  if (!revision) return res.status(400).json({ ok: false, error: "revision is required" });
  ensureSite(site);

  const indexPath = getBuildIndexPath(site, revision);
  if (!fs.existsSync(indexPath)) {
    return res.status(404).json({ ok: false, error: "revision build not found" });
  }

  // Make this the active spec for future refinements
  const spec = loadRevisionSpec(site, revision);
  saveSiteSpec(site, spec);

  setCurrentRevision(site, revision);
  res.json({
    ok: true,
    site,
    revision,
    previewUrl: `/builds/${encodeURIComponent(site)}/${encodeURIComponent(revision)}/index.html?ts=${Date.now()}`
  });
});

/* ---------------------------------------------------------
   API: Undo (optional direct endpoint)
--------------------------------------------------------- */
app.post("/undo", (req, res) => {
  try {
    const site = String(req.body?.site || "default").trim() || "default";
    const message = String(req.body?.message || "undo").trim() || "undo";
    ensureSite(site);

    const revisions = listRevisions(site);
    const current = getCurrentRevision(site) || (revisions[0]?.revision || "");

    const { targetRevision, steps } = parseUndoRequest(message);
    const resolved = resolveUndoTarget({ revisions, current, targetRevision, steps });

    if (!resolved.ok) {
      return res.json({ ok: true, site, mode: "undo", assistant: resolved.error });
    }

    const target = resolved.target;

    const currentSpec = current ? loadRevisionSpec(site, current) : loadSiteSpec(site);
    const targetSpec = loadRevisionSpec(site, target);

    saveSiteSpec(site, targetSpec);
    setCurrentRevision(site, target);

    const d = diffSpecs(currentSpec, targetSpec);
    const assistant = d?.summary ? `Rolled back. ${d.summary}` : `Rolled back to revision ${target}.`;

    appendConversation(site, { role: "user", text: message, ts: Date.now() });
    appendConversation(site, { role: "assistant", text: assistant, ts: Date.now() });

    return res.json({
      ok: true,
      site,
      mode: "undo",
      revision: target,
      built: true,
      summary: "Rollback applied",
      assistant,
      previewUrl: `/builds/${encodeURIComponent(site)}/${encodeURIComponent(target)}/index.html?ts=${Date.now()}`,
      revisions: listRevisions(site).slice(0, 50),
      current: target
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

/* ---------------------------------------------------------
   API: Export ZIP
--------------------------------------------------------- */
app.post("/export.zip", (req, res) => {
  const site = String(req.body?.site || "default").trim() || "default";
  const revision = String(req.body?.revision || "").trim();

  ensureSite(site);

  const rev = revision || getCurrentRevision(site);
  if (!rev) return res.status(400).json({ ok: false, error: "no revision selected" });

  const indexPath = getBuildIndexPath(site, rev);
  if (!fs.existsSync(indexPath)) return res.status(404).json({ ok: false, error: "build not found" });

  const folder = path.dirname(indexPath);

  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${site}-${rev}.zip"`);

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.on("error", (err) => res.status(500).end(err.message));

  archive.pipe(res);
  archive.directory(folder, false);
  archive.finalize();
});

/* ---------------------------------------------------------
   API: Chat (Universal)
--------------------------------------------------------- */
app.post("/chat", async (req, res) => {
  try {
    const site = String(req.body?.site || "default").trim() || "default";
    const message = String(req.body?.message || "").trim();
    if (!message) return res.status(400).json({ ok: false, error: "message is required" });

    ensureSite(site);

    const specExists = fs.existsSync(path.join(getStateRoot(), "sites", site, "spec.json"));
    const plan = planInstruction({ text: message, specExists });

    // Always store conversation (user message)
    appendConversation(site, { role: "user", text: message, ts: Date.now() });

    // Pure chat response (no build)
    if (plan.type === "chat") {
      const assistant = plan.assistant || "Got it.";
      appendConversation(site, { role: "assistant", text: assistant, ts: Date.now() });
      return res.json({ ok: true, site, mode: "chat", summary: plan.summary, assistant });
    }

    // Clarification needed (no build)
    if (plan.type === "clarify") {
      const assistant = plan.question || "Can you clarify what you want to change?";
      appendConversation(site, { role: "assistant", text: assistant, ts: Date.now() });
      return res.json({ ok: true, site, mode: "clarify", summary: plan.summary, assistant });
    }

    // Conversational undo / rollback (no new build — reuses existing revision build)
    if (plan.type === "undo") {
      const revisions = listRevisions(site);
      const current = getCurrentRevision(site) || (revisions[0]?.revision || "");

      const { targetRevision, steps } = parseUndoRequest(plan.text || message);
      const resolved = resolveUndoTarget({ revisions, current, targetRevision, steps });

      if (!resolved.ok) {
        const assistant = resolved.error;
        appendConversation(site, { role: "assistant", text: assistant, ts: Date.now() });
        return res.json({ ok: true, site, mode: "undo", summary: plan.summary, assistant, current });
      }

      const target = resolved.target;

      const currentSpec = current ? loadRevisionSpec(site, current) : loadSiteSpec(site);
      const targetSpec = loadRevisionSpec(site, target);

      saveSiteSpec(site, targetSpec);
      setCurrentRevision(site, target);

      const d = diffSpecs(currentSpec, targetSpec);
      const assistant = d?.summary ? `Rolled back. ${d.summary}` : `Rolled back to revision ${target}.`;

      appendConversation(site, { role: "assistant", text: assistant, ts: Date.now() });

      return res.json({
        ok: true,
        site,
        mode: "undo",
        revision: target,
        built: true,
        summary: "Rollback applied",
        assistant,
        previewUrl: `/builds/${encodeURIComponent(site)}/${encodeURIComponent(target)}/index.html?ts=${Date.now()}`,
        revisions: listRevisions(site).slice(0, 50),
        current: target
      });
    }

    let spec = null;
    let prevSpec = null;

    if (plan.type === "full") {
      prevSpec = specExists ? loadSiteSpec(site) : null;
      spec = await createNewSpec(plan.prompt);
    } else {
      prevSpec = loadSiteSpec(site);
      spec = applyPatch(prevSpec, plan);
    }

    // Persist latest spec
    saveSiteSpec(site, spec);

    // Build output (revision folder)
    const revision = String(Date.now());
    const outPath = getBuildIndexPath(site, revision);
    buildSite(spec, outPath);

    // Create revision metadata snapshot + set current
    const meta = createRevision(site, revision, {
      mode: plan.type,
      summary: plan.summary,
      message
    });

    setCurrentRevision(site, revision);

    // Explanation layer
    const d = prevSpec ? diffSpecs(prevSpec, spec) : null;
    const assistant = d?.summary || plan.assistant || plan.summary;
    appendConversation(site, { role: "assistant", text: assistant, ts: Date.now() });

    return res.json({
      ok: true,
      site,
      mode: plan.type,
      revision,
      built: true,
      summary: meta.summary,
      assistant,
      previewUrl: `/builds/${encodeURIComponent(site)}/${encodeURIComponent(revision)}/index.html?ts=${Date.now()}`,
      revisions: listRevisions(site).slice(0, 50),
      current: revision,
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
