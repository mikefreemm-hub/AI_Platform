export function executeSpec(spec, options = {}) {
  const { quality = "basic", tone = "neutral" } = options;

  let site = spec?.site;

  // 🔁 SELF-HEAL: if spec is missing or malformed, bootstrap a default site
  if (!site || !Array.isArray(site.pages)) {
    site = {
      pages: [
        {
          slug: "index",
          title: "Home",
          sections: ["hero", "features", "about"]
        }
      ]
    };
  }

  function sectionContent(name) {
    const base = {
      hero: "This is the primary introduction to your product or idea. It clearly explains what you do and why it matters.",
      features: "These are the core features that define your offering and set it apart from alternatives.",
      pricing: "Clear and transparent pricing information that helps users decide quickly.",
      about: "Background information explaining the mission, vision, and values behind this project.",
      contact: "Simple and direct instructions on how users can get in touch or take the next step."
    };

    let text = base[name] || "This section provides relevant information tailored to the page.";

    if (quality !== "basic") {
      text += " It is written with additional clarity, structure, and supporting detail to improve comprehension.";
    }

    if (quality === "professional" || quality === "marketing") {
      text += " The language emphasizes trust, credibility, and user benefit.";
    }

    if (tone === "friendly") {
      text += " The tone is warm, approachable, and conversational.";
    }

    if (tone === "formal") {
      text += " The tone is polished, direct, and professional.";
    }

    return `<p>${text}</p>`;
  }

  function layout(page) {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${page.title || "Generated Page"}</title>
  <style>
    body { font-family: system-ui, sans-serif; padding: 40px; max-width: 900px; margin: auto; }
    header { margin-bottom: 40px; }
    section { margin-bottom: 32px; }
    h1, h2 { line-height: 1.2; }
  </style>
</head>
<body>
  <header>
    <h1>${page.title || "Untitled Page"}</h1>
  </header>

  ${(page.sections || []).map(s => `
    <section>
      <h2>${s.charAt(0).toUpperCase() + s.slice(1)}</h2>
      ${sectionContent(s)}
    </section>
  `).join("")}

</body>
</html>`;
  }

  const output = {};

  for (const page of site.pages) {
    const slug = page.slug || "index";
    output[slug + ".html"] = layout(page);
  }

  return output;
}
