import fs from "fs";
import path from "path";

import { generateSpec } from "../generator/spec.js";
import { executeSpec } from "../generator/executor.js";
import { setCurrentRevision, setCurrentSite } from "../spec/currentRevision.js";

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export default async function runFull({ prompt, intent = {}, buildRoot }) {
  if (!buildRoot) throw new Error("runFull requires buildRoot");
  if (!prompt) throw new Error("runFull requires prompt");

  // 1) Build spec
  const spec = generateSpec(prompt);

  // Normalize intent into spec (safe future hook)
  spec.site.tone = intent.tone || spec.site.tone || "neutral";
  spec.site.quality = intent.quality || spec.site.quality || "basic";

  const site = spec.site.name || "site";

  // 2) Create revision folder
  const rev = String(Date.now());
  const revisionsDir = path.join(buildRoot, site, "revisions");
  const outRoot = path.join(revisionsDir, rev);

  ensureDir(outRoot);

  // 3) Save spec for traceability
  fs.writeFileSync(
    path.join(outRoot, "site.spec.json"),
    JSON.stringify(spec, null, 2),
    "utf-8"
  );

  // 4) Generate HTML files into the revision folder
  await executeSpec(spec, outRoot);

  // 5) Set pointers
  setCurrentRevision(buildRoot, site, rev);
  setCurrentSite(buildRoot, site);

  return {
    mode: "site",
    site,
    revision: rev,
    status: "ok"
  };
}
