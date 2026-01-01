import { generateSectionContent } from "../ai/openai.js";

function parseInstruction(text) {
  const t = text.toLowerCase();

  const actions = {
    add: /(add|include|insert)/,
    remove: /(remove|delete|get rid of)/,
    rewrite: /(rewrite|change|update|improve|make)/,
    expand: /(expand|more detail|elaborate)/,
    shorten: /(shorten|simplify|condense)/
  };

  const targets = ["hero", "features", "about", "pricing", "contact"];

  let action = null;
  let target = null;

  for (const [a, r] of Object.entries(actions)) {
    if (r.test(t)) action = a;
  }

  for (const s of targets) {
    if (t.includes(s)) target = s;
  }

  return { action, target, text: t };
}

export async function refineSpec(spec, instruction = "") {
  if (!spec?.site?.pages) return spec;

  const page = spec.site.pages[0];
  const { action, target, text } = parseInstruction(instruction);

  function find(type) {
    return page.sections.find(s => s.type === type);
  }

  function ensure(type) {
    let sec = find(type);
    if (!sec) {
      sec = { type, content: null };
      page.sections.push(sec);
    }
    return sec;
  }

  if (action === "add" && target) {
    ensure(target);
  }

  if (action === "remove" && target) {
    page.sections = page.sections.filter(s => s.type !== target);
  }

  if ((action === "rewrite" || action === "expand" || action === "shorten") && target) {
    const sec = ensure(target);

    // 🔮 TRY AI FIRST
    const aiContent = await generateSectionContent({
      siteName: spec.site.name,
      pageTitle: page.title,
      sectionType: target,
      instruction,
      tone: spec.site.tone || "neutral"
    });

    if (aiContent) {
      sec.content = aiContent;
    } else {
      // 🧱 FALLBACK (DETERMINISTIC)
      sec.content = `<p>The ${target} section has been updated based on your request.</p>`;
    }
  }

  if (text.includes("playful")) spec.site.tone = "friendly";
  if (text.includes("formal")) spec.site.tone = "formal";

  return spec;
}
