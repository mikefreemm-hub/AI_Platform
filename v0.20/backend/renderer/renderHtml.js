function esc(s=""){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#39;")
}

function renderNav(site, currentSlug){
  const items = (site.pages||[])
    .map(p => {
      const href = (p.slug==="index") ? "index.html" : `${p.slug}.html`
      const active = p.slug===currentSlug ? "active" : ""
      return `<a class="navlink ${active}" href="${href}">${esc(p.title||p.slug)}</a>`
    })
    .join("")
  return `<nav class="nav">${items}</nav>`
}

function renderSection(sec){
  const t = sec?.type || "content"

  if(t==="hero"){
    const cta = sec.cta || {}
    const href = cta.href || "#"
    return `
      <section class="hero">
        <h1>${esc(sec.headline||"")}</h1>
        <p class="lead">${esc(sec.subhead||"")}</p>
        <div class="hero-actions">
          <a class="btn primary" href="${esc(href)}">${esc(cta.label||"Get Started")}</a>
        </div>
      </section>
    `
  }

  if(t==="features"){
    const items = (sec.items||[]).map(x=>`
      <div class="card">
        <h3>${esc(x.title||"")}</h3>
        <p>${esc(x.body||"")}</p>
      </div>
    `).join("")
    return `
      <section>
        <h2>Features</h2>
        <div class="grid">${items}</div>
      </section>
    `
  }

  if(t==="grid"){
    const items = (sec.items||[]).map(x=>`
      <div class="card">
        <h3>${esc(x.title||"")}</h3>
        <p>${esc(x.body||"")}</p>
      </div>
    `).join("")
    return `
      <section>
        <h2>${esc(sec.headline||"")}</h2>
        <div class="grid">${items}</div>
      </section>
    `
  }

  if(t==="pricing"){
    const plans = (sec.plans||[]).map(p=>`
      <div class="card">
        <h3>${esc(p.name||"")}</h3>
        <div class="price">${esc(p.price||"")}</div>
        <ul class="list">
          ${(p.perks||[]).map(x=>`<li>${esc(x)}</li>`).join("")}
        </ul>
        <a class="btn" href="contact.html">Choose</a>
      </div>
    `).join("")
    return `
      <section>
        <h2>${esc(sec.headline||"Pricing")}</h2>
        <div class="grid">${plans}</div>
      </section>
    `
  }

  if(t==="testimonials"){
    const items = (sec.items||[]).map(x=>`
      <div class="card">
        <p class="quote">“${esc(x.quote||"")}”</p>
        <div class="meta">— ${esc(x.name||"")}</div>
      </div>
    `).join("")
    return `
      <section>
        <h2>Testimonials</h2>
        <div class="grid">${items}</div>
      </section>
    `
  }

  if(t==="faq"){
    const items = (sec.items||[]).map(x=>`
      <details class="faq">
        <summary>${esc(x.q||"")}</summary>
        <div class="faq-a">${esc(x.a||"")}</div>
      </details>
    `).join("")
    return `
      <section>
        <h2>FAQ</h2>
        <div class="stack">${items}</div>
      </section>
    `
  }

  if(t==="contact"){
    const fields = (sec.fields||["Name","Email","Message"])
    const cta = sec.cta || { label:"Send" }
    return `
      <section>
        <h2>${esc(sec.headline||"Contact")}</h2>
        <p>${esc(sec.body||"")}</p>
        <form class="form" onsubmit="return false;">
          ${fields.map(f=>{
            const isMsg = String(f).toLowerCase().includes("message")
            return isMsg
              ? `<label>${esc(f)}<textarea placeholder="${esc(f)}"></textarea></label>`
              : `<label>${esc(f)}<input placeholder="${esc(f)}"/></label>`
          }).join("")}
          <button class="btn primary" type="button">${esc(cta.label||"Send Message")}</button>
        </form>
      </section>
    `
  }

  if(t==="cta"){
    const cta = sec.cta || {}
    const href = cta.href || "#"
    return `
      <section class="cta">
        <h2>${esc(sec.headline||"")}</h2>
        <p>${esc(sec.body||"")}</p>
        <a class="btn primary" href="${esc(href)}">${esc(cta.label||"Continue")}</a>
      </section>
    `
  }

  // content fallback
  return `
    <section>
      <h2>${esc(sec.headline||"")}</h2>
      <p>${esc(sec.body||"")}</p>
    </section>
  `
}

