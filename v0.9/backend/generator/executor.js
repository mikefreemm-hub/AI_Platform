import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function renderSection(section, spec, page) {
  const data = page.sectionData?.[section] || {};

  switch (section) {

    case "hero":
      return `
<section>
  <h2>${data.heading || spec.site.purpose}</h2>
  <p>${data.subtext || "Simple. Fast. Built for contractors."}</p>
</section>`;

    case "features":
      const items = data.items || [
        "Create invoices in seconds",
        "Track payments automatically",
        "Send reminders to clients"
      ];
      return `
<section>
  <h3>Features</h3>
  <ul>
    ${items.map(i => `<li>${i}</li>`).join("")}
  </ul>
</section>`;

    case "pricing":
      const tiers = data.tiers || [
        { name: "Starter", price: "$9/mo" },
        { name: "Pro", price: "$29/mo" },
        { name: "Enterprise", price: "Contact us" }
      ];
      return `
<section>
  <h3>Pricing</h3>
  <ul>
    ${tiers.map(t => `<li><strong>${t.name}</strong> — ${t.price}</li>`).join("")}
  </ul>
</section>`;

    case "testimonials":
      const quotes = data.quotes || [
        "This product saved me hours every week.",
        "Invoices go out faster than ever.",
        "Finally built for contractors."
      ];
      return `
<section>
  <h3>Testimonials</h3>
  <ul>
    ${quotes.map(q => `<li>"${q}"</li>`).join("")}
  </ul>
</section>`;

    case "about":
      return `
<section>
  <h3>About Us</h3>
  <p>${data.text || "We build tools that help contractors spend less time on paperwork and more time on real work."}</p>
</section>`;

    case "contact":
      return `
<section>
  <h3>Contact</h3>
  <p>${data.email || "support@example.com"}</p>
</section>`;

    default:
      return "";
  }
}

function renderCTA(cta) {
  if (!cta) return "";
  if (cta.action === "navigate") {
    return `<section><a class="btn" href="${cta.target}.html">${cta.label}</a></section>`;
  }
  return "";
}

export function executeSpec(spec) {
  const buildRoot = path.join(__dirname, "..", "builds");
  const revision = Date.now().toString();
  const siteDir = path.join(buildRoot, spec.site.name, "revisions", revision);

  fs.mkdirSync(siteDir, { recursive: true });
  fs.writeFileSync(
    path.join(siteDir, "site.spec.json"),
    JSON.stringify(spec, null, 2)
  );

  const nav = spec.site.pages
    .map(p => `<a href="${p.slug}.html">${p.title}</a>`)
    .join(" | ");

  for (const page of spec.site.pages) {
    const sectionsHtml = page.sections
      .map(s => renderSection(s, spec, page))
      .join("\n");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>${page.title}</title>
<style>
body { font-family: ${spec.site.theme.font}; margin: 40px; }
h1 { color: ${spec.site.theme.primaryColor}; }
.btn {
  display:inline-block;
  padding:10px 16px;
  background:${spec.site.theme.primaryColor};
  color:white;
  text-decoration:none;
  border-radius:4px;
}
section { margin-bottom:40px; }
</style>
</head>
<body>
<nav>${nav}</nav>
<h1>${page.title}</h1>
${sectionsHtml}
${renderCTA(page.cta)}
</body>
</html>`;

    fs.writeFileSync(path.join(siteDir, `${page.slug}.html`), html);
  }

  return { site: spec.site.name, revision, path: siteDir };
}
