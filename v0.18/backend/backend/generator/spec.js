export function generateSpec(prompt, intent = {}) {
  const siteName = String(prompt || "site")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  const plan = {
    site: {
      name: siteName,
      title: siteName.replace(/-/g, " "),
      tone: intent.tone || "neutral",
      quality: intent.quality || "basic"
    },
    pages: {
      index: {
        title: "Home",
        goal: "introduce",
        copy: "A clear introduction to the product and its value."
      },
      pricing: {
        title: "Pricing",
        goal: "convert",
        copy: "Clear pricing that communicates value and builds trust."
      },
      about: {
        title: "About",
        goal: "build trust",
        copy: "Background, mission, and credibility."
      },
      contact: {
        title: "Contact",
        goal: "engage",
        copy: "Ways for visitors to get in touch."
      }
    }
  };

  // Apply refinement intent safely
  if (intent.refinement && intent.targetPage && plan.pages[intent.targetPage]) {
    const page = plan.pages[intent.targetPage];

    if (/persuasive|convert|value/i.test(intent.refinement)) {
      page.copy = "Compelling pricing that emphasizes value, simplicity, and trust.";
    }

    if (/simplify|simple|clear/i.test(intent.refinement)) {
      page.copy = "Straightforward pricing with minimal friction and clear benefits.";
    }
  }

  return plan;
}
