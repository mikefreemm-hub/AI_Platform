import express from "express";
import fetch from "node-fetch";
import dotenv from "dotenv";

dotenv.config();

const app = express();
app.use(express.json());

// CORS for file:// origin (Origin: null)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "null");
  res.header("Access-Control-Allow-Methods", "POST, GET, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

const SYSTEM_PROMPT = "You are a helpful assistant.";
const MAX_TURNS = 20;

// In-memory, append-only session store (RAM only)
const sessions = new Map();
// sessions = { session_id: [ { role, content, ts } , ... ] }

function nowTs() {
  return new Date().toISOString();
}

function getSessionHistory(sessionId) {
  if (!sessions.has(sessionId)) sessions.set(sessionId, []);
  return sessions.get(sessionId);
}

// Get session history so the frontend can re-render after refresh
app.get("/history", (req, res) => {
  const session_id = String(req.query.session_id || "");
  if (!session_id) return res.status(400).json({ error: "Missing session_id" });

  const history = getSessionHistory(session_id);
  return res.json({ history });
});

app.post("/chat", async (req, res) => {
  try {
    const { message, session_id } = req.body;

    if (typeof session_id !== "string" || session_id.trim() === "") {
      return res.status(400).json({ error: "Invalid request: session_id" });
    }
    if (typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ error: "Invalid request: message" });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "OPENAI_API_KEY missing in environment" });
    }

    const history = getSessionHistory(session_id);

    // Append user message (append-only)
    history.push({ role: "user", content: message, ts: nowTs() });

    // Build prompt: system + last N messages in this session
    const promptMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history.slice(-MAX_TURNS).map(m => ({ role: m.role, content: m.content }))
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: promptMessages
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(500).json({
        error: "OpenAI API error",
        detail: data
      });
    }

    const reply = data?.choices?.[0]?.message?.content ?? "";

    // Append assistant message (append-only)
    history.push({ role: "assistant", content: reply, ts: nowTs() });

    return res.json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err) });
  }
});

app.listen(3000, () => {
  console.log("v0.3 backend running on port 3000");
});
