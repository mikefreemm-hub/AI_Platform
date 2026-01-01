import fs from "fs";
import path from "path";
import crypto from "crypto";

function hashFile(p) {
  const buf = fs.readFileSync(p);
  return crypto.createHash("sha256").update(buf).digest("hex");
}

function listFiles(root) {
  const out = [];
  function walk(dir) {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(full);
      else out.push(full);
    }
  }
  walk(root);
  return out;
}

export function diffRevisions(fromRoot, toRoot) {
  const fromFiles = listFiles(fromRoot).map(p => p.replace(fromRoot + path.sep, ""));
  const toFiles   = listFiles(toRoot).map(p => p.replace(toRoot + path.sep, ""));

  const fromSet = new Set(fromFiles);
  const toSet = new Set(toFiles);

  const added = toFiles.filter(f => !fromSet.has(f));
  const removed = fromFiles.filter(f => !toSet.has(f));

  const common = toFiles.filter(f => fromSet.has(f));
  const changed = [];

  for (const rel of common) {
    const a = path.join(fromRoot, rel);
    const b = path.join(toRoot, rel);
    if (hashFile(a) !== hashFile(b)) changed.push(rel);
  }

  return { added, removed, changed };
}
