/* =========================================================
   v0.20 Renderer — FINAL, FIXED PAGE RESOLUTION
   ========================================================= */

function esc(v=""){return String(v).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[m]))}
function slug(v=""){return v.toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/(^-|-$)/g,"")||"index"}

function inferPageType(p){
  const t=(p.slug||p.title||"").toLowerCase();
  if(t.includes("gallery")) return "gallery";
  if(t.includes("about")) return "about";
  if(t.includes("contact")) return "contact";
  if(t.includes("breed") || t.includes("list")) return "list";
  return "standard";
}

function renderSection(s){
  if(s.type==="list"){
    return `<div class="grid">
      ${(s.items||[]).map(i=>`
        <div class="card">
          <strong>${esc(i.title)}</strong>
          <p>${esc(i.body||"")}</p>
        </div>`).join("")}
    </div>`;
  }
  return `<div class="card"><p>${esc(s.body||"")}</p></div>`;
}

function renderPage(page, site){
  if(!page) return `<p>Page not found.</p>`;

  const type=inferPageType(page);
  let html="";

  if(type==="standard"){
    html+=`<h1>${esc(site.name)}</h1><p>${esc(site.description||"")}</p>`;
  }

  if(type==="contact"){
    html+=`<h2>Contact</h2>
      <input placeholder="Name"/><br/><br/>
      <input placeholder="Email"/><br/><br/>
      <textarea placeholder="Message"></textarea>`;
  }

  html+=(page.sections||[]).map(renderSection).join("");
  return html;
}

export function renderHtml(spec){
  const site = spec.site || {};

  // 🔑 Build pages with real slugs
  const pages = (site._pages || []).map(p => ({
    ...p,
    slug: p.slug || slug(p.title),
    sections: p.sections || []
  }));

  return `<!doctype html><html><head>
  <meta charset="utf-8"/>
  <style>
    body{margin:0;background:#0b0e11;color:#e6e6e6;font-family:system-ui}
    nav{padding:14px;border-bottom:1px solid #222}
    nav a{color:#cbd5f5;margin-right:12px;text-decoration:none}
    .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:16px}
    .card{background:#151922;padding:16px;border-radius:12px}
    input,textarea{width:100%;padding:8px;background:#0b0e11;color:#fff;border:1px solid #333}
  </style></head><body>

  <nav>
    ${pages.map(p=>`<a href="?page=${p.slug}">${esc(p.title)}</a>`).join("")}
  </nav>

  <div id="app"></div>

  <script>
    const pages = ${JSON.stringify(pages)};
    const site = ${JSON.stringify(site)};
    const params = new URLSearchParams(location.search);
    const current = params.get("page") || "index";
    const page = pages.find(p => p.slug === current) || pages[0];
    document.getElementById("app").innerHTML = (${renderPage.toString()})(page, site);
  </script>

  </body></html>`;
}
