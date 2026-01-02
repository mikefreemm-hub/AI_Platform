import fs from "fs";
import path from "path";

function root() {
  return process.cwd();
}

export function getStateRoot() {
  return path.join(root(), "state");
}

export function getBuildRoot() {
  return path.join(root(), "builds");
}

function siteDir(site) {
  return path.join(getStateRoot(), "sites", site);
}

function revDir(site) {
  return path.join(getStateRoot(), "revisions", site);
}

export function ensureSite(site) {
  fs.mkdirSync(siteDir(site), { recursive: true });
  fs.mkdirSync(revDir(site), { recursive: true });

  const specPath = path.join(siteDir(site), "spec.json");
  if (!fs.existsSync(specPath)) {
    fs.writeFileSync(specPath, JSON.stringify({ site: { title: "Untitled", pages: [{ id: "home", title: "Home", sections: [] }] } }, null, 2), "utf-8");
  }

  const convPath = path.join(siteDir(site), "conversation.json");
  if (!fs.existsSync(convPath)) {
    fs.writeFileSync(convPath, JSON.stringify([], null, 2), "utf-8");
  }

  const currentPath = path.join(siteDir(site), "current.json");
  if (!fs.existsSync(currentPath)) {
    fs.writeFileSync(currentPath, JSON.stringify({ revision: "" }, null, 2), "utf-8");
  }
}

export function loadSiteSpec(site) {
  const p = path.join(siteDir(site), "spec.json");
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function loadRevisionSpec(site, revision) {
  const p = path.join(revDir(site), String(revision), "spec.json");
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function saveSiteSpec(site, spec) {
  const p = path.join(siteDir(site), "spec.json");
  fs.writeFileSync(p, JSON.stringify(spec, null, 2), "utf-8");
}

export function appendConversation(site, msg) {
  const p = path.join(siteDir(site), "conversation.json");
  let arr = [];
  try { arr = JSON.parse(fs.readFileSync(p, "utf-8")); } catch {}
  arr.push(msg);
  fs.writeFileSync(p, JSON.stringify(arr, null, 2), "utf-8");
}

export function getCurrentRevision(site) {
  const p = path.join(siteDir(site), "current.json");
  try {
    const data = JSON.parse(fs.readFileSync(p, "utf-8"));
    return data.revision || "";
  } catch {
    return "";
  }
}

export function setCurrentRevision(site, revision) {
  const p = path.join(siteDir(site), "current.json");
  fs.writeFileSync(p, JSON.stringify({ revision: String(revision || "") }, null, 2), "utf-8");
}

export function getBuildIndexPath(site, revision) {
  return path.join(getBuildRoot(), site, String(revision), "index.html");
}

export function createRevision(site, revision, meta) {
  const dir = path.join(revDir(site), String(revision));
  fs.mkdirSync(dir, { recursive: true });

  const normalized = {
    site,
    revision: String(revision),
    createdAt: Date.now(),
    mode: meta?.mode || "refine",
    summary: meta?.summary || "",
    message: meta?.message || ""
  };

  fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(normalized, null, 2), "utf-8");

  const spec = loadSiteSpec(site);
  fs.writeFileSync(path.join(dir, "spec.json"), JSON.stringify(spec, null, 2), "utf-8");

  return normalized;
}

export function listRevisions(site) {
  const dir = revDir(site);
  fs.mkdirSync(dir, { recursive: true });

  const revs = fs.readdirSync(dir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const out = [];
  for (const r of revs) {
    const metaPath = path.join(dir, r, "meta.json");
    if (!fs.existsSync(metaPath)) continue;
    try {
      out.push(JSON.parse(fs.readFileSync(metaPath, "utf-8")));
    } catch {}
  }

  out.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  return out;
}
