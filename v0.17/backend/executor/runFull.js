import fs from "fs";
import path from "path";
import executeSpec from "./executeSpec.js";

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function writeJson(p, obj) {
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf-8");
}

// 🔑 NEW: normalize user prompt into a topic
function extractTopic(prompt) {
  let p = prompt.toLowerCase().trim();

  // Remove common instruction phrases
  p = p.replace(/^make a website about\s+/i, "");
  p = p.replace(/^build a website about\s+/i, "");
  p = p.replace(/^create a website about\s+/i, "");
  p = p.replace(/^make a site about\s+/i, "");
  p = p.replace(/^build a site about\s+/i, "");
  p = p.replace(/^create a site about\s+/i, "");

  // Fallback: remove leading verbs
  p = p.replace(/^(make|build|create)\s+/i, "");

  // Clean up
  p = p.replace(/[^a-z0-9\s]/gi, "").trim();

  return p || "website";
}

function slugify(s) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default async function runFull({ prompt, buildRoot }) {
  const topic = extractTopic(prompt);
  const site = slugify(topic);
  const revision = Date.now().toString();

  const siteRoot = path.join(buildRoot, site);
  const revRoot = path.join(siteRoot, revision);

  ensureDir(revRoot);

  const spec = {
    site: {
      name: site,
      topic,
      pages: [
        { slug: "index", title: "Home" },
        { slug: "care", title: "Care" }
      ]
    }
  };

  writeJson(path.join(revRoot, "site.spec.json"), spec);

  await executeSpec({ spec, outputDir: revRoot });

  return {
    mode: "full",
    site,
    revision,
    status: "ok"
  };
}
