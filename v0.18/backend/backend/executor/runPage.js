import fs from "fs";
import path from "path";

import { getCurrentRevision } from "../spec/currentRevision.js";
import { patchSpec } from "../spec/patchSpec.js";
import { executeSpec } from "../generator/executor.js";

export default async function runPage({ buildRoot, site, patch }) {
  if (!patch?.slug) throw new Error("Patch requires slug");

  const current = getCurrentRevision(buildRoot, site);
  const prevRoot = path.join(buildRoot, site, "revisions", current);

  const specPath = path.join(prevRoot, "site.spec.json");
  if (!fs.existsSync(specPath)) throw new Error("Missing site.spec.json");

  const spec = JSON.parse(fs.readFileSync(specPath, "utf-8"));

  const next = Date.now().toString();
  const nextRoot = path.join(buildRoot, site, "revisions", next);
  fs.mkdirSync(nextRoot, { recursive: true });

  const patched = patchSpec(spec, patch);

  fs.writeFileSync(
    path.join(nextRoot, "site.spec.json"),
    JSON.stringify(patched, null, 2),
    "utf-8"
  );

  await executeSpec(
    { ...patched, site: { ...patched.site, pages: patched.site.pages.filter(p => p.slug === patch.slug) } },
    nextRoot
  );

  return { from: current, to: next, status: "patched" };
}
