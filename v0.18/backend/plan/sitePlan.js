export function createEmptyPlan() {
  return {
    purpose: null,
    audience: null,
    siteType: null,
    tone: "neutral",
    pages: {},          // { home: ["hero","features"], ... }
    maxPages: null      // optional numeric target
  };
}
