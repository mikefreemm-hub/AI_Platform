import express from "express";
import path from "path";
import { fileURLToPath } from "url";

import execute from "./executor/index.js";
import { loadLatestSpec } from "./generator/loadSpec.js";
import { handleCommand } from "./command/handler.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

const BUILD_ROOT = path.join(__dirname, "builds");
const FRONTEND_ROOT = path.join(__dirname, "../frontend");

app.use(express.json());
app.use("/builds", express.static(BUILD_ROOT));
app.use("/", express.static(FRONTEND_ROOT));

app.post("/generate-site", async (req, res) => {
  try {
    const { prompt } = req.body;
    const result = await execute({
      mode: "full",
      prompt,
      buildRoot: BUILD_ROOT
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/command", async (req, res) => {
  try {
    const result = await handleCommand({
      ...req.body,
      buildRoot: BUILD_ROOT
    });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`v0.10 running at http://localhost:${PORT}`);
});
