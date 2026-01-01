import fs from "fs";
import path from "path";

const BASE_DIR = path.resolve("state/sites/default");

function ensureDir() {
  fs.mkdirSync(BASE_DIR, { recursive: true });
}

export function loadSpec() {
  ensureDir();
  const p = path.join(BASE_DIR, "spec.json");
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function saveSpec(spec) {
  ensureDir();
  fs.writeFileSync(
    path.join(BASE_DIR, "spec.json"),
    JSON.stringify(spec, null, 2),
    "utf-8"
  );
}

export function loadConversation() {
  ensureDir();
  const p = path.join(BASE_DIR, "conversation.json");
  if (!fs.existsSync(p)) return [];
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}

export function appendConversation(entry) {
  ensureDir();
  const convo = loadConversation();
  convo.push(entry);
  fs.writeFileSync(
    path.join(BASE_DIR, "conversation.json"),
    JSON.stringify(convo, null, 2),
    "utf-8"
  );
}

export function resetSite() {
  ensureDir();
  fs.rmSync(BASE_DIR, { recursive: true, force: true });
}
