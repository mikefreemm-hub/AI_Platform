import fs from "fs";
import path from "path";

export async function executeSpec(plan, outDir) {
  fs.mkdirSync(outDir, { recursive: true });

  // Persist semantic plan
  fs.writeFileSync(
    path.join(outDir, "site.plan.json"),
    JSON.stringify(plan, null, 2),
    "utf-8"
  );

  for (const [slug, page] of Object.entries(plan.pages)) {
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${page.title}</title>
  <style>
    body { font-family: system-ui; padding: 40px; max-width: 800px; margin: auto; }
    h1 { font-size: 32px; }
    p { font-size: 18px; line-height: 1.6; }
  </style>
</head>
<body>
  <h1>${page.title}</h1>
  <p>${page.copy}</p>
</body>
</html>`;

    fs.writeFileSync(
      path.join(outDir, `${slug}.html`),
      html,
      "utf-8"
    );
  }
}
