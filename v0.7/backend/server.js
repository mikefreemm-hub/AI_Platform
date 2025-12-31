import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runExecution } from "./execution/runner.js";

const app = express();
app.use(cors());
app.use(express.json({ limit: "1mb" }));

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TRACE_DIR = "C:/Users/mikef/AI_Platform/v0.7/backend/traces";

// ---------- Trace API ----------
app.get("/traces", (req, res) => {
  if (!fs.existsSync(TRACE_DIR)) return res.json([]);
  const files = fs.readdirSync(TRACE_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json", ""))
    .sort()
    .reverse();
  res.json(files);
});

app.get("/traces/:id", (req, res) => {
  const filePath = path.join(TRACE_DIR, `${req.params.id}.json`);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: "Trace not found" });
  const raw = fs.readFileSync(filePath, "utf8");
  res.json(JSON.parse(raw));
});

// ---------- Chat API ----------
app.post("/chat", async (req, res) => {
  try {
    const result = await runExecution({
      version: "v0.7",
      input: req.body,
      execute: async ({ addStep, finalize }) => {
        // Minimal demo “brain” — replace later with real entity logic
        addStep({
          id: "decision-1",
          type: "decision",
          input: req.body,
          output: "single-response",
          timestamp: new Date().toISOString()
        });

        addStep({
          id: "reflection-1",
          type: "reflection",
          input: "analyze",
          output: "ready",
          timestamp: new Date().toISOString()
        });

        const reply = `Hello from v0.7 — received: ${req.body?.prompt ?? "(no prompt)"}`;

        addStep({
          id: "output-1",
          type: "output",
          input: req.body?.prompt,
          output: reply,
          timestamp: new Date().toISOString()
        });

        finalize(reply);
        return reply;
      }
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---------- Serve UI (ChatGPT-style) ----------
const FRONTEND_DIR = path.resolve(__dirname, "../frontend");
app.use("/", express.static(FRONTEND_DIR));

app.get("/", (req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, "index.html"));
});

app.listen(3001, () => {
  console.log("v0.7 backend running on http://localhost:3001");
});
