import { createEmptyPlan } from "./sitePlan.js";

function ensurePage(plan, name, sections) {
  if (!plan.pages[name]) {
    plan.pages[name] = sections;
  }
}

export function interpretPlan(text = "", existingPlan = null) {
  const plan = existingPlan
    ? structuredClone(existingPlan)
    : createEmptyPlan();

  const t = text.toLowerCase();

  // ─────────────────────────────
  // SITE TYPE / PURPOSE
  // ─────────────────────────────
  if (t.includes("blog")) plan.siteType = "blog";
  if (t.includes("portfolio")) plan.siteType = "portfolio";
  if (t.includes("saas") || t.includes("platform")) plan.siteType = "saas";
  if (t.includes("website") && !plan.siteType) plan.siteType = "informational";

  // ─────────────────────────────
  // PAGE COUNT INTENT
  // ─────────────────────────────
  const pageMatch = t.match(/(\d+)[ -]?page/);
  if (pageMatch) {
    plan.maxPages = parseInt(pageMatch[1], 10);
  }

  // ─────────────────────────────
  // SEMANTIC EXPANSION — PAGES
  // ─────────────────────────────
  if (t.includes("gallery")) {
    ensurePage(plan, "gallery", ["gallery"]);
  }

  if (t.includes("testimonial")) {
    ensurePage(plan, "testimonials", ["testimonials"]);
  }

  if (t.includes("faq")) {
    ensurePage(plan, "faq", ["faq"]);
  }

  if (t.includes("blog")) {
    ensurePage(plan, "blog", ["posts"]);
  }

  if (t.includes("pricing")) {
    ensurePage(plan, "pricing", ["pricing"]);
  }

  if (t.includes("contact")) {
    ensurePage(plan, "contact", ["contact"]);
  }

  if (t.includes("about")) {
    ensurePage(plan, "about", ["about"]);
  }

  // ─────────────────────────────
  // BASE DEFAULT (ONLY IF EMPTY)
  // ─────────────────────────────
  if (Object.keys(plan.pages).length === 0) {
    plan.pages.home = ["hero", "features"];
    plan.pages.about = ["about"];
    plan.pages.contact = ["contact"];
  }

  // Always ensure home
  if (!plan.pages.home) {
    plan.pages.home = ["hero", "features"];
  }

  // ─────────────────────────────
  // PAGE COUNT FULFILLMENT
  // ─────────────────────────────
  if (plan.maxPages && Object.keys(plan.pages).length < plan.maxPages) {
    const fillers = ["features", "services", "resources", "overview"];
    for (const f of fillers) {
      if (Object.keys(plan.pages).length >= plan.maxPages) break;
      ensurePage(plan, f, [f]);
    }
  }

  return plan;
}
