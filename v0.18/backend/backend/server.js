import express from "express";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import OpenAI from "openai";

// If your project already has executor() and it works for generation, keep using it.
// (This matches the style you've been using: execute({ mode:"full", prompt, intent, buildRoot }))
import execute from "./executor/index.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;

app.use(express.json());

const BUILD_ROOT = path.join(__dirname, "builds");

// Static: serve generated builds + UI
app.use("/builds", express.static(BUILD_ROOT));
app.use("/", express.static(path.join(__dirname, "public")));

// -------------------------
// Helpers
// -------------------------
function safeJsonParse(x, fallback) {
  try { return JSON.parse(x); } catch { return fallback; }
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function exists(p) {
  try { return fs.existsSync(p); } catch { return false; }
}

function getSiteRoot(site) {
  return path.join(BUILD_ROOT, site);
}

function getRevisionsDir(site) {
  return path.join(getSiteRoot(site), "revisions");
}

function getRevisionDir(site, revision) {
  return path.join(getRevisionsDir(site), String(revision));
}

function getCurrentRevision(site) {
  const pointer = path.join(getSiteRoot(site), "current.json");
  if (!exists(pointer)) return null;
  const data = safeJsonParse(fs.readFileSync(pointer, "utf-8"), null);
  return data?.revision || null;
}

function setCurrentRevision(site, revision) {
  ensureDir(getSiteRoot(site));
  const pointer = path.join(getSiteRoot(site), "current.json");
  fs.writeFileSync(pointer, JSON.stringify({ revision: String(revision) }, null, 2), "utf-8");
}

function listPages(site, revision) {
  const dir = getRevisionDir(site, revision);
  if (!exists(dir)) return [];
  const files = fs.readdirSync(dir);
  return files
    .filter(f => f.endsWith(".html"))
    .map(f => ({
      slug: f.replace(/\.html$/i, ""),
      file: f,
      href: `/builds/${site}/revisions/${revision}/${f}`
    }))
    .sort((a, b) => a.slug.localeCompare(b.slug));
}

function normalizeSlug(x) {
  return String(x || "")
    .trim()
    .toLowerCase()
    .replace(/\.html$/i, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function looksLikeNewSiteRequest(text) {
  const t = String(text || "").toLowerCase();

  // Strong “new build” signals
  if (/(^|\b)(create|generate|build|make|start)(\b|$)/.test(t) && /(website|site|landing|page)/.test(t)) return true;

  // Your examples
  if (t.startsWith("create a")) return true;
  if (t.startsWith("make a")) return true;
  if (t.startsWith("build a")) return true;

  // If user explicitly says "new site" / "new website"
  if (/(new)\s+(site|website)/.test(t)) return true;

  return false;
}

function detectPageFromMessage(message, pages, fallbackSlug) {
  const t = String(message || "").toLowerCase();

  // Explicit patterns: "on the pricing page", "open pricing", "go to pricing"
  const m =
    t.match(/\b(on|open|go to|show|edit|refine)\s+(the\s+)?([a-z0-9_-]+)\s*(page)?\b/i) ||
    t.match(/\b([a-z0-9_-]+)\.html\b/i);

  const candidates = new Set();

  if (m && m[3]) candidates.add(normalizeSlug(m[3]));
  if (m && m[1] && m[1].endsWith(".html")) candidates.add(normalizeSlug(m[1]));
  if (m && m[0] && m[0].includes(".html")) candidates.add(normalizeSlug(m[0]));

  // Common aliases
  if (t.includes("home page")) candidates.add("index");
  if (t.includes("homepage")) candidates.add("index");

  // If the user mentions a known page slug anywhere, treat it as target
  for (const p of (pages || [])) {
    const slug = normalizeSlug(p.slug);
    if (!slug) continue;
    if (t.includes(slug.replace(/-/g, " "))) candidates.add(slug);
    if (t.includes(slug)) candidates.add(slug);
  }

  // Pick first candidate that exists in pages list
  const pageSlugs = new Set((pages || []).map(p => normalizeSlug(p.slug)));
  for (const c of candidates) {
    if (pageSlugs.has(c)) return c;
  }

  return fallbackSlug || "index";
}

function isPureNavigation(message) {
  const t = String(message || "").toLowerCase();
  // Navigation intent without clear edit intent
  if (/\b(open|show|go to|view|preview)\b/.test(t) && !/\b(make|improve|change|update|rewrite|refine|add|remove)\b/.test(t)) {
    return true;
  }
  return false;
}

function copyDir(src, dst) {
  ensureDir(dst);
  // Node 20 supports fs.cpSync
  fs.cpSync(src, dst, { recursive: true });
}

function replaceMain(html, newMainHtml) {
  const hasMain = /<main[\s>]/i.test(html) && /<\/main>/i.test(html);
  if (hasMain) {
    return html.replace(/<main[\s\S]*?<\/main>/i, `<main>\n${newMainHtml}\n</main>`);
  }

  // If no <main>, insert before </body>
  if (/<\/body>/i.test(html)) {
    return html.replace(/<\/body>/i, `<main>\n${newMainHtml}\n</main>\n</body>`);
  }

  // Fallback: append
  return `${html}\n<main>\n${newMainHtml}\n</main>\n`;
}

async function writeMainWithOpenAI({ site, page, instruction, existingMainHint }) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Hard fallback if no key:
    return `<section><h2>Update requested</h2><p>${escapeHtml(instruction)}</p></section>`;
  }

  const client = new OpenAI({ apiKey });

  const sys =
    "You are a website editor. Return ONLY valid HTML meant to go INSIDE <main>...</main> (no <html>, no <head>, no <body>, no markdown fences). " +
    "Keep it professional, modern, persuasive when asked, and consistent. " +
    "If the instruction targets a specific page, tailor the content to that page.";

  const user =
    `Site: ${site}\n` +
    `Page: ${page}\n` +
    `Instruction: ${instruction}\n\n` +
    (existingMainHint ? `Current <main> hint (may be partial):\n${existingMainHint}\n\n` : "") +
    `Return only HTML for inside <main>.`;

  const resp = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: sys },
      { role: "user", content: user }
    ],
    temperature: 0.35
  });

  const out = (resp.choices?.[0]?.message?.content || "").trim();

  // Guard: if model returns junk, fallback
  if (!out || out.length < 20) {
    return `<section><h2>Update requested</h2><p>${escapeHtml(instruction)}</p></section>`;
  }

  return out;
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// -------------------------
// Existing endpoints
// -------------------------
app.post("/generate-site", async (req, res) => {
  try {
    const { prompt, intent } = req.body || {};
    if (!prompt) return res.status(400).json({ error: "prompt required" });

    const result = await execute({
      mode: "full",
      prompt,
      intent: intent || {},
      buildRoot: BUILD_ROOT
    });

    return res.json(result);
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

// Keep /command for any old UI flows that hit it.
app.post("/command", async (req, res) => {
  try {
    const { site, revision, page, instruction } = req.body || {};
    if (!site || !revision || !page || !instruction) {
      return res.status(400).json({ error: "site, revision, page, instruction required" });
    }

    // Non-destructive: create new revision, copy old, rewrite page main
    const prevDir = getRevisionDir(site, revision);
    if (!exists(prevDir)) return res.status(404).json({ error: "revision not found" });

    const next = String(Date.now());
    const nextDir = getRevisionDir(site, next);
    copyDir(prevDir, nextDir);

    const filePath = path.join(nextDir, `${normalizeSlug(page)}.html`);
    if (!exists(filePath)) return res.status(404).json({ error: "page not found" });

    const html = fs.readFileSync(filePath, "utf-8");
    const mainHint = (html.match(/<main[\s\S]*?<\/main>/i)?.[0] || "").slice(0, 2500);

    const newMain = await writeMainWithOpenAI({
      site,
      page: normalizeSlug(page),
      instruction,
      existingMainHint: mainHint
    });

    const updated = replaceMain(html, newMain);
    fs.writeFileSync(filePath, updated, "utf-8");

    setCurrentRevision(site, next);

    const pages = listPages(site, next);
    return res.json({
      assistant: { role: "assistant", content: `Refined ${normalizeSlug(page)}.` },
      state: {
        site,
        revision: next,
        pages,
        activePage: normalizeSlug(page)
      }
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

// -------------------------
// INL Chat (Universal NL)
// POST /chat { message, state }
// -------------------------
app.post("/chat", async (req, res) => {
  try {
    const message = String(req.body?.message || req.body?.text || "").trim();
    const ctx = req.body?.state || {};

    if (!message) {
      return res.status(400).json({ error: "message required" });
    }

    // Normalize ctx
    const site = ctx.site || null;
    const revision = ctx.revision || null;
    const pages = Array.isArray(ctx.pages) ? ctx.pages : (site && revision ? listPages(site, revision) : []);
    const activePage = normalizeSlug(ctx.activePage || "index");

    // Decide action
    const doGenerate = !site || !revision || looksLikeNewSiteRequest(message);
    const doNavigate = !doGenerate && isPureNavigation(message);

    if (doGenerate) {
      const built = await execute({
        mode: "full",
        prompt: message,
        intent: { quality: "high", tone: "professional" },
        buildRoot: BUILD_ROOT
      });

      // Try to infer site/revision from executor result; fallback to current pointers
      const builtSite = built?.site || built?.meta?.site || built?.state?.site || ctx.site || null;
      const builtRevision = built?.revision || built?.meta?.revision || built?.state?.revision || (builtSite ? getCurrentRevision(builtSite) : null);

      const finalSite = builtSite || site;
      const finalRevision = builtRevision || (finalSite ? getCurrentRevision(finalSite) : null);

      const nextPages = (finalSite && finalRevision) ? listPages(finalSite, finalRevision) : [];
      const nextActive = nextPages.find(p => p.slug === "index")?.slug || nextPages[0]?.slug || "index";

      return res.json({
        assistant: { role: "assistant", content: `Generated: ${finalSite} (revision ${finalRevision}).` },
        state: {
          site: finalSite,
          revision: finalRevision,
          pages: nextPages,
          activePage: nextActive
        }
      });
    }

    if (doNavigate) {
      const target = detectPageFromMessage(message, pages, activePage);
      return res.json({
        assistant: { role: "assistant", content: `Opened ${target}.` },
        state: {
          site,
          revision,
          pages,
          activePage: target
        }
      });
    }

    // Refinement (default): new revision + rewrite page <main>
    const targetPage = detectPageFromMessage(message, pages, activePage);

    const prevDir = getRevisionDir(site, revision);
    if (!exists(prevDir)) {
      return res.status(404).json({ error: "current revision folder not found" });
    }

    const next = String(Date.now());
    const nextDir = getRevisionDir(site, next);
    copyDir(prevDir, nextDir);

    const filePath = path.join(nextDir, `${targetPage}.html`);
    if (!exists(filePath)) {
      // If page file doesn't exist, fallback to index
      const fallbackPath = path.join(nextDir, `index.html`);
      if (!exists(fallbackPath)) {
        return res.status(404).json({ error: "no editable page found" });
      }
    }

    const chosenPath = exists(filePath) ? filePath : path.join(nextDir, "index.html");
    const chosenSlug = exists(filePath) ? targetPage : "index";

    const html = fs.readFileSync(chosenPath, "utf-8");
    const mainHint = (html.match(/<main[\s\S]*?<\/main>/i)?.[0] || "").slice(0, 2500);

    const newMain = await writeMainWithOpenAI({
      site,
      page: chosenSlug,
      instruction: message,
      existingMainHint: mainHint
    });

    const updated = replaceMain(html, newMain);
    fs.writeFileSync(chosenPath, updated, "utf-8");

    setCurrentRevision(site, next);

    const nextPages = listPages(site, next);

    return res.json({
      assistant: { role: "assistant", content: `Refined ${chosenSlug}.` },
      state: {
        site,
        revision: next,
        pages: nextPages,
        activePage: chosenSlug
      }
    });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

app.listen(PORT, () => {
  console.log(`v0.18 running at http://localhost:${PORT}`);
});
