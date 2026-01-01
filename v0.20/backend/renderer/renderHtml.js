/* ==================================================
   v0.20 Renderer — MULTI-PAGE + FULL SECTION SUPPORT
   ================================================== */

function esc(v = "") {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function pick(obj, keys, fallback) {
  for (const k of keys) {
    const v = obj?.[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return fallback;
}

function toSlug(v) {
  return String(v || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

/* ---------- Normalize ---------- */

function normalizeSpec(input) {
  const site = input?.site || {};
  site.pages = Array.isArray(site.pages) ? site.pages : [];
  site.nav = Array.isArray(site.nav)
    ? site.nav
    : site.pages.map(p => ({ label: p.title || p.slug, target: p.slug }));
  return { site };
}

/* ---------- Sections ---------- */

function sectionHero(s) {
  return `
  <section class="hero">
    <h1>${esc(pick(s, ["headline", "title"], "Welcome"))}</h1>
    <p class="lead">${esc(pick(s, ["subhead", "subtitle"], ""))}</p>
  </section>`;
}

function sectionLogos(s) {
  const items = Array.isArray(s.items) ? s.items : [];
  return `
  <section class="section">
    <h2>${esc(pick(s, ["title"], "Trusted by teams"))}</h2>
    <div class="logoRow">
      ${items.map(i => `<span class="logoPill">${esc(i)}</span>`).join("")}
    </div>
  </section>`;
}

function sectionFeatures(s) {
  return `
  <section class="section">
    <h2>${esc(pick(s, ["title"], "Features"))}</h2>
    <ul>${(s.items || []).map(i => `<li>${esc(i.title || i)}</li>`).join("")}</ul>
  </section>`;
}

function sectionBenefits(s) {
  return `
  <section class="section">
    <h2>${esc(pick(s, ["title"], "Why teams switch"))}</h2>
    <ul>${(s.items || []).map(i => `<li>${esc(i)}</li>`).join("")}</ul>
  </section>`;
}

function sectionTestimonials(s) {
  return `
  <section class="section">
    <h2>${esc(pick(s, ["title"], "Testimonials"))}</h2>
    ${(s.items || []).map(t =>
      `<blockquote>“${esc(t.quote)}” — ${esc(t.name)}</blockquote>`
    ).join("")}
  </section>`;
}

function sectionPricing(s) {
  return `
  <section class="section" id="pricing">
    <h2>${esc(pick(s, ["title"], "Pricing"))}</h2>
    <div class="grid">
      ${(s.plans || []).map(p =>
        `<div class="card"><strong>${esc(p.name)}</strong><br/>${esc(p.price)}</div>`
      ).join("")}
    </div>
  </section>`;
}

function sectionContact() {
  return `
  <section class="section" id="contact">
    <h2>Contact</h2>
    <form class="card">
      <input placeholder="Name"/>
      <input placeholder="Email"/>
      <textarea placeholder="Message"></textarea>
    </form>
  </section>`;
}

/* ---------- Router ---------- */

function renderSection(s) {
  switch (toSlug(s.type)) {
    case "hero": return sectionHero(s);
    case "logos": return sectionLogos(s);
    case "features": return sectionFeatures(s);
    case "benefits": return sectionBenefits(s);
    case "testimonials": return sectionTestimonials(s);
    case "pricing": return sectionPricing(s);
    case "contact": return sectionContact();
    default:
      return `<pre class="card">${esc(JSON.stringify(s, null, 2))}</pre>`;
  }
}

/* ---------- Render ---------- */

export function renderHtml(input) {
  const { site } = normalizeSpec(input);

  const url = new URL("http://x" + (process.env.PAGE_QUERY || ""));
  const pageSlug = url.searchParams.get("page") || "index";
  const page = site.pages.find(p => p.slug === pageSlug) || site.pages[0];

  return `
<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${esc(page?.title || site.name)}</title>
  <style>
    body{margin:0;background:#0b0e11;color:#e6e6e6;font-family:system-ui}
    nav{display:flex;gap:14px;padding:14px 20px;border-bottom:1px solid #1f2430}
    nav a{color:#cbd5f5;text-decoration:none}
    nav a.active{color:#fff;font-weight:700}
    .wrap{padding:40px}
    .section{margin-top:40px}
    .card{padding:16px;border-radius:12px;background:#151922}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
    .hero{padding:40px;border-radius:16px;background:#111}
    .logoRow{display:flex;gap:10px;flex-wrap:wrap}
    .logoPill{padding:8px 12px;border:1px solid #333;border-radius:999px}
  </style>
</head>
<body>

<nav>
  ${site.nav.map(n => `
    <a href="/builds/default/index.html?page=${esc(n.target)}"
       class="${n.target === page.slug ? "active" : ""}">
      ${esc(n.label)}
    </a>
  `).join("")}
</nav>

<div class="wrap">
  ${(page?.sections || []).map(s => renderSection(s)).join("")}
</div>

</body>
</html>`;
}
