import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

/* Resolve __dirname for ES modules */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---- CONFIG ---- */
const PORT = process.env.PORT || 3001;
const DEBUG = process.env.DEBUG === 'true';

/* Prompts directory (PORTABLE, ZIP-SAFE) */
const PROMPTS_DIR = path.join(__dirname, '..', 'prompts');

/* Fail fast if prompts directory is missing */
if (!fs.existsSync(PROMPTS_DIR)) {
  throw new Error('Prompts directory not found: ' + PROMPTS_DIR);
}

/* ---- LOAD PROMPTS ---- */
const loadPrompt = (name) => {
  const filePath = path.join(PROMPTS_DIR, name + '.md');
  return fs.existsSync(filePath)
    ? fs.readFileSync(filePath, 'utf8')
    : '';
};

const SYSTEM_PROMPT = loadPrompt('system');
const DEVELOPER_PROMPT = loadPrompt('developer');

/* ---- APP ---- */
const app = express();

app.use(express.json());

/* CORS: reflect origin if present, otherwise allow all */
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    return callback(null, origin);
  }
}));

/* ---- ROUTES ---- */
app.post('/chat', async (req, res) => {
  const { message, session_id } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const sessionPrompt = loadPrompt('session');

  const messages = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'developer', content: DEVELOPER_PROMPT },
    { role: 'system', content: sessionPrompt },
    { role: 'user', content: message }
  ];

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages
      })
    });

    const data = await response.json();

    if (DEBUG) {
      console.log('OpenAI response:', data);
    }

    res.json({
      reply: data.choices?.[0]?.message?.content || ''
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'LLM request failed' });
  }
});

/* ---- START ---- */
app.listen(PORT, () => {
  console.log('v0.4 backend running on http://localhost:' + PORT);
});
