function lc(v){ return String(v||"").toLowerCase().trim(); }

const CREATE_HINT = /\b(make|build|create|generate|design)\b.*\b(website|site|landing page|homepage|page)\b|\bwebsite about\b/i;
const NEW_SITE_HINT = /\b(new site|start over|reset site|fresh site|create another|new website)\b/i;

// Refinement verbs (site exists)
const REFINE_HINT = /\b(change|update|edit|refine|adjust|add|remove|move|reorder|rewrite|make it|turn it|switch to|replace)\b/i;

// ✅ FIXED: Undo / rollback (now includes "restore revision <id>")
const UNDO_HINT =
  /\b(undo|rollback|roll back|revert|go back|restore (?:previous|last)|restore revision|revert to|previous version|last version)\b/i;

const QUESTION_HINT = /\?\s*$/;
const SMALL_TALK = /^(hi|hello|hey|yo|sup|thanks|thank you|cool|nice|ok|okay)\b/i;

function tooVague(t){
  const VAGUE = /\b(change the layout|change layout|change it|make it better|improve it|fix it|update it|adjust it|refine it)\b/i;
  const HAS_OBJECT =
    /\b(colors?|theme|dark|light|accent|layout|spacing|typography|copy|text|headline|hero|sections?|pricing|about|contact|faq|testimonials?|features?|page|nav|navigation)\b/i;
  return VAGUE.test(t) && !HAS_OBJECT.test(t);
}

export function planInstruction({ text, specExists }) {
  const raw = String(text||"").trim();
  const t = lc(raw);

  if (!raw) {
    return { type: "chat", summary: "Empty input", assistant: "Say what you want to build or change." };
  }

  if (SMALL_TALK.test(t) && !CREATE_HINT.test(t) && !REFINE_HINT.test(t) && !UNDO_HINT.test(t)) {
    return { type: "chat", summary: "Small talk", assistant: "What do you want to build or change on your website?" };
  }

  // ✅ Undo detection (only if a site exists)
  if (specExists && UNDO_HINT.test(t)) {
    return { type: "undo", summary: "Rolling back a revision", text: raw };
  }

  if (NEW_SITE_HINT.test(t) || (!specExists && CREATE_HINT.test(t))) {
    return { type: "full", summary: "Generating a new site from natural language", prompt: raw };
  }

  if (CREATE_HINT.test(t) && !REFINE_HINT.test(t)) {
    return { type: "full", summary: "Generating a new site from natural language", prompt: raw };
  }

  if (!specExists) {
    return { type: "full", summary: "Generating a new site from natural language", prompt: raw };
  }

  if (tooVague(t)) {
    return {
      type: "clarify",
      summary: "Clarification needed",
      question: "What should I change specifically — layout, colors, copy, sections, pages, or something else?"
    };
  }

  if (REFINE_HINT.test(t) || QUESTION_HINT.test(t)) {
    return {
      type: "refine",
      summary: "Refining existing site based on instruction",
      changes: [{ type: "generic_refine", text: raw }]
    };
  }

  return {
    type: "chat",
    summary: "General chat",
    assistant: "Tell me what you want the website to do (topic, pages, style), and I’ll build or refine it."
  };
}
