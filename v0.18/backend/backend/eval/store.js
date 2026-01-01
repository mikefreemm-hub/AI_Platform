import fs from "fs";
import path from "path";
import crypto from "crypto";

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

export function getEvalStorePath(dataRoot) {
  ensureDir(dataRoot);
  return path.join(dataRoot, "self-evals.jsonl");
}

export function saveEval({ dataRoot, evalResult }) {
  const p = getEvalStorePath(dataRoot);
  const id = crypto.randomUUID();

  const record = {
    id,
    createdAt: new Date().toISOString(),
    ...evalResult
  };

  fs.appendFileSync(p, JSON.stringify(record) + "\n", "utf-8");
  return record;
}

export function getEvalById({ dataRoot, id }) {
  const p = getEvalStorePath(dataRoot);
  if (!fs.existsSync(p)) return null;

  const lines = fs.readFileSync(p, "utf-8").split("\n").filter(Boolean);
  for (let i = lines.length - 1; i >= 0; i--) {
    const rec = JSON.parse(lines[i]);
    if (rec.id === id) return rec;
  }
  return null;
}
