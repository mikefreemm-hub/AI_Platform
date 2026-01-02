/* =========================================================
   v0.20 → Universal Actions Engine (deterministic)
   ---------------------------------------------------------
   Goal: refinements feel "natural language universal"
   without requiring an LLM. Parse common NL intents and
   mutate the site spec accordingly.

   Supported (core):
   - Theme: dark/light, accent color
   - Global intent: warmth/calm/density/salesiness
   - Pages: add/remove/rename, ensure common pages
   - Sections: add/remove/reorder common sections
   - Page-scoped edits: "on the X page ..."
   - Content helpers: rewrite headline/subhead bodies (templated)
   ========================================================= */

function lc(v){ return String(v||"").toLowerCase().trim(); }
function clamp01(n){ n = Number(n); return Number.isFinite(n) ? Math.max(0, Math.min(1, n)) : 0.55; }
function cap(s){ s = String(s||""); return s ? s[0].toUpperCase()+s.slice(1) : s; }

function slugify(s){
  return lc(s)
    .replace(/['"]/g,"")
    .replace(/[^a-z0-9]+/g,"-")
    .replace(/(^-|-$)/g,"")
    .slice(0, 40) || "page";
}

function getPages(spec){
  spec.site = spec.site || {};
  spec.site.pages = Array.isArray(spec.site.pages) ? spec.site.pages : [];
  return spec.site.pages;
}

function findPageById(pages, id){
  return pages.find(p => lc(p.id) === lc(id));
}

function findPageByTitle(pages, title){
  const t = lc(title);
  return pages.find(p => lc(p.title) === t) || pages.find(p => lc(p.id) === slugify(t));
}

function ensurePage(spec, id, title){
  const pages = getPages(spec);
  let page = findPageById(pages, id);
  if (page) return page;

  page = { id, title: title || cap(id), sections: [] };
  pages.push(page);
  return page;
}

function removePage(spec, idOrTitle){
  const pages = getPages(spec);
  const tgt = lc(idOrTitle);
  const keep = pages.filter(p => lc(p.id) !== tgt && lc(p.title) !== tgt);
  spec.site.pages = keep.length ? keep : pages; // never remove the last page
}

function ensureTheme(spec){
  spec.site = spec.site || {};
  spec.site.theme = spec.site.theme || { mode:"light", accent:"indigo" };
  return spec.site.theme;
}

function ensureIntent(spec){
  spec.site = spec.site || {};
  spec.site.intent = spec.site.intent || {};
  spec.site.intent.global = spec.site.intent.global || { calm:0.55, salesiness:0.55, density:0.55, warmth:0.55 };
  return spec.site.intent.global;
}

/* --------------------------
   Section utilities
-------------------------- */

const SECTION_ALIASES = {
  hero: ["hero","header","top","intro","headline"],
  features: ["features","feature","benefits","highlights"],
  pricing: ["pricing","price","plans","plan"],
  testimonials: ["testimonials","reviews","social proof","what people say"],
  faq: ["faq","questions","q&a"],
  contact: ["contact","contact form","get in touch","reach us"],
  content: ["content","about","story","details","copy"]
};

function canonicalSectionName(text){
  const t = lc(text);
  for (const [k, arr] of Object.entries(SECTION_ALIASES)){
    for (const a of arr){
      if (t.includes(lc(a))) return k;
    }
  }
  return null;
}

function findSectionIndex(page, type){
  return (page.sections||[]).findIndex(s => (s?.type||"content") === type);
}

function ensureSection(page, type){
  page.sections = Array.isArray(page.sections) ? page.sections : [];
  let idx = findSectionIndex(page, type);
  if (idx >= 0) return page.sections[idx];

  let sec;
  if (type === "hero"){
    sec = {
      type:"hero",
      headline: (page.title ? `${page.title} — made simple` : "Made simple"),
      subhead:"A clean, fast website built from natural language.",
      cta:{ label:"Get Started", href:"#contact" }
    };
  } else if (type === "features"){
    sec = {
      type:"features",
      title:"Key Features",
      items:[
        { title:"Fast to launch", body:"Start with a strong structure in seconds." },
        { title:"Easy to refine", body:"Iterate with conversational edits." },
        { title:"Clear sections", body:"Features, pricing, FAQ, contact — all supported." }
      ]
    };
  } else if (type === "testimonials"){
    sec = {
      type:"testimonials",
      title:"What people say",
      quotes:[
        { name:"Alex", role:"Customer", quote:"This saved us days of work." },
        { name:"Sam", role:"Founder", quote:"The edits feel natural — it just works." }
      ]
    };
  } else if (type === "pricing"){
    sec = {
      type:"pricing",
      title:"Pricing",
      items:[
        { name:"Starter", price:"$0", bullets:["Basic site","Unlimited edits"] },
        { name:"Pro", price:"$19/mo", bullets:["More sections","Export HTML"] }
      ]
    };
  } else if (type === "faq"){
    sec = {
      type:"faq",
      items:[
        { q:"Can I edit the site later?", a:"Yes — just describe what you want changed." },
        { q:"Does this support multiple pages?", a:"Yes — add pages like About, Pricing, and Contact." }
      ]
    };
  } else if (type === "contact"){
    sec = {
      type:"contact",
      headline:"Contact",
      body:"Send a message and we’ll get back to you.",
      fields:["Name","Email","Message"],
      cta:{ label:"Send" }
    };
  } else {
    sec = { type:"content", headline: page.title || "About", body:"Add your content here." };
  }

  page.sections.push(sec);
  return sec;
}

function removeSection(page, type){
  page.sections = Array.isArray(page.sections) ? page.sections : [];
  page.sections = page.sections.filter(s => (s?.type||"content") !== type);
}

function moveSection(page, typeToMove, where, anchorType){
  page.sections = Array.isArray(page.sections) ? page.sections : [];
  const from = findSectionIndex(page, typeToMove);
  if (from < 0) return;

  const [sec] = page.sections.splice(from, 1);
  const anchor = findSectionIndex(page, anchorType);
  if (anchor < 0) {
    page.sections.push(sec);
    return;
  }

  const to = (where === "above") ? anchor : anchor + 1;
  page.sections.splice(to, 0, sec);
}

/* --------------------------
   Parsing helpers
-------------------------- */

function detectTargetPage(spec, text){
  const pages = getPages(spec);
  const m =
    text.match(/\b(?:on|in|for)\s+(?:the\s+)?([a-z0-9 \-]+?)\s+page\b/i) ||
    text.match(/\b(?:on|in|for)\s+(?:the\s+)?(home|about|pricing|contact|faq|features|services|portfolio|blog)\b/i);

  if (!m) return null;

  const raw = m[1];
  const byTitle = findPageByTitle(pages, raw);
  if (byTitle) return byTitle;

  const id = slugify(raw);
  return ensurePage(spec, id, cap(raw));
}

/* --------------------------
   FIX #1: Accent parsing now catches:
   - "with teal accent"
   - "using teal accent"
   - "use teal accent"
-------------------------- */
function applyThemeActions(spec, text){
  const theme = ensureTheme(spec);

  if (/\b(dark mode|make it dark|dark theme|turn it dark|switch to dark|dark)\b/i.test(text)) theme.mode = "dark";
  if (/\b(light mode|make it light|light theme|turn it light|switch to light|light)\b/i.test(text)) theme.mode = "light";

  const acc =
    text.match(/\baccent\s+(indigo|blue|cyan|teal|green|lime|yellow|orange|red|pink|violet|slate)\b/i) ||
    text.match(/\b(with|use|using)\s+(indigo|blue|cyan|teal|green|lime|yellow|orange|red|pink|violet|slate)\s+accent\b/i) ||
    text.match(/\b(make it|switch to|use)\s+(indigo|blue|cyan|teal|green|lime|yellow|orange|red|pink|violet|slate)\b/i);

  if (acc){
    theme.accent = lc(acc[2] || acc[1]);
  }
}

function applyIntentActions(spec, text){
  const intent = ensureIntent(spec);

  if (/\b(warmer|friendly|more friendly|welcoming|approachable)\b/i.test(text)) intent.warmth = clamp01(intent.warmth + 0.2);
  if (/\b(cooler|more formal|more corporate|less warm)\b/i.test(text)) intent.warmth = clamp01(intent.warmth - 0.2);

  if (/\b(calm|relaxed|minimal|more breathing room|more whitespace)\b/i.test(text)) intent.calm = clamp01(intent.calm + 0.2);
  if (/\b(tighter|denser|more compact|less whitespace)\b/i.test(text)) intent.calm = clamp01(intent.calm - 0.2);

  if (/\b(more dense|wider|use more width|more content per row)\b/i.test(text)) intent.density = clamp01(intent.density + 0.2);
  if (/\b(more focused|narrower|less dense|reduce width)\b/i.test(text)) intent.density = clamp01(intent.density - 0.2);

  if (/\b(less salesy|less pushy|more informational|less marketing)\b/i.test(text)) intent.salesiness = clamp01(intent.salesiness - 0.25);
  if (/\b(more salesy|more aggressive|stronger cta|push conversion)\b/i.test(text)) intent.salesiness = clamp01(intent.salesiness + 0.25);
}

/* --------------------------
   FIX #2: Multi-page adds in one sentence.
   Handles BOTH:
   - "add an about page and a pricing page"
   - "add about page, pricing page, contact page"
-------------------------- */
function extractAddPageNames(text){
  const out = [];

  // Direct "add/create X page" matches (may be multiple)
  for (const m of text.matchAll(/\b(?:add|create)\s+(?:an?\s+)?([a-z0-9][a-z0-9 \-]{0,60}?)\s+page\b/gi)){
    out.push(m[1]);
  }

  // "add X page and Y page" where second lacks verb
  const chain = text.match(/\badd\s+((?:[a-z0-9 \-]+?\s+page\s*(?:and|,)\s*)+[a-z0-9 \-]+?\s+page)\b/i);
  if (chain){
    const chunk = chain[1];
    for (const part of chunk.split(/\b(?:and|,)\b/i)){
      const pm = part.match(/([a-z0-9 \-]+?)\s+page\b/i);
      if (pm) out.push(pm[1]);
    }
  }

  // Normalize + de-dup
  return [...new Set(out.map(s => String(s||"").trim()).filter(Boolean))];
}

function applyPageActions(spec, text){
  const adds = extractAddPageNames(text);

  for (const raw0 of adds){
    const raw = raw0.trim();
    const id = slugify(raw);
    const page = ensurePage(spec, id, cap(raw));

    if (lc(raw).includes("about")){
      ensureSection(page, "hero");
      const s = ensureSection(page, "content");
      s.headline = "About";
      s.body = s.body || "Share the story, mission, and what makes this different.";
    } else if (lc(raw).includes("pricing")){
      ensureSection(page, "hero");
      ensureSection(page, "pricing");
      ensureSection(page, "faq");
    } else if (lc(raw).includes("contact")){
      ensureSection(page, "hero");
      ensureSection(page, "contact");
    } else if (lc(raw).includes("faq")){
      ensureSection(page, "hero");
      ensureSection(page, "faq");
      ensureSection(page, "contact");
    } else {
      ensureSection(page, "hero");
      ensureSection(page, "content");
    }
  }

  // remove page
  const del = text.match(/\b(remove|delete)\s+(?:the\s+)?([a-z0-9 \-]+?)\s+page\b/i);
  if (del){
    removePage(spec, del[2]);
  }

  // rename page: "rename pricing page to plans"
  const ren = text.match(/\brename\s+([a-z0-9 \-]+?)\s+page\s+to\s+([a-z0-9 \-]+)\b/i);
  if (ren){
    const from = ren[1], to = ren[2];
    const pages = getPages(spec);
    const page = findPageByTitle(pages, from) || findPageById(pages, slugify(from));
    if (page){
      page.title = cap(to);
      page.id = slugify(to);
    }
  }
}

function applySectionActions(spec, text){
  const page = detectTargetPage(spec, text) || (getPages(spec)[0] || ensurePage(spec, "home", "Home"));

  const addSec = text.match(/\badd\s+(?:a\s+|an\s+)?(hero|features?|pricing|testimonials?|faq|contact)\b/i);
  if (addSec){
    const canon = canonicalSectionName(addSec[1]);
    if (canon) ensureSection(page, canon);
  }

  const remSec = text.match(/\b(remove|delete)\s+(?:the\s+)?(hero|features?|pricing|testimonials?|faq|contact)\b/i);
  if (remSec){
    const canon = canonicalSectionName(remSec[2]);
    if (canon) removeSection(page, canon);
  }

  const mv = text.match(/\bmove\s+([a-z0-9 \-]+?)\s+(above|below)\s+([a-z0-9 \-]+)\b/i);
  if (mv){
    const a = canonicalSectionName(mv[1]);
    const where = lc(mv[2]);
    const b = canonicalSectionName(mv[3]);
    if (a && b){
      ensureSection(page, a);
      ensureSection(page, b);
      moveSection(page, a, where, b);
    }
  }

  if (/\b(rewrite|improve|make better|make it better)\b/i.test(text) && /\b(hero|headline|subhead|copy|text)\b/i.test(text)){
    const hero = ensureSection(page, "hero");
    const topic =
      text.match(/\babout\s+([a-z0-9 ,'\-]+)\b/i)?.[1] ||
      text.match(/\bfor\s+([a-z0-9 ,'\-]+)\b/i)?.[1] ||
      page.title;

    const tone =
      /\b(formal|corporate)\b/i.test(text) ? "formal" :
      /\b(playful|fun)\b/i.test(text) ? "playful" :
      /\b(warm|friendly)\b/i.test(text) ? "warm" :
      "neutral";

    if (tone === "formal"){
      hero.headline = `${cap(topic)} — a clear, modern solution`;
      hero.subhead = "A focused website that communicates value, quickly and professionally.";
    } else if (tone === "playful"){
      hero.headline = `${cap(topic)} — let’s make it easy`;
      hero.subhead = "Simple, fast, and surprisingly fun to use.";
    } else if (tone === "warm"){
      hero.headline = `${cap(topic)} — built for people`;
      hero.subhead = "A welcoming site with clear sections and friendly copy.";
    } else {
      hero.headline = `${cap(topic)} — made simple`;
      hero.subhead = "A clean, fast website built from natural language.";
    }
  }

  const list = text.match(/\blist\s+([a-z0-9 ,'\-]+?)\s+with\s+descriptions\b/i);
  if (list){
    const items = list[1].split(",").map(x=>x.trim()).filter(Boolean);
    if (items.length){
      const feats = ensureSection(page, "features");
      feats.items = items.map(name => ({
        title: cap(name),
        body: `A short description of ${name} and why it matters.`
      }));
    }
  }
}

export function applyUniversalActions(spec, text){
  if (!spec) return spec;
  const raw = String(text||"").trim();
  if (!raw) return spec;

  applyThemeActions(spec, raw);
  applyIntentActions(spec, raw);
  applyPageActions(spec, raw);
  applySectionActions(spec, raw);

  return spec;
}
