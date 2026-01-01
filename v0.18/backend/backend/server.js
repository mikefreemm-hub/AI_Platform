import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import { generateSpec } from "./generator/spec.js";
import { executeSpec } from "./generator/executor.js";
import { loadLatestSpec } from "./generator/loadSpec.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const BUILD_ROOT = path.join(__dirname, "builds");
const FRONTEND_ROOT = path.join(__dirname, "../frontend");

app.use(express.json());

/* ===============================
   FRONTEND (CONTROL PANEL)
   =============================== */
app.use("/", express.static(FRONTEND_ROOT));

/* ===============================
   GENERATED SITES
   =============================== */
app.use("/builds", express.static(BUILD_ROOT));

/* ===============================
   GENERATE SITE
   =============================== */
app.post("/generate-site", (req, res) => {
  const { prompt } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt required" });
  }

  const spec = generateSpec(prompt);
  const result = executeSpec(spec);

  res.json({
    message: "Site generated",
    result
  });
});

/* ===============================
   EDIT PAGE STRUCTURE
   =============================== */
app.post("/edit-page", (req, res) => {
  const { site, page, sections } = req.body;

  if (!site || !page || !Array.isArray(sections)) {
    return res.status(400).json({
      error: "site, page, sections[] required"
    });
  }

  const spec = loadLatestSpec(BUILD_ROOT, site);
  const pageSpec = spec.site.pages.find(p => p.slug === page);
  if (!pageSpec) {
    return res.status(404).json({ error: "Page not found" });
  }

  pageSpec.sections = sections;
  pageSpec.sectionData ||= {};
  sections.forEach(s => pageSpec.sectionData[s] ||= {});

  const result = executeSpec(spec);

  res.json({
    message: "Page updated",
    result
  });
});

/* ===============================
   EDIT TESTIMONIALS (OPTION A)
   =============================== */
app.post("/edit-testimonials", (req, res) => {
  const { site, page, quotes } = req.body;

  if (!site || !page || !Array.isArray(quotes)) {
    return res.status(400).json({
      error: "site, page, quotes[] required"
    });
  }

  const spec = loadLatestSpec(BUILD_ROOT, site);
  const pageSpec = spec.site.pages.find(p => p.slug === page);
  if (!pageSpec) {
    return res.status(404).json({ error: "Page not found" });
  }

  pageSpec.sectionData ||= {};
  pageSpec.sectionData.testimonials = { quotes };

  const result = executeSpec(spec);

  res.json({
    message: "Testimonials updated",
    quotes,
    result
  });
});

/* ===============================
   SERVER START
   =============================== */
app.listen(3001, () => {
  console.log("v0.9 website generator running at http://localhost:3001");
});
