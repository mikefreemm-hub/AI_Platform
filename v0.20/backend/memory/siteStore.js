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
  ensureDir(path.join(STATE_DIR, "revisions"));
}

function siteDir(site = "default") {
  return path.join(SITES_DIR, site);
}

function safeReadJson(p, fallback) {
  try {
    if (!fs.existsSync(p)) return fallback;
    const raw = fs.readFileSync(p, "utf-8");
    return JSON.parse(raw || "null") ?? fallback;
  } catch {
    return fallback;
  }
}

function safeWriteJson(p, obj) {
  ensureState();
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2), "utf-8");
}

export function ensureSite(site = "default") {
  ensureState();
  const dir = siteDir(site);
  ensureDir(dir);

  const convo = path.join(dir, "conversation.json");
  const spec = path.join(dir, "spec.json");

  if (!fs.existsSync(convo)) fs.writeFileSync(convo, "[]", "utf-8");
  if (!fs.existsSync(spec)) fs.writeFileSync(spec, "{}", "utf-8");

  return dir;
}

export function getLast() {
  ensureState();
  return safeReadJson(LAST_PATH, { site: "default", revision: null, currentPage: "index", ts: 0 });
}

export function setLast(obj) {
  ensureState();
  safeWriteJson(LAST_PATH, obj);
}

export function loadConversation(site = "default") {
  const dir = ensureSite(site);
  return safeReadJson(path.join(dir, "conversation.json"), []);
}

export function appendConversation(site = "default", msg) {
  const dir = ensureSite(site);
  const p = path.join(dir, "conversation.json");
  const convo = safeReadJson(p, []);
  convo.push({ ...msg, ts: Date.now() });
  safeWriteJson(p, convo);
}

export function loadSpec(site = "default") {
  const dir = ensureSite(site);
  return safeReadJson(path.join(dir, "spec.json"), null);
}

export function saveSpec(site = "default", spec) {
  const dir = ensureSite(site);
  safeWriteJson(path.join(dir, "spec.json"), spec);
}

export function resetAllState() {
  // wipe everything but keep root folder
  ensureState();

  try { fs.rmSync(path.join(STATE_DIR, "revisions"), { recursive: true, force: true }); } catch {}
  try { fs.rmSync(path.join(STATE_DIR, "sites"), { recursive: true, force: true }); } catch {}
  try { fs.rmSync(LAST_PATH, { force: true }); } catch {}

  // recreate baseline
  ensureDir(path.join(STATE_DIR, "revisions"));
  ensureDir(path.join(STATE_DIR, "sites", "default"));

  safeWriteJson(LAST_PATH, { site: "default", revision: null, currentPage: "index", ts: 0 });
  fs.writeFileSync(path.join(STATE_DIR, "sites", "default", "conversation.json"), "[]", "utf-8");
  fs.writeFileSync(path.join(STATE_DIR, "sites", "default", "spec.json"), "{}", "utf-8");
}
