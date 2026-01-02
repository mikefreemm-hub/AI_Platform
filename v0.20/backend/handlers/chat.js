import path from "path";
import fs from "fs";

import { planInstruction } from "../spec/planner.js";
import { applyDeferredIntent, createNewSpec } from "../spec/universalBrain.js";
import { buildSite } from "../build/buildSite.js";

const STATE_ROOT = path.resolve("backend/state");
const BUILDS_ROOT = path.resolve("backend/builds");

function getSiteState(site){
  const p = path.join(STATE_ROOT, "sites", site, "spec.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

function saveSiteState(site, spec){
  const dir = path.join(STATE_ROOT, "sites", site);
  fs.mkdirSync(dir, { recursive:true });
  fs.writeFileSync(path.join(dir, "spec.json"), JSON.stringify(spec,null,2));
}

export async function chat(req, res){
  const { site="default", message } = req.body || {};
  if (!message) return res.json({ ok:false, error:"No message" });

  let spec = getSiteState(site);
  let mode = "refine";

  if (!spec){
    spec = await createNewSpec(message);
    mode = "full";
  }

  spec.__genericText = message;

  const plan = planInstruction(message, spec);
  if (plan?.reset){
    spec = await createNewSpec(message);
    mode = "full";
  } else {
    spec = applyDeferredIntent(spec);
  }

  saveSiteState(site, spec);

  const revision = Date.now().toString();
  const outDir = path.join(BUILDS_ROOT, site, revision);
  const outFile = path.join(outDir, "index.html");

  buildSite(spec, outFile);

  const pages = (spec.site.pages || []).map(p => p.id);

  res.json({
    ok: true,
    site,
    mode,
    revision,
    summary:
      mode === "full"
        ? "Generating a new site from natural language"
        : "Refining existing site based on instruction",
    previewUrl: `/builds/${site}/${revision}/index.html`,
    pages
  });
}
