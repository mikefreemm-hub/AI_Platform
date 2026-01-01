function esc(v = "") {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function renderSection(s) {
  switch (s.type) {
    case "headline":
      return `
        <section class="hero">
          <h1>${esc(s.text || "Headline")}</h1>
        </section>
      `;

    case "value":
      return `
        <section>
          <h2>Value</h2>
          <p>${esc(s.text || "")}</p>
        </section>
      `;

    case "proof":
      return `
        <section>
          <h2>Proof</h2>
          <p>${esc(s.text || "")}</p>
        </section>
      `;

    case "cta":
      return `
        <section class="cta">
          <h2>${esc(s.text || "Ready to get started?")}</h2>
          <a class="btn primary">${esc(s.label || "Contact Us")}</a>
        </section>
      `;

    default:
      return `
        <section>
          <pre>${esc(JSON.stringify(s, null, 2))}</pre>
        </section>
      `;
  }
}

export function renderHtml(spec) {
  const page = spec?.pages?.home;
  const sections = Array.isArray(page?.sections) && page.sections.length
    ? page.sections
    : [{ type: "headline", text: "Your site is being generated…" }];

  const body = sections.map(renderSection).join("\n");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${esc(spec?.name || "Website")}</title>
  <meta name="description" content="${esc(spec?.description || "")}" />
  <style>
    body {
      font-family: system-ui, sans-serif;
      margin: 0;
      padding: 48px;
      background: #ffffff;
      color: #111;
    }
    section {
      max-width: 900px;
      margin: 0 auto 64px;
    }
    h1 {
      font-size: 48px;
      margin-bottom: 16px;
    }
    h2 {
      font-size: 28px;
      margin-bottom: 12px;
    }
    p {
      font-size: 18px;
      line-height: 1.6;
    }
    .btn {
      display: inline-block;
      margin-top: 16px;
      padding: 12px 22px;
      background: #2563eb;
      color: white;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 600;
    }
    .primary {
      background: #111827;
    }
    .cta {
      background: #f9fafb;
      padding: 40px;
      border-radius: 12px;
    }
    pre {
      background: #f3f4f6;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
${body}
</body>
</html>
`;
}
