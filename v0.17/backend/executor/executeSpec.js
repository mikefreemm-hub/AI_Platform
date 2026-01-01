import fs from "fs";
import path from "path";
import { expandIfThin } from "./expandContent.js";

function write(p, c) {
  fs.writeFileSync(p, c, "utf-8");
}

function titleCase(s) {
  return s.replace(/\b\w/g, c => c.toUpperCase());
}

function layout({ title, nav, content }) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
<nav>
  <a href="/">← Generator</a>
  ${nav}
</nav>
<main>${content}</main>
<footer><p>© ${new Date().getFullYear()}</p></footer>
</body>
</html>`;
}

function navLinks(pages) {
  return pages.map(p => `<a href="${p.slug}.html">${p.title}</a>`).join("");
}

export default async function executeSpec({ spec, outputDir }) {
  const topic = titleCase(spec.site.topic || spec.site.name.replace(/-/g, " "));
  const pages = spec.site.pages;
  const nav = navLinks(pages);

  write(
    path.join(outputDir, "index.html"),
    layout({
      title: `${topic} — Home`,
      nav,
      content: expandIfThin({
        title: topic,
        content: `
<h1>${topic}</h1>
<p>This page has been edited via user-directed commands.</p>
`,
        allowAI: true
      })
    })
  );

  write(
    path.join(outputDir, "care.html"),
    layout({
      title: `${topic} — Care`,
      nav,
      content: expandIfThin({
        title: `${topic} Care`,
        content: `
<h1>${topic} Care</h1>
<p>Care guidance remains deterministic unless edited.</p>
`,
        allowAI: false
      })
    })
  );

  write(
    path.join(outputDir, "style.css"),
    `body{font-family:system-ui;margin:0;background:#fafafa}
nav{background:#222;padding:12px}
nav a{color:white;margin-right:16px;text-decoration:none}
main{padding:40px;max-width:900px}`
  );
}
