function inferArchetype(prompt) {
  const p = prompt.toLowerCase();

  if (p.includes("saas") || p.includes("software") || p.includes("platform")) return "saas";
  if (p.includes("portfolio") || p.includes("photography") || p.includes("designer")) return "portfolio";
  if (p.includes("restaurant") || p.includes("cafe") || p.includes("menu")) return "restaurant";
  if (p.includes("blog") || p.includes("writing")) return "blog";
  if (p.includes("business") || p.includes("company") || p.includes("services")) return "business";
  if (p.includes("landing") || p.includes("startup")) return "landing";

  return "default";
}

function pagesFor(type) {
  const map = {
    saas: [
      { slug: "index", title: "Home", sections: ["hero", "features"] },
      { slug: "pricing", title: "Pricing", sections: ["pricing"] },
      { slug: "about", title: "About", sections: ["about"] }
    ],
    portfolio: [
      { slug: "index", title: "Home", sections: ["hero"] },
      { slug: "work", title: "Work", sections: ["features"] },
      { slug: "about", title: "About", sections: ["about"] }
    ],
    restaurant: [
      { slug: "index", title: "Home", sections: ["hero"] },
      { slug: "menu", title: "Menu", sections: ["features"] },
      { slug: "contact", title: "Contact", sections: ["contact"] }
    ],
    blog: [
      { slug: "index", title: "Home", sections: ["hero"] },
      { slug: "posts", title: "Posts", sections: ["features"] },
      { slug: "about", title: "About", sections: ["about"] }
    ],
    business: [
      { slug: "index", title: "Home", sections: ["hero", "features"] },
      { slug: "services", title: "Services", sections: ["features"] },
      { slug: "contact", title: "Contact", sections: ["contact"] }
    ],
    landing: [
      { slug: "index", title: "Home", sections: ["hero", "features", "pricing"] }
    ],
    default: [
      { slug: "index", title: "Home", sections: ["hero"] },
      { slug: "about", title: "About", sections: ["about"] }
    ]
  };

  return map[type];
}

export default function generateSpec(prompt = "") {
  const archetype = inferArchetype(prompt);

  const pages = pagesFor(archetype).map(p => ({
    slug: p.slug,
    title: p.title,
    sections: p.sections.map(s => ({ type: s, content: null }))
  }));

  return {
    site: {
      name: prompt
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "") || "site",
      archetype,
      pages
    }
  };
}
