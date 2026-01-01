export function planToSpec(plan) {
  const pages = Object.entries(plan.pages).map(([key, sections]) => ({
    slug: key === "home" ? "index" : key,
    title: key.charAt(0).toUpperCase() + key.slice(1),
    sections: sections.map(type => ({
      type,
      content: null
    }))
  }));

  return {
    site: {
      name: "site",
      tone: plan.tone,
      pages
    }
  };
}