function computeCss(spec){
  const site = spec.site || {}
  const intent = site.intent?.global || {}
  const theme = site.theme || { mode:"dark", accent:"#6aa3ff" }

  const warmth = Number(intent.warmth ?? 0.5)
  const calm = Number(intent.calm ?? 0.5)
  const density = Number(intent.density ?? 0.5)
  const sales = Number(intent.salesiness ?? 0.5)

  const isDark = (theme.mode || "dark") === "dark"
  const accent = theme.accent || "#6aa3ff"

  const bg = isDark ? "#0b0e11" : "#f7f7fb"
  const panel = isDark ? "#0e131b" : "#ffffff"
  const text = isDark ? "#e6e6e6" : "#141414"
  const muted = isDark ? "rgba(230,230,230,0.75)" : "rgba(20,20,20,0.75)"
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"

  const radius = calm > 0.6 ? "18px" : "12px"
  const space = (density < 0.5) ? "18px" : "14px"
  const maxw = (density < 0.5) ? "1000px" : "940px"
  const headlineWeight = (sales > 0.55) ? 800 : (warmth > 0.6 ? 750 : 700)

  return `
    :root{
      --bg:${bg};
      --panel:${panel};
      --text:${text};
      --muted:${muted};
      --border:${border};
      --accent:${accent};
      --radius:${radius};
      --space:${space};
      --maxw:${maxw};
    }

    *{ box-sizing:border-box; }
    body{
      margin:0;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif;
      background: var(--bg);
      color: var(--text);
      line-height:1.5;
    }

    .wrap{
      max-width: var(--maxw);
      margin: 0 auto;
      padding: calc(var(--space) * 2);
    }

    .nav{
      display:flex;
      gap:10px;
      flex-wrap:wrap;
      padding: 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: rgba(255,255,255,0.02);
      position: sticky;
      top: 0;
      backdrop-filter: blur(8px);
      z-index: 10;
    }

    .navlink{
      text-decoration:none;
      color: var(--muted);
      padding: 8px 10px;
      border-radius: 10px;
      border: 1px solid transparent;
    }
    .navlink:hover{
      color: var(--text);
      border-color: var(--border);
    }
    .navlink.active{
      color: var(--text);
      border-color: var(--border);
      background: rgba(255,255,255,0.04);
    }

    h1{
      font-size: clamp(2.0rem, 3vw, 2.6rem);
      margin: 0 0 8px 0;
      font-weight: ${headlineWeight};
      letter-spacing: ${warmth > 0.65 ? "-0.02em" : "-0.01em"};
    }
    h2{
      margin: 0 0 12px 0;
      font-size: 1.35rem;
      letter-spacing: -0.01em;
    }
    p{ color: var(--muted); margin: 0 0 12px 0; max-width: 70ch; }

    section{
      margin-top: calc(var(--space) * 2);
      padding: calc(var(--space) * 1.2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      background: rgba(255,255,255,0.02);
    }

    .hero .lead{ font-size: 1.05rem; }
    .hero-actions{ margin-top: 12px; display:flex; gap:10px; flex-wrap:wrap; }

    .grid{
      display:grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 12px;
      margin-top: 12px;
    }

    .card{
      padding: 14px;
      border-radius: calc(var(--radius) - 4px);
      border: 1px solid var(--border);
      background: var(--panel);
    }

    .btn{
      display:inline-block;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.03);
      color: var(--text);
      text-decoration:none;
      font-weight: 600;
    }
    .btn.primary{
      background: linear-gradient(135deg, var(--accent), rgba(255,255,255,0.10));
      border-color: rgba(255,255,255,0.14);
    }

    .price{ font-size: 1.6rem; font-weight: 800; margin: 10px 0; }

    .list{ margin:0; padding-left: 18px; color: var(--muted); }
    .quote{ color: var(--text); margin:0 0 8px 0; }
    .meta{ color: var(--muted); font-size: 0.95rem; }

    .stack{ display:flex; flex-direction:column; gap:10px; }
    .faq{ border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; background: var(--panel); }
    .faq summary{ cursor:pointer; color: var(--text); font-weight: 700; }
    .faq-a{ color: var(--muted); margin-top: 8px; }

    .form{ display:grid; gap:10px; margin-top: 12px; }
    label{ display:grid; gap:6px; color: var(--muted); font-size: 0.95rem; }
    input, textarea{
      width:100%;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: rgba(255,255,255,0.03);
      color: var(--text);
      outline:none;
      font-family: inherit;
    }
    textarea{ min-height: 110px; resize: vertical; }
  `
}

function renderPageHtml(spec, slug){
  const site = spec.site || {}
  const page = (site.pages||[]).find(p => p.slug===slug) || (site.pages||[])[0] || { slug:"index", title:"Home", sections:[] }
  const css = computeCss(spec)
  const nav = renderNav(site, page.slug)
  const sections = (page.sections||[]).map(renderSection).join("")

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>${esc(site.description || site.name || "Site")} — ${esc(page.title || "")}</title>
  <style>${css}</style>
</head>
<body>
  <div class="wrap">
    ${nav}
    ${sections}
  </div>
</body>
</html>`
}

export function renderSite(spec){
  const site = spec.site || {}
  const pages = (site.pages||[]).map(p => p.slug)
  const out = {}

  // Always write index.html for "index" page
  if(pages.includes("index")){
    out["index.html"] = renderPageHtml(spec, "index")
  } else if((site.pages||[])[0]) {
    out["index.html"] = renderPageHtml(spec, (site.pages||[])[0].slug)
  } else {
    out["index.html"] = renderPageHtml({ site:{ pages:[{slug:"index",title:"Home",sections:[]}] } }, "index")
  }

  // Write each other page as slug.html
  for(const slug of pages){
    if(slug==="index") continue
    out[`${slug}.html`] = renderPageHtml(spec, slug)
  }

  return out
}
