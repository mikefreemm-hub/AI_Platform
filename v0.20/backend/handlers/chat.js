import { loadSpec, saveSpec } from "../memory/siteStore.js";

function slug(v = "") {
  return v.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function normalizeItem(v) {
  return v
    .replace(/^\s*(and|&)\s+/i, "")
    .replace(/[.]+$/g, "")
    .trim();
}

function extractListItems(message) {
  const m = message.match(/list\s+(.+?)\s+with/i);
  if (!m) return null;

  return m[1]
    .split(",")
    .map(normalizeItem)
    .filter(Boolean)
    .map(v => ({
      title: v,
      body: "Description coming soon."
    }));
}

export async function handleChat(req, res) {
  const { message = "" } = req.body || {};

  let spec = loadSpec("default");
  if (!spec || typeof spec !== "object") spec = {};

  if (!spec.site) {
    spec.site = {
      title: "Untitled Site",
      pages: ["Home"],
      _pages: [{
        title: "Home",
        slug: "home",
        sections: []
      }]
    };
  }

  if (!Array.isArray(spec.site._pages)) {
    spec.site._pages = (spec.site.pages || []).map(p => ({
      title: p,
      slug: slug(p),
      sections: []
    }));
  }

  const lower = message.toLowerCase();
  const listItems = extractListItems(message);

  for (const p of spec.site._pages) {
    if (lower.includes(p.title.toLowerCase()) && listItems) {
      p.sections = [{
        type: "list",
        items: listItems
      }];
    }
  }

  saveSpec("default", spec);
  res.json({ ok: true, site: "default" });
}
