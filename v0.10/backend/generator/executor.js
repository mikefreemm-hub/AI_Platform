import fs from "fs";
import path from "path";

/**
 * executeSpec(spec, outputRoot)
 * - outputRoot is ALWAYS:
 *   builds/<site>/revisions/<revision>
 */
export async function executeSpec(spec, outputRoot) {
  if (!outputRoot) {
    throw new Error("executeSpec requires outputRoot");
  }

  if (!spec?.site?.pages || !Array.isArray(spec.site.pages)) {
    throw new Error("Spec missing site.pages");
  }

  // Ensure output directory exists
  fs.mkdirSync(outputRoot, { recursive: true });

  // Render each page
  for (const page of spec.site.pages) {
    const filename = page.slug === "index"
      ? "index.html"
      : `${page.slug}.html`;

    const htmlPath = path.join(outputRoot, filename);

    const html = renderPage(spec, page);

    fs.writeFileSync(htmlPath, html, "utf-8");
  }
}

/**
 * Minimal renderer (existing logic can live here)
 */
function renderPage(spec, page) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${page.title}</title>
</head>
<body>
  <h1>${page.title}</h1>
  <p>${spec.site.purpose}</p>
</body>
</html>`;
}
