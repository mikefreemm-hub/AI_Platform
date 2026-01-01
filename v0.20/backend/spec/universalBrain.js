function slugify(s = "site") {
  return String(s)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48) || "site";
}

function pickTone(prompt = "") {
  const p = prompt.toLowerCase();
  if (p.includes("luxury") || p.includes("premium") || p.includes("enterprise")) return "premium";
  if (p.includes("fun") || p.includes("playful")) return "playful";
  if (p.includes("minimal") || p.includes("clean")) return "minimal";
  return "modern";
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function hasSection(page, type) {
  return ensureArray(page.sections).some(s => s && s.type === type);
}

function addSection(page, section) {
  page.sections = ensureArray(page.sections);
  page.sections.push(section);
}

function upsertSection(page, type, section) {
  page.sections = ensureArray(page.sections);
  const idx = page.sections.findIndex(s => s && s.type === type);
  if (idx === -1) page.sections.push(section);
  else page.sections[idx] = section;
}

function baseSaasSections(purpose, tone) {
  const headline =
    tone === "premium"
      ? `The AI platform that makes serious work feel effortless.`
      : tone === "playful"
      ? `Build smarter with an AI platform that actually feels good to use.`
      : `A modern AI platform to ship faster with confidence.`;

  const sub =
    tone === "premium"
      ? `Secure, compliant, and built for teams who need reliability at scale.`
      : tone === "playful"
      ? `Beautiful UX, fast iteration, and zero friction from idea → launch.`
      : `Generate, refine, and export production-ready sites in minutes.`;

  return [
    { type: "hero", headline, subhead: sub, primaryCta: "Get started", secondaryCta: "View demo" },
    { type: "logos", title: "Trusted by teams building the future", items: ["Nova", "Aperture", "Kite", "Northwind", "Helio"] },
    {
      type: "features",
      title: "Everything you need to build fast",
      items: [
        { title: "Chat-first editing", text: "Refine any part of your site with natural language." },
        { title: "Structured output", text: "Spec-driven generation keeps output consistent and editable." },
        { title: "Export-ready", text: "Download a clean HTML build whenever you’re ready." }
      ]
    },
    {
      type: "benefits",
      title: "Why teams switch",
      items: [
        "Consistent design system across revisions",
        "Clear content hierarchy and CTAs",
        "Fast iteration without breaking layout"
      ]
    },
    {
      type: "testimonials",
      title: "Teams ship faster",
      items: [
        { quote: "We cut our landing page iteration time from days to an hour.", name: "Product Lead", org: "Northwind" },
        { quote: "The spec model makes refinement predictable and safe.", name: "Engineer", org: "Helio" }
      ]
    },
    { type: "faq", title: "FAQ", items: [
      { q: "Can I refine using plain English?", a: "Yes — just describe what you want and the spec updates." },
      { q: "Can I export?", a: "Yes — export generates clean HTML you can host anywhere." },
      { q: "Can I make it darker / lighter?", a: "Yes — theme refinements update the UI style consistently." }
    ]},
    { type: "cta", title: "Ready to build?", text: "Generate a site and refine it like a real conversation.", button: "Start now" }
  ];
}

export function createNewSpec(message) {
  const tone = pickTone(message);
  const name = slugify(message.includes(" for ") ? message.split(" for ")[1] : message);
  return {
    site: {
      name: name || "generated-site",
      purpose: message,
      tone,
      theme: { mode: "dark", accent: "blue" },
      nav: [
        { label: "Home", target: "index" }
      ],
      pages: [
        {
          slug: "index",
          title: "Home",
          sections: baseSaasSections(message, tone)
        }
      ],
      lastInstruction: message
    }
  };
}

function applyTheme(spec, instruction) {
  const t = instruction.toLowerCase();
  spec.site.theme = spec.site.theme || { mode: "dark", accent: "blue" };

  if (t.includes("dark")) spec.site.theme.mode = "dark";
  if (t.includes("light")) spec.site.theme.mode = "light";

  if (t.includes("purple")) spec.site.theme.accent = "purple";
  else if (t.includes("green")) spec.site.theme.accent = "green";
  else if (t.includes("orange")) spec.site.theme.accent = "orange";
  else if (t.includes("red")) spec.site.theme.accent = "red";
  else if (t.includes("blue")) spec.site.theme.accent = "blue";
}

function addPricing(spec) {
  const home = spec.site.pages.find(p => p.slug === "index") || spec.site.pages[0];
  if (!home) return;

  if (!hasSection(home, "pricing")) {
    addSection(home, {
      type: "pricing",
      title: "Pricing",
      subtitle: "Simple plans that scale with you",
      plans: [
        { name: "Starter", price: "$0", period: "mo", bullets: ["1 project", "Basic export", "Community support"], cta: "Start free" },
        { name: "Pro", price: "$29", period: "mo", bullets: ["Unlimited projects", "Priority export", "Revision history"], cta: "Go Pro", highlight: true },
        { name: "Team", price: "$99", period: "mo", bullets: ["Team workspace", "Shared revisions", "Admin controls"], cta: "Contact sales" }
      ]
    });
  }

  // ensure nav link exists
  spec.site.nav = ensureArray(spec.site.nav);
  if (!spec.site.nav.some(n => n.target === "pricing")) {
    spec.site.nav.push({ label: "Pricing", target: "index#pricing" });
  }
}

function makeMorePremium(spec) {
  spec.site.tone = "premium";
  const home = spec.site.pages.find(p => p.slug === "index") || spec.site.pages[0];
  if (!home) return;

  // tighten hero copy
  const hero = ensureArray(home.sections).find(s => s.type === "hero");
  if (hero) {
    hero.headline = "A premium AI platform for teams that ship.";
    hero.subhead = "Enterprise-grade reliability, beautiful UX, and predictable refinement — all in one place.";
    hero.primaryCta = "Request access";
    hero.secondaryCta = "See it in action";
  }

  // upgrade logos + testimonials wording a bit
  const logos = ensureArray(home.sections).find(s => s.type === "logos");
  if (logos) logos.title = "Trusted by teams with high standards";

  const t = ensureArray(home.sections).find(s => s.type === "testimonials");
  if (t && Array.isArray(t.items)) {
    t.items = t.items.map(x => ({
      ...x,
      quote: String(x.quote || "").replace(/cut|faster|hour/i, "shipped with confidence and clarity.")
    }));
  }
}

function addFaq(spec) {
  const home = spec.site.pages.find(p => p.slug === "index") || spec.site.pages[0];
  if (!home) return;
  if (!hasSection(home, "faq")) {
    addSection(home, { type: "faq", title: "FAQ", items: [
      { q: "How does refinement work?", a: "You describe changes in plain language; the spec updates and re-renders." },
      { q: "Is the output editable?", a: "Yes — the spec stays structured so changes remain stable." }
    ]});
  }
}

function addContact(spec) {
  const home = spec.site.pages.find(p => p.slug === "index") || spec.site.pages[0];
  if (!home) return;
  if (!hasSection(home, "contact")) {
    addSection(home, { type: "contact", title: "Contact", text: "Tell us what you’re building — we’ll reply within 1–2 business days.", fields: ["Name", "Email", "Message"], button: "Send" });
  }
}

export function refineSpec(spec, instruction) {
  if (!spec || !spec.site) return createNewSpec(instruction);

  const t = instruction.toLowerCase();

  applyTheme(spec, instruction);

  if (t.includes("add pricing") || t.includes("pricing section") || t.includes("pricing")) addPricing(spec);
  if (t.includes("more premium") || t.includes("more enterprise") || t.includes("luxury")) makeMorePremium(spec);
  if (t.includes("add faq") || t.includes("faq")) addFaq(spec);
  if (t.includes("add contact") || t.includes("contact")) addContact(spec);

  // default behavior: if user says "make it better" / "improve", gently enrich without breaking structure
  if (t.includes("improve") || t.includes("make it better") || t.includes("better copy")) {
    const home = spec.site.pages.find(p => p.slug === "index") || spec.site.pages[0];
    if (home) {
      const features = ensureArray(home.sections).find(s => s.type === "features");
      if (features && Array.isArray(features.items)) {
        features.items = features.items.map(it => ({
          ...it,
          text: String(it.text || "").replace(/\.$/, "") + " — with clean, consistent structure."
        }));
      }
    }
  }

  spec.site.lastInstruction = instruction;
  return spec;
}
