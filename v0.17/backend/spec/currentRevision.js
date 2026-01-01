import fs from "fs";
import path from "path";

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export function getCurrentSite(buildRoot) {
  const p = path.join(buildRoot, "currentSite.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8")).site || null;
}

export function setCurrentSite(buildRoot, site) {
  ensureDir(buildRoot);
  const p = path.join(buildRoot, "currentSite.json");
  fs.writeFileSync(p, JSON.stringify({ site }, null, 2), "utf-8");
}

export function getCurrentRevision(buildRoot, site) {
  if (!site) throw new Error("getCurrentRevision requires site");
  const p = path.join(buildRoot, site, "current.json");
  if (!fs.existsSync(p)) throw new Error(`No current revision pointer found for site: ${site}`);
  return JSON.parse(fs.readFileSync(p, "utf-8")).revision;
}

export function setCurrentRevision(buildRoot, site, revision) {
  if (!site) throw new Error("setCurrentRevision requires site");
  ensureDir(path.join(buildRoot, site));
  const p = path.join(buildRoot, site, "current.json");
  fs.writeFileSync(p, JSON.stringify({ revision }, null, 2), "utf-8");
}
