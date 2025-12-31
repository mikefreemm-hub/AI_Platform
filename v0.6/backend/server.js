import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { randomUUID } from "crypto";

import {
  loadPromptContract,
  loadPrompt,
  validatePromptMutation
} from "./contracts/validatePromptContract.js";

import {
  createExecutionGraph,
  addStep,
  finalizeGraph
} from "./trace/graph.js";

import {
  getSessionMemory,
  writeSessionMemory
} from "./memory/session.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

/* Serve frontend */
const frontendPath = path.join(__dirname, "..", "frontend");
app.use(express.static(frontendPath));
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

/* Capability flags */
const capabilities = {
  trace: true,
  explain: true,
  memory: "session",
  tools: false
};

app.get("/capabilities", (req, res) => {
  res.json(capabilities);
});

const contract = loadPromptContract();

/* ===== CHAT ===== */
app.post("/chat", async (req, res) => {
  const traceEnabled = req.body.trace !== false;
  const graph = createExecutionGraph({ traceEnabled });
  const sessionId = req.body.session_id || randomUUID();

  try {
    const { sessionMutation } = req.body;

    validatePromptMutation(contract, {
      system: req.body.system,
      developer: req.body.developer,
      session: sessionMutation
    });

    /* Read memory */
    const memory = getSessionMemory(sessionId);
    addStep(graph, {
      id: "memory.read",
      type: "transform",
      input: sessionId,
      output: memory
    });

    /* Write memory (explicit) */
    if (sessionMutation) {
      writeSessionMemory(sessionId, sessionMutation);
      addStep(graph, {
        id: "memory.write",
        type: "transform",
        input: sessionMutation,
        output: "written"
      });
    }

    /* Load prompts */
    const systemPrompt = loadPrompt(contract.prompts.system.path);
    const developerPrompt = loadPrompt(contract.prompts.developer.path);
    const sessionPrompt =
      sessionMutation ?? loadPrompt(contract.prompts.session.path);

    /* ===== MODEL STEP (v0.5 parity) ===== */
    const messages = [
      { role: "system", content: systemPrompt },
      { role: "developer", content: developerPrompt },
      ...memory.map(m => ({ role: "user", content: m.entry })),
      { role: "user", content: sessionPrompt }
    ];

    const modelResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: req.body.deterministic ? 0 : 0.7
      })
    }).then(r => r.json());

    const answer = modelResponse.choices?.[0]?.message?.content || "";

    addStep(graph, {
      id: "model.answer",
      type: "model",
      input: messages,
      output: answer,
      metadata: { model: "gpt-4o-mini" }
    });

    finalizeGraph(graph, answer);

    res.json({
      output: answer,
      session_id: sessionId,
      memory,
      trace: graph
    });

  } catch (err) {
    res.status(400).json({
      status: "rejected",
      error: err.message,
      trace: graph
    });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`v0.6 running at http://localhost:${PORT}`);
});
