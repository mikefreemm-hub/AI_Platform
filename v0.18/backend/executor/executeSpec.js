function esc(s) {
  return String(s || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function sectionLabel(type) {
  const t = String(type || "section");
  return t
    .split("-")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function makeCopy({ type, purpose, siteType, quality, tone }) {
  const p = purpose ? ` for ${purpose}` : "";
  const base = {
    hero: `A clear, high-impact introduction${p}.`,
    features: `Key benefits and capabilities${p}.`,
    pricing: `Simple pricing tiers and what’s included.`,
    about: `The mission and story behind${p}.`,
    contact: `How visitors can reach you and take the next step.`,
    faq: `Answers to common questions to reduce friction.`,
    testimonials: `Social proof to build trust and credibility.`,
    gallery: `Visual examples and highlights${p}.`,
    services: `What you offer and how you deliver value.`,
    team: `Who’s behind the work and why they’re qualified.`,
    cta: `A single strong call-to-action to drive the next click.`,
    newsletter: `A low-friction sign-up to stay in touch.`
  };

  let text = base[type] || `Content for the ${type} section.`;

  if (siteType) {
    if (siteType === "saas" && type === "features") text += " Emphasize workflows, outcomes, and integrations.";
    if (siteType === "ecommerce" && type === "hero") text += " Emphasize products, shipping, and trust signals.";
    if (siteType === "restaurant" && type === "hero") text += " Emphasize ambiance, signature items, and hours.";
    if (siteType === "portfolio" && type === "gallery") text += " Emphasize craft, range, and recent work.";
  }

  if (quality !== "basic") {
    text += " Add structure, scannability, and concrete details.";
  }

  if (quality === "marketing") {
    text += " Use benefit-led language and reduce user hesitation.";
  }

  if (tone === "friendly") {
    text += " Keep it warm and conversational.";
  } else if (tone === "formal") {
    text += " Keep it polished and professional.";
  }

  return `<p>${esc(text)}</p>`;
}

function cssFor({ theme, primaryColor }) {
  const isDark = theme === "dark";

  // Very small CSS surface area (easy to evolve later).
  return `
    :root{
      --accent:${primaryColor || "#2563eb"};
      --bg:${isDark ? "#0b0e11" : "#ffffff"};
      --panel:${isDark ? "#111827" : "#f8fafc"};
      --text:${isDark ? "#e5e7eb" : "#0f172a"};
      --muted:${isDark ? "#9ca3af" : "#475569"};
      --border:${isDark ? "#1f2937" : "#e2e8f0"};
    }
    *{box-sizing:border-box;}
    body{
      font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
      background: var(--bg);
      color: var(--text);
      margin: 0;
    }
    .wrap{max-width: 980px; margin: 0 auto; padding: 40px 20px;}
    nav{
      display:flex;
      gap:12px;
      flex-wrap:wrap;
      padding: 12px 14px;
      border: 1px solid var(--border);
      border-radius: 12px;
      background: var(--panel);
      margin-bottom: 22px;
    }
    nav a{color: var(--accent); text-decoration:none; font-weight:600;}
    nav a:hover{text-decoration:underline;}
    h1{margin: 0 0 14px 0; font-size: 36px; letter-spacing:-0.02em;}
    .subtitle{color: var(--muted); margin: 0 0 22px 0;}
    section{
      padding: 18px 16px;
      border: 1px solid var(--border);
      border-radius: 14px;
      background: var(--panel);
      margin-bottom: 16px;
    }
    h2{margin: 0 0 10px 0; font-size: 18px;}
    p{margin: 0; color: var(--muted); line-height: 1.55;}
  `;
}

export function executeSpec(spec, options = {}) {
  const site = spec?.site;
  if (!site || !Array.isArray(site.pages)) {
    throw new Error("Invalid spec");
  }

  // Prefer explicit site fields; fall back to options for older callers.
  const quality = site.quality || options.quality || "basic";
  const tone = site.tone || options.tone || "neutral";
  const theme = site.theme || "light";
  const primaryColor = site.primaryColor || "#2563eb";

  const files = {};

  const nav = site.pages
    .map(p => `<a href="${esc(p.slug)}.html">${esc(p.title || p.slug)}</a>`)
    .join("");

  for (const page of site.pages) {
    const slug = page.slug || "index";
    const title = page.title || "Page";
    const subtitle = site.purpose ? `About: ${site.purpose}` : (site.siteType ? `Type: ${site.siteType}` : "");

    const body = (page.sections || []).map(s => {
      const type = s?.type || String(s);
      const content = s?.content || makeCopy({
        type,
        purpose: site.purpose,
        siteType: site.siteType,
        quality,
        tone
      });

      return `
        <section data-section="${esc(type)}">
          <h2>${esc(sectionLabel(type))}</h2>
          ${content}
        </section>
      `;
    }).join("\n");

    files[slug + ".html"] = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(title)}</title>
  <style>${cssFor({ theme, primaryColor })}</style>
</head>
<body>
  <div class="wrap">
    <nav>${nav}</nav>
    <h1>${esc(title)}</h1>
    ${subtitle ? `<p class="subtitle">${esc(subtitle)}</p>` : ""}
    ${body}
  </div>
</body>
</html>`;
  }

  return files;
}
