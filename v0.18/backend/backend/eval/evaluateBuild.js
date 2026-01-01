import fs from "fs";
import path from "path";
import { getRubric } from "./rubric.js";

function exists(p) {
  return fs.existsSync(p);
}

function isNonEmptyFile(p) {
  try {
    const st = fs.statSync(p);
    return st.isFile() && st.size > 0;
  } catch {
    return false;
  }
}

function safeReadJson(p) {
  const raw = fs.readFileSync(p, "utf-8");
  return JSON.parse(raw);
}

function listHtmlFiles(dir) {
  const out = [];
  const stack = [dir];

  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile() && e.name.toLowerCase().endsWith(".html")) out.push(full);
    }
  }
  return out;
}

function listFiles(dir) {
  const out = [];
  const stack = [dir];

  while (stack.length) {
    const cur = stack.pop();
    const entries = fs.readdirSync(cur, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(cur, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile()) out.push(full);
    }
  }
  return out;
}

export function evaluateBuild({ buildRoot, site, revision }) {
  if (!buildRoot) throw new Error("buildRoot required");
  if (!site) throw new Error("site required");
  if (!revision) throw new Error("revision required");

  const rubric = getRubric();

  const siteRoot = path.join(buildRoot, site);
  const revRoot = path.join(siteRoot, revision);
  const specPath = path.join(revRoot, "site.spec.json");
  const indexPath = path.join(revRoot, "index.html");

  const checks = [];
  const recs = [];

  // CHECK: spec_exists
  checks.push({
    id: "spec_exists",
    pass: exists(specPath),
    details: specPath
  });

  // CHECK: spec_valid_json
  let spec = null;
  if (exists(specPath)) {
    try {
      spec = safeReadJson(specPath);
      checks.push({ id: "spec_valid_json", pass: true, details: "ok" });
    } catch (e) {
      checks.push({ id: "spec_valid_json", pass: false, details: e.message });
      recs.push("Spec JSON is invalid. Ensure generator writes valid site.spec.json.");
    }
  } else {
    checks.push({ id: "spec_valid_json", pass: false, details: "spec missing" });
  }

  // CHECK: site_folder_exists
  checks.push({
    id: "site_folder_exists",
    pass: exists(siteRoot),
    details: siteRoot
  });

  // CHECK: revision_folder_exists
  checks.push({
    id: "revision_folder_exists",
    pass: exists(revRoot),
    details: revRoot
  });

  // CHECK: index_html_exists
  checks.push({
    id: "index_html_exists",
    pass: isNonEmptyFile(indexPath),
    details: indexPath
  });
  if (!isNonEmptyFile(indexPath)) {
    recs.push("index.html missing or empty. Ensure executeSpec renders index.html into the revision folder.");
  }

  // CHECK: has_multiple_pages (simple heuristic: more than 1 html file)
  let htmlCount = 0;
  if (exists(revRoot)) {
    try {
      htmlCount = listHtmlFiles(revRoot).length;
    } catch {}
  }
  const multiPass = htmlCount >= 2;
  checks.push({
    id: "has_multiple_pages",
    pass: multiPass,
    details: `htmlFiles=${htmlCount}`
  });
  if (!multiPass) {
    recs.push("Only one HTML page detected. Consider generating at least 2 pages to validate multi-page execution.");
  }

  // CHECK: static_assets_present (css/js/images)
  let assetCount = 0;
  if (exists(revRoot)) {
    try {
      const files = listFiles(revRoot);
      assetCount = files.filter(f => {
        const n = f.toLowerCase();
        return n.endsWith(".css") || n.endsWith(".js") || n.endsWith(".png") || n.endsWith(".jpg") || n.endsWith(".svg");
      }).length;
    } catch {}
  }
  const assetsPass = assetCount >= 1;
  checks.push({
    id: "static_assets_present",
    pass: assetsPass,
    details: `assetFiles=${assetCount}`
  });
  if (!assetsPass) {
    recs.push("No static assets detected (.css/.js/images). Consider emitting at least one CSS file for visible styling proof.");
  }

  // CHECK: no_empty_files
  let emptyFiles = 0;
  if (exists(revRoot)) {
    try {
      const files = listFiles(revRoot);
      emptyFiles = files.filter(f => {
        try { return fs.statSync(f).size === 0; } catch { return false; }
      }).length;
    } catch {}
  }
  const emptyPass = emptyFiles === 0;
  checks.push({
    id: "no_empty_files",
    pass: emptyPass,
    details: `emptyFiles=${emptyFiles}`
  });
  if (!emptyPass) {
    recs.push("Some output files are empty. Ensure all emitted artifacts contain content.");
  }

  // SCORE
  const weights = new Map(rubric.checks.map(c => [c.id, c.weight]));
  const total = rubric.checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce((s, c) => s + (c.pass ? (weights.get(c.id) || 0) : 0), 0);
  const score = Math.round((earned / total) * 100);

  // Add spec-based suggestion
  if (spec?.site?.pages && Array.isArray(spec.site.pages) && spec.site.pages.length < 2) {
    recs.push("Spec has <2 pages. Expand generator spec.pages to validate multi-page builds.");
  }

  return {
    rubricVersion: rubric.version,
    site,
    revision,
    score,
    earned,
    total,
    checks,
    recommendations: Array.from(new Set(recs))
  };
}
