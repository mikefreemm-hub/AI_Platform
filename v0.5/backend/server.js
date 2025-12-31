import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import fetch from "node-fetch";
import { makeTrace } from "./trace.js";

dotenv.config();

/* Resolve __dirname for ES modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---- CONFIG ---- */
const PORT = process.env.PORT || 3001;
const DEBUG = process.env.DEBUG === "true";
const MODEL = "gpt-4o-mini";

/* ---- PROMPTS ---- */
const loadPrompt = (name) => {
  const filePath = path.join(__dirname, "..", "prompts", `${name}.md`);
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, "utf8") : "";
};

const SYSTEM_PROMPT = loadPrompt("system");
const DEVELOPER_PROMPT = loadPrompt("developer");

/* ---- APP ---- */
const app = express();
app.use(express.json());

/* CORS: reflect origin if present, otherwise allow all */
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      return callback(null, origin);
    },
  })
);

/* ---- ROUTES ---- */
app.post("/chat", async (req, res) => {
  const { message, session_id, trace } = req.body ?? {};
  const wantsTrace = trace === true;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  const sessionPrompt = loadPrompt("session");

  // IMPORTANT: This must remain identical to v0.4 prompt composition.
  const messages = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "developer", content: DEVELOPER_PROMPT },
    { role: "system", content: sessionPrompt },
    { role: "user", content: message },
  ];

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + process.env.OPENAI_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
      }),
    });

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";

    if (!wantsTrace) {
      return res.json({ reply });
    }

    const traceObj = makeTrace({
      model: MODEL,
      session_id,
      systemPrompt: SYSTEM_PROMPT,
      developerPrompt: DEVELOPER_PROMPT,
      sessionPrompt,
      userMessage: message,
      assistantMessage: reply,
    });

    return res.json({ reply, trace: traceObj });
  } catch (err) {
    if (DEBUG) console.error(err);
    return res.status(500).json({ error: "LLM request failed" });
  }
});

/* ---- START ---- */
app.listen(PORT, () => {
  console.log("v0.5 backend running on http://localhost:" + PORT);
});
