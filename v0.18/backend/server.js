import express from "express";
import fs from "fs";
import path from "path";

const app = express();
const PORT = 3001;

app.use(express.json());
app.use(express.static("public"));
app.use("/builds", express.static("builds"));

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

function normalize(t) {
  return t.toLowerCase().replace(/[^a-z\s]/g, "").replace(/\s+/g, " ").trim();
}

function slugify(t) {
  return t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

/* =========================
   MEMORY
========================= */

function memoryPath(site) {
  return path.join("builds", site, "memory.json");
}

function loadMemory(site) {
  if (!fs.existsSync(memoryPath(site))) return {};
  return JSON.parse(fs.readFileSync(memoryPath(site), "utf-8"));
}

function saveMemory(site, memory) {
  ensureDir(path.join("builds", site));
  fs.writeFileSync(memoryPath(site), JSON.stringify(memory, null, 2));
}

/* =========================
   THEME (FIXED)
========================= */

function applyTheme(theme, memory, msg) {
  const t = normalize(msg);

  // Memory defaults
  if (memory.theme?.mode === "dark") {
    theme.mode = "dark";
    theme.bg = "#0b0e11";
    theme.text = "#e6e6e6";
  }

  if (memory.theme?.mode === "light") {
    theme.mode = "light";
    theme.bg = "#ffffff";
    theme.text = "#111111";
  }

  if (memory.theme?.accent === "green") {
    theme.accent = "#16a34a";
  }

  // Explicit overrides ALWAYS win
  if (t.includes("dark")) {
    theme.mode = "dark";
    theme.bg = "#0b0e11";
    theme.text = "#e6e6e6";
  }

  if (t.includes("light")) {
    theme.mode = "light";
    theme.bg = "#ffffff";
    theme.text = "#111111";
  }

  if (t.includes("green")) {
    theme.accent = "#16a34a";
  }

  return theme;
}

/* =========================
   SPEC
========================= */

function defaultPage() {
  return {
    sections: [
      { type: "hero", text: "Welcome" },
      { type: "features", items: ["Fast", "Flexible", "Built with AI"] }
    ]
  };
}

function generateSpec(prompt, memory) {
  const theme = {
    mode: "light",
    bg: "#ffffff",
    text: "#111111",
    accent: "#2563eb"
  };

  applyTheme(theme, memory, "");

  return {
    title: prompt,
    theme,
    nav: ["home"],
    pages: { home: defaultPage() },
    currentPage: memory.lastPage || "home"
  };
}

/* =========================
   PAGE + CONTENT
========================= */

function ensurePage(spec, page) {
  if (!spec.pages[page]) {
    spec.pages[page] = defaultPage();
    spec.nav.push(page);
  }
}

function refinePages(spec, msg) {
  const t = normalize(msg);

  const add = t.match(/add (\w+) page/);
  if (add) ensurePage(spec, add[1]);

  const sw = t.match(/(switch to|edit) (\w+) page/);
  if (sw) {
    ensurePage(spec, sw[2]);
    spec.currentPage = sw[2];
  }
}

function refineContent(spec, msg) {
  const t = normalize(msg);
  const page = spec.pages[spec.currentPage];
  if (!page) return;

  const hero = t.match(/rewrite .*hero.* to (.+)/);
  if (hero) {
    const h = page.sections.find(s => s.type === "hero");
    if (h) h.text = hero[1];
  }
}

/* =========================
   RENDER
========================= */

function renderNav(spec) {
  return `<nav>${spec.nav.map(p => `<a href="${p}.html">${p}</a>`).join(" ")}</nav>`;
}

function renderPage(name, page, spec) {
  return `<!DOCTYPE html>
<html>
<head>
<title>${spec.title} – ${name}</title>
<style>
body {
  font-family: system-ui;
  padding: 40px;
  background: ${spec.theme.bg};
  color: ${spec.theme.text};
}
nav a {
  margin-right: 16px;
  color: ${spec.theme.accent};
  text-decoration: none;
}
section { margin-top: 40px; }
</style>
</head>
<body>
${renderNav(spec)}
<h1>${name}</h1>
${page.sections.map(s =>
  s.type === "hero"
    ? `<section><h2>${s.text}</h2></section>`
    : `<section><ul>${s.items.map(i => `<li>${i}</li>`).join("")}</ul></section>`
).join("")}
</body>
</html>`;
}

/* =========================
   CHAT
========================= */

app.post("/chat", (req, res) => {
  const { message, site, revision } = req.body;

  const siteId = site ?? slugify(message);
  const rev = Date.now().toString();
  const dir = path.join("builds", siteId, rev);
  ensureDir(dir);

  let memory = site ? loadMemory(siteId) : {};
  let spec;

  if (!site) {
    spec = generateSpec(message, memory);
  } else {
    spec = JSON.parse(
      fs.readFileSync(path.join("builds", siteId, revision, "spec.json"), "utf-8")
    );
  }

  refinePages(spec, message);
  refineContent(spec, message);

  spec.theme = applyTheme(spec.theme, memory, message);

  // Update memory AFTER resolution
  if (normalize(message).includes("dark")) memory.theme = { ...(memory.theme || {}), mode: "dark" };
  if (normalize(message).includes("light")) memory.theme = { ...(memory.theme || {}), mode: "light" };
  memory.lastPage = spec.currentPage;

  saveMemory(siteId, memory);

  fs.writeFileSync(path.join(dir, "spec.json"), JSON.stringify(spec, null, 2));
  Object.entries(spec.pages).forEach(([n, p]) =>
    fs.writeFileSync(path.join(dir, `${n}.html`), renderPage(n, p, spec))
  );

  res.json({
    message: `Updated site based on: "${message}"`,
    site: siteId,
    revision: rev,
    page: spec.currentPage
  });
});

app.listen(PORT, () =>
  console.log("Dark mode fix applied at http://localhost:3001")
);
