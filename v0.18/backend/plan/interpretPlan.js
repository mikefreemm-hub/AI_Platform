import { createEmptyPlan } from "./sitePlan.js";

function clonePlan(plan) {
  // structuredClone isn't available in every Node runtime.
  return plan ? JSON.parse(JSON.stringify(plan)) : null;
}

function normSlug(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleCase(slug) {
  if (!slug) return "";
  return slug
    .split("-")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function parseQuoted(text) {
  // Return first quoted segment if present.
  const m = text.match(/"([^"]+)"|'([^']+)'/);
  return m ? (m[1] || m[2] || null) : null;
}

const SITE_TYPES = [
  { type: "saas", re: /\b(saas|platform|dashboard|app)\b/ },
  { type: "portfolio", re: /\b(portfolio|photography|designer|artist)\b/ },
  { type: "restaurant", re: /\b(restaurant|cafe|coffee|menu|bar)\b/ },
  { type: "blog", re: /\b(blog|newsletter|writing|posts)\b/ },
  { type: "ecommerce", re: /\b(ecommerce|shop|store|cart|checkout)\b/ },
  { type: "agency", re: /\b(agency|studio|consulting|services)\b/ },
  { type: "event", re: /\b(event|conference|meetup|webinar)\b/ },
  { type: "docs", re: /\b(docs|documentation|knowledge base|kb)\b/ }
];

const TONES = [
  { tone: "friendly", re: /\b(friendly|playful|fun|casual|conversational)\b/ },
  { tone: "formal", re: /\b(formal|professional|corporate)\b/ },
  { tone: "neutral", re: /\b(neutral)\b/ }
];

const QUALITIES = [
  { quality: "marketing", re: /\b(marketing|sales|conversion|persuasive)\b/ },
  { quality: "professional", re: /\b(professional|polished|premium)\b/ },
  { quality: "basic", re: /\b(basic|minimal|simple)\b/ }
];

const THEMES = [
  { theme: "dark", re: /\b(dark mode|dark theme|dark)\b/ },
  { theme: "light", re: /\b(light theme|light mode|light)\b/ }
];

const SECTION_ALIASES = {
  hero: ["hero", "headline", "masthead", "intro"],
  features: ["features", "benefits", "highlights"],
  about: ["about", "story", "mission"],
  pricing: ["pricing", "plans", "tiers"],
  contact: ["contact", "get in touch", "contact us"],
  faq: ["faq", "faqs", "questions"],
  testimonials: ["testimonials", "reviews", "social proof"],
  gallery: ["gallery", "photos", "images"],
  services: ["services", "offerings"],
  team: ["team", "people"],
  cta: ["cta", "call to action"],
  newsletter: ["newsletter", "signup", "subscribe"],
  footer: ["footer"],
  header: ["header", "nav", "navigation"]
};

function canonicalSection(raw) {
  const t = String(raw || "").trim().toLowerCase();
  if (!t) return null;

  for (const [canon, list] of Object.entries(SECTION_ALIASES)) {
    for (const phrase of list) {
      if (t === phrase) return canon;
    }
  }

  // Allow custom sections like "case studies" → "case-studies"
  return normSlug(t);
}

function ensurePage(plan, pageKey, defaultSections = []) {
  if (!pageKey) return;
  if (!plan.pages[pageKey]) {
    plan.pages[pageKey] = [...defaultSections];
  }
}

function addSections(plan, pageKey, sections) {
  ensurePage(plan, pageKey, []);
  const set = new Set(plan.pages[pageKey]);
  for (const s of sections) {
    if (s) set.add(s);
  }
  plan.pages[pageKey] = Array.from(set);
}

function removeSections(plan, pageKey, sections) {
  if (!plan.pages[pageKey]) return;
  const remove = new Set(sections.filter(Boolean));
  plan.pages[pageKey] = plan.pages[pageKey].filter(s => !remove.has(s));
}

function defaultPagesForSiteType(siteType) {
  switch (siteType) {
    case "saas":
      return {
        home: ["hero", "features", "cta"],
        pricing: ["pricing", "faq"],
        about: ["about", "team"],
        contact: ["contact"]
      };
    case "portfolio":
      return {
        home: ["hero", "cta"],
        work: ["gallery"],
        about: ["about"],
        contact: ["contact"]
      };
    case "restaurant":
      return {
        home: ["hero", "cta"],
        menu: ["features"],
        about: ["about"],
        contact: ["contact"]
      };
    case "blog":
      return {
        home: ["hero", "newsletter"],
        posts: ["features"],
        about: ["about"],
        contact: ["contact"]
      };
    case "ecommerce":
      return {
        home: ["hero", "features", "testimonials"],
        shop: ["features"],
        about: ["about"],
        contact: ["contact"]
      };
    case "agency":
      return {
        home: ["hero", "services", "testimonials", "cta"],
        work: ["gallery"],
        about: ["about", "team"],
        contact: ["contact"]
      };
    default:
      return {
        home: ["hero", "features", "cta"],
        about: ["about"],
        contact: ["contact"]
      };
  }
}

function pickPageKeyFromText(text) {
  const t = text.toLowerCase();

  // "on the pricing page", "in contact", "for about"
  const m = t.match(/\b(on|in|for)\s+(the\s+)?([a-z0-9][a-z0-9\- ]{0,40})\s+page\b/);
  if (m && m[3]) return normSlug(m[3]);

  // "on pricing" / "in about"
  const m2 = t.match(/\b(on|in)\s+(home|pricing|about|contact|blog|posts|work|menu|shop|faq|testimonials|gallery)\b/);
  if (m2 && m2[2]) return normSlug(m2[2]);

  return null;
}

function extractColor(text) {
  // hex colors: #fff, #ffffff
  const m = text.match(/#([0-9a-f]{3}|[0-9a-f]{6})\b/i);
  if (m) return "#" + m[1].toLowerCase();

  // basic named colors → hex (minimal set)
  const named = [
    ["blue", "#2563eb"],
    ["green", "#16a34a"],
    ["red", "#dc2626"],
    ["purple", "#7c3aed"],
    ["orange", "#ea580c"],
    ["black", "#111827"],
    ["white", "#ffffff"],
    ["gray", "#6b7280"],
    ["grey", "#6b7280"]
  ];

  const lower = text.toLowerCase();
  for (const [name, hex] of named) {
    if (new RegExp(`\\b${name}\\b`).test(lower)) return hex;
  }
  return null;
}

export function interpretPlan(text = "", existingPlan = null) {
  const raw = String(text || "").trim();
  const lower = raw.toLowerCase();

  const isReset = /^(new site|start over|reset|clear everything|fresh start)\b/.test(lower);
  const plan = isReset
    ? createEmptyPlan()
    : (clonePlan(existingPlan) || createEmptyPlan());

  // ─────────────────────────────
  // PURPOSE / BRAND NAME
  // ─────────────────────────────
  const quoted = parseQuoted(raw);
  if (/\bbrand\b/.test(lower) && /\bname\b/.test(lower) && quoted) {
    plan.brandName = quoted.trim();
  }

  // "website about X" / "site for X" / "landing page for X"
  const purposeMatch = raw.match(/\b(website|site|landing page|landing)\s+(about|for)\s+(.+)$/i);
  if (purposeMatch?.[3]) {
    plan.purpose = purposeMatch[3].trim();
  } else if (!plan.purpose && raw.length >= 3) {
    // If user just types "make a website for ..." we'll still store as purpose.
    const m2 = raw.match(/\b(make|build|generate|create)\b[\s\S]*?\b(about|for)\s+(.+)$/i);
    if (m2?.[3]) plan.purpose = m2[3].trim();
  }

  // ─────────────────────────────
  // SITE TYPE
  // ─────────────────────────────
  for (const st of SITE_TYPES) {
    if (st.re.test(lower)) {
      plan.siteType = st.type;
      break;
    }
  }
  if (!plan.siteType && /\bwebsite\b/.test(lower)) plan.siteType = "informational";

  // ─────────────────────────────
  // TONE / QUALITY / THEME / COLOR
  // ─────────────────────────────
  for (const t of TONES) {
    if (t.re.test(lower)) {
      plan.tone = t.tone;
      break;
    }
  }

  for (const q of QUALITIES) {
    if (q.re.test(lower)) {
      plan.quality = q.quality;
      break;
    }
  }

  for (const th of THEMES) {
    if (th.re.test(lower)) {
      plan.theme = th.theme;
      break;
    }
  }

  // "primary color" / "accent color" / "make it blue" (best-effort)
  if (/\b(color|colour)\b/.test(lower) || /\b(accent)\b/.test(lower) || /\b(make it)\b/.test(lower)) {
    const c = extractColor(raw);
    if (c) plan.primaryColor = c;
  }

  // ─────────────────────────────
  // PAGE COUNT
  // ─────────────────────────────
  const pageMatch = lower.match(/\b(\d+)\s*[- ]?page\b/);
  if (pageMatch) plan.maxPages = parseInt(pageMatch[1], 10);

  // ─────────────────────────────
  // PAGE COMMANDS
  // ─────────────────────────────
  // add page X
  const addPage = lower.match(/\b(add|create|include)\s+(a\s+)?page\s+(for\s+)?([a-z0-9][a-z0-9\- ]{0,40})/);
  if (addPage?.[4]) {
    const key = normSlug(addPage[4]);
    if (key && key !== "page") {
      ensurePage(plan, key, ["hero", "features"]);
    }
  }

  // remove page X
  const removePage = lower.match(/\b(remove|delete)\s+(the\s+)?page\s+([a-z0-9][a-z0-9\- ]{0,40})/);
  if (removePage?.[3]) {
    const key = normSlug(removePage[3]);
    if (key && plan.pages[key]) delete plan.pages[key];
    if (key === "home" || key === "index") {
      // Don't allow deleting home.
      ensurePage(plan, "home", ["hero", "features"]);
    }
  }

  // Quick-add common pages by mentioning them.
  const quickPages = [
    ["pricing", ["pricing", "faq"]],
    ["contact", ["contact"]],
    ["about", ["about"]],
    ["faq", ["faq"]],
    ["testimonials", ["testimonials"]],
    ["gallery", ["gallery"]],
    ["blog", ["posts"]],
    ["posts", ["features"]],
    ["work", ["gallery"]],
    ["menu", ["features"]],
    ["shop", ["features"]]
  ];

  for (const [key, secs] of quickPages) {
    if (new RegExp(`\\b${key}\\b`).test(lower)) {
      ensurePage(plan, key, secs);
    }
  }

  // ─────────────────────────────
  // SECTION COMMANDS (page-aware)
  // ─────────────────────────────
  const pageKey = pickPageKeyFromText(raw);
  const targetPageKey = pageKey || "home";

  // add X section(s)
  const addSec = lower.match(/\b(add|include|insert)\s+([a-z0-9][a-z0-9,\-\s]{0,80})\s+(section|sections)\b/);
  if (addSec?.[2]) {
    const rawList = addSec[2]
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    const sections = rawList.map(canonicalSection).filter(Boolean);
    addSections(plan, targetPageKey, sections);
  }

  // remove X section(s)
  const remSec = lower.match(/\b(remove|delete|get rid of)\s+([a-z0-9][a-z0-9,\-\s]{0,80})\s+(section|sections)\b/);
  if (remSec?.[2]) {
    const rawList = remSec[2]
      .split(",")
      .map(s => s.trim())
      .filter(Boolean);
    const sections = rawList.map(canonicalSection).filter(Boolean);
    removeSections(plan, targetPageKey, sections);
  }

  // ─────────────────────────────
  // DEFAULTS (only if empty)
  // ─────────────────────────────
  if (Object.keys(plan.pages).length === 0) {
    const defaults = defaultPagesForSiteType(plan.siteType);
    plan.pages = { ...defaults };
  }

  // Always ensure home exists.
  if (!plan.pages.home) {
    plan.pages.home = ["hero", "features", "cta"];
  }

  // ─────────────────────────────
  // PAGE COUNT FULFILLMENT (best-effort)
  // ─────────────────────────────
  if (plan.maxPages && Object.keys(plan.pages).length < plan.maxPages) {
    const fillers = [
      ["overview", ["hero", "features"]],
      ["resources", ["features"]],
      ["team", ["team", "testimonials"]],
      ["careers", ["features"]],
      ["legal", ["features"]]
    ];
    for (const [key, secs] of fillers) {
      if (Object.keys(plan.pages).length >= plan.maxPages) break;
      ensurePage(plan, key, secs);
    }
  }

  return plan;
}
