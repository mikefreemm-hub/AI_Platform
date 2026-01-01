import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fetch from "node-fetch";

const OPENAI_KEY = process.env.OPENAI_KEY;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let currentSpec = null;

/*
  🔑 QUALITY-ANCHORED TRANSFORM
*/
async function transformSpec(previousSpec, instruction) {
  const systemPrompt =
"You are an expert website designer and copywriter.\n" +
"You create high-quality, modern, commercially viable websites.\n\n" +

"GLOBAL QUALITY ANCHORS (ALWAYS APPLY):\n" +
"- Assume the site is for a real business with real customers\n" +
"- Prefer clear value propositions over generic statements\n" +
"- Write confident, concise, modern copy\n" +
"- Avoid filler phrases like 'Welcome to our website'\n" +
"- Structure pages for readability and conversion\n" +
"- Use sectioned layouts with clear intent (hero, value, proof, CTA)\n" +
"- Output should feel comparable to a strong SaaS or startup landing page\n\n" +

"OUTPUT REQUIREMENTS:\n" +
"- Return a COMPLETE website specification as VALID JSON ONLY\n" +
"- Do NOT include markdown, backticks, or explanations\n" +
"- Must include a 'pages' object\n" +
"- At least one page\n" +
"- Pages must be renderable\n\n" +

"IMPORTANT:\n" +
"- You may improve, rewrite, or restructure previous content if quality can be improved\n" +
"- All changes must respect the user's natural language instruction\n";

  const res = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + OPENAI_KEY,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.7,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: JSON.stringify({
              previousSpec,
              instruction
            })
          }
        ]
      })
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error("OpenAI API error: " + errText);
  }

  const raw = await res.json();
  let content = raw.choices[0].message.content;

  content = content
    .replace(/```json/g, "")
    .replace(/```/g, "")
    .trim();

  return JSON.parse(content);
}

/*
  🌐 SINGLE NATURAL-LANGUAGE ENDPOINT
*/
app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;
    currentSpec = await transformSpec(currentSpec, message);
    res.json({ spec: currentSpec });
  } catch (e) {
    console.error("❌ /chat failed:");
    console.error(e.message);
    res.status(500).json({ error: e.message });
  }
});

app.listen(3001, () => {
  console.log("🚀 AI Platform v0.19 running at http://localhost:3001");
});
