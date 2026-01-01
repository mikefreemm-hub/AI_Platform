/* =========================================================
   UNIVERSAL BRAIN v0.20 — PAGE-AWARE + SAFE NORMALIZATION
   ========================================================= */

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

function slugify(v = "") {
  return String(v)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "index";
}

/* ---------------- NORMALIZATION ---------------- */

function normalizePages(pages) {
  if (!Array.isArray(pages)) return [];

  return pages.map((p, i) => {
    // String page → object
    if (typeof p === "string") {
      const title = p;
      const slug = title.toLowerCase() === "home" ? "index" : slugify(title);
      return { slug, title, sections: [] };
    }

    // Object page → ensure shape
    const title = p.title || p.name || `Page ${i + 1}`;
    const slug = p.slug || (i === 0 ? "index" : slugify(title));
    const sections = Array.isArray(p.sections) ? p.sections : [];

    return { ...p, slug, title, sections };
  });
}

/* ---------------- PAGE INTENT ---------------- */

function detectTargetPage(instruction, pages) {
  if (!instruction || !pages.length) return null;

  const text = instruction.toLowerCase();

  for (const p of pages) {
    if (
      (p.slug && text.includes(p.slug)) ||
      (p.title && text.includes(p.title.toLowerCase()))
    ) {
      return p.slug;
    }
  }

  if (text.includes("home")) return "index";
  return null;
}

/* ---------------- SECTION FACTORY ---------------- */

function sectionForIntent(text) {
  const t = text.toLowerCase();

  if (t.includes("gallery") || t.includes("photos")) {
    return {
      type: "gallery",
      title: "Gallery",
      items: [
        { title: "Happy pup", body: "A joyful moment." },
        { title: "Play time", body: "Dogs enjoying the park." },
        { title: "Nap time", body: "Resting after a long walk." }
      ]
    };
  }

  if (t.includes("about") || t.includes("story") || t.includes("rescue")) {
    return {
      type: "content",
      title: "Our Story",
      body: "We are a rescue-focused community dedicated to helping dogs find loving homes."
    };
  }

  if (t.includes("faq")) {
    return {
      type: "faq",
      title: "FAQ",
      items: [
        { q: "Can I edit this later?", a: "Yes — just describe the change." },
        { q: "Is this site exportable?", a: "Yes — static export is supported." }
      ]
    };
  }

  return {
    type: "content",
    title: "Update",
    body: text
  };
}

/* ---------------- CORE API ---------------- */

export async function createNewSpec(prompt) {
  return {
    site: {
      name: "site",
      description: prompt,
      pages: [
        {
          slug: "index",
          title: "Home",
          sections: [
            { type: "hero", headline: prompt, subhead: "Generated from natural language." }
          ]
        }
      ]
    }
  };
}

export async function refineSpec(spec, instruction) {
  const next = clone(spec);
  next.site = next.site || {};
  next.site.pages = normalizePages(next.site.pages);

  const pages = next.site.pages;
  const targetSlug = detectTargetPage(instruction, pages);

  // Targeted page edit
  if (targetSlug) {
    const page = pages.find(p => p.slug === targetSlug);
    page.sections.push(sectionForIntent(instruction));
    return next;
  }

  // Default to Home
  const home = pages.find(p => p.slug === "index") || pages[0];
  home.sections.push(sectionForIntent(instruction));

  return next;
}
