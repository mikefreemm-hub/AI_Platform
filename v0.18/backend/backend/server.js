import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import runFull from "./executor/runFull.js";
import { applyEdit } from "./executor/applyEdit.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json());

const BUILD_ROOT = path.join(__dirname, "builds");

app.use("/builds", express.static(BUILD_ROOT));
app.use("/", express.static(path.join(__dirname, "public")));

app.post("/generate-site", async (req, res) => {
  const { prompt, intent } = req.body;

  const result = await runFull({
    prompt,
    intent: intent || {},
    buildRoot: BUILD_ROOT
  });

  res.json(result);
});

app.post("/command", async (req, res) => {
  const { site, revision, page, instruction } = req.body;

  const result = await applyEdit({
    buildRoot: BUILD_ROOT,
    site,
    revision,
    page,
    instruction
  });

  res.json(result);
});

app.listen(PORT, () => {
  console.log(`v0.17 running at http://localhost:${PORT}`);
});
