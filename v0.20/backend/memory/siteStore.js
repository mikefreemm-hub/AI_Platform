import fs from "fs";
import path from "path";

const STATE_DIR = path.resolve("state");
const LAST_PATH = path.join(STATE_DIR, "last.json");
const SITES_DIR = path.join(STATE_DIR, "sites");

function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}

function ensureState() {
  ensureDir(STATE_DIR);
  ensureDir(SITES_DIR);
}

function siteDir(site = "default") {
  ensureState();
  return path.join(SITES_DIR, site);
}

export function getLast() {
  ensureState();
  if (!fs.existsSync(LAST_PATH)) {
    return { site: "default", revision: null, currentPage: "index", ts: 0 };
  }
  return JSON.parse(fs.readFileSync(LAST_PATH, "utf-8"));
}

export function setLast(next) {
  ensureState();
  fs.writeFileSync(LAST_PATH, JSON.stringify(next, null, 2), "utf-8");
}

export function ensureSite(site = "default") {
  const dir = siteDir(site);
  ensureDir(dir);

  const convo = path.join(dir, "conversation.json");
  const spec = path.join(dir, "spec.json");

  if (!fs.existsSync(convo)) fs.writeFileSync(convo, "[]", "utf-8");
  if (!fs.existsSync(spec)) fs.writeFileSync(spec, "{}", "utf-8");

  return dir;
}

export function loadConversation(site = "default") {
  const dir = ensureSite(site);
  const p = path.join(dir, "conversation.json");
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function saveConversation(site = "default", convo = []) {
  const dir = ensureSite(site);
  fs.writeFileSync(path.join(dir, "conversation.json"), JSON.stringify(convo, null, 2), "utf-8");
}

export function appendConversation(site = "default", entry) {
  const convo = loadConversation(site);
  convo.push(entry);
  saveConversation(site, convo);
  return convo;
}

export function loadSpec(site = "default") {
  const dir = ensureSite(site);
  const p = path.join(dir, "spec.json");
  const raw = fs.readFileSync(p, "utf-8").trim();
  if (!raw) return null;
  const parsed = JSON.parse(raw);
  if (!parsed || !parsed.site) return null;
  return parsed;
}

export function saveSpec(site = "default", spec) {
  const dir = ensureSite(site);
  fs.writeFileSync(path.join(dir, "spec.json"), JSON.stringify(spec, null, 2), "utf-8");
}

export function resetAllState() {
  ensureState();
  // wipe everything but keep folders
  try { fs.rmSync(path.join(STATE_DIR, "revisions"), { recursive: true, force: true }); } catch {}
  try { fs.rmSync(path.join(STATE_DIR, "sites"), { recursive: true, force: true }); } catch {}
  try { fs.rmSync(LAST_PATH, { force: true }); } catch {}

  ensureDir(path.join(STATE_DIR, "revisions"));
  ensureDir(path.join(STATE_DIR, "sites", "default"));

  fs.writeFileSync(LAST_PATH, JSON.stringify({ site: "default", revision: null, currentPage: "index", ts: 0 }, null, 2), "utf-8");
  fs.writeFileSync(path.join(STATE_DIR, "sites", "default", "conversation.json"), "[]", "utf-8");
  fs.writeFileSync(path.join(STATE_DIR, "sites", "default", "spec.json"), "{}", "utf-8");
}
