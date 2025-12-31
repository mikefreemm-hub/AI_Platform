import fs from "fs";
import path from "path";

const TRACE_DIR = "C:/Users/mikef/AI_Platform/v0.7/backend/traces";

export function persistRun(graph) {
  if (!graph.finalized_at) {
    throw new Error("LAW VIOLATION: cannot persist unfinalized graph");
  }

  if (!fs.existsSync(TRACE_DIR)) {
    fs.mkdirSync(TRACE_DIR, { recursive: true });
  }

  const filePath = path.join(TRACE_DIR, `${graph.run_id}.json`);
  fs.writeFileSync(filePath, JSON.stringify(graph, null, 2));

  return filePath;
}
