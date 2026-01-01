function titleCase(slug) {
  if (!slug) return "";
  return slug
    .split("-")
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function normalizePageKey(key) {
  if (key === "index") return "home";
  return key;
}

export function planToSpec(plan) {
  const pageEntries = Object.entries(plan.pages || {});

  const pages = pageEntries.map(([key, sections]) => {
    const normalizedKey = normalizePageKey(key);
    const slug = normalizedKey === "home" ? "index" : normalizedKey;
    const title = normalizedKey === "home" ? "Home" : titleCase(slug);
    const secList = Array.isArray(sections) ? sections : [];

    return {
      slug,
      title,
      sections: secList.map(type => ({
        type,
        content: null
      }))
    };
  });

  // Ensure index exists (UI expects it)
  if (!pages.some(p => p.slug === "index")) {
    pages.unshift({
      slug: "index",
      title: "Home",
      sections: ["hero", "features", "cta"].map(type => ({ type, content: null }))
    });
  }

  return {
    site: {
      name: plan.brandName || "site",
      purpose: plan.purpose || null,
      audience: plan.audience || null,
      siteType: plan.siteType || null,
      theme: plan.theme || "light",
      primaryColor: plan.primaryColor || "#2563eb",
      tone: plan.tone || "neutral",
      quality: plan.quality || "basic",
      pages
    }
  };
}
