import fs from "fs";
import path from "path";

import { generateSpec } from "../generator/spec.js";
import { executeSpec } from "../generator/executor.js";
import { setCurrentRevision, setCurrentSite } from "../spec/currentRevision.js";

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export default async function runFull({ prompt, buildRoot }) {
  if (!prompt) throw new Error("prompt required");

  const spec = generateSpec(prompt);
  const site = spec.site.name;

  const revision = Date.now().toString();
  const siteRoot = path.join(buildRoot, site);
  const revRoot = path.join(siteRoot, "revisions", revision);

  ensureDir(revRoot);

  // 1. Persist spec
  fs.writeFileSync(
    path.join(revRoot, "site.spec.json"),
    JSON.stringify(spec, null, 2),
    "utf-8"
  );

  // 2. 🔑 RENDER HTML INTO REVISION
  await executeSpec(spec, revRoot);

  // 3. Update pointers
  setCurrentRevision(buildRoot, site, revision);
  setCurrentSite(buildRoot, site);

  return { mode: "full", site, revision, status: "ok" };
}
