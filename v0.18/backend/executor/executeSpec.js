export function executeSpec(spec, options = {}) {
  const { quality = "basic", tone = "neutral" } = options;

  const site = spec?.site;
  if (!site || !Array.isArray(site.pages)) {
    throw new Error("Invalid spec");
  }

  function defaultContent(type) {
    const base = {
      hero: "This is the primary introduction to your product or idea.",
      features: "These are the core features that define your offering.",
      about: "Background information explaining the mission and values.",
      pricing: "Clear pricing details to help users decide.",
      contact: "Instructions on how users can get in touch."
    };

    let text = base[type] || "Section content.";

    if (quality !== "basic") {
      text += " Expanded with additional clarity and detail.";
    }
    if (tone === "friendly") {
      text += " Written in a friendly, conversational tone.";
    }
    if (tone === "formal") {
      text += " Written in a professional, formal tone.";
    }

    return `<p>${text}</p>`;
  }

  function renderPage(page) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${page.title}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 40px; max-width: 900px; margin: auto; }
    nav { margin-bottom: 32px; }
    nav a { margin-right: 12px; text-decoration: none; color: #2563eb; }
    section { margin-bottom: 32px; }
  </style>
</head>
<body>
  <nav>
    ${site.pages.map(p => `<a href="${p.slug}.html">${p.title}</a>`).join("")}
  </nav>

  <h1>${page.title}</h1>

  ${(page.sections || []).map(s => `
    <section>
      <h2>${s.type}</h2>
      ${s.content || defaultContent(s.type)}
    </section>
  `).join("")}

</body>
</html>`;
  }

  const files = {};

  for (const page of site.pages) {
    const slug = page.slug || "index";
    files[slug + ".html"] = renderPage(page);
  }

  return files;
}
