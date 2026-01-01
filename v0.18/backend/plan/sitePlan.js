export function createEmptyPlan() {
  return {
    // High-level intent
    purpose: null,
    audience: null,
    siteType: null,

    // Brand / style intent
    brandName: null,
    theme: "light",        // light | dark
    primaryColor: "#2563eb", // default blue

    // Writing intent
    tone: "neutral",       // neutral | friendly | formal
    quality: "basic",      // basic | professional | marketing

    // Structure intent
    pages: {},              // { home: ["hero","features"], ... }
    maxPages: null          // optional numeric target
  };
}
