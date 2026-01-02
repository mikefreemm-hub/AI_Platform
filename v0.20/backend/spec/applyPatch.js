import { applyDeferredIntent } from "./universalBrain.js";
import { applyUniversalActions } from "./actionsEngine.js";

export function applyPatch(spec, plan){
  console.log("=== APPLY PATCH CALLED ===");
  console.log("PLAN TYPE:", plan?.type);
  console.log("PLAN SUMMARY:", plan?.summary);

  if (!spec || !plan) return spec;

  // Attach user text so downstream engines can read it if needed
  const text =
    (plan.type === "refine" && plan.changes && plan.changes.map(c => c.text).join(" ")) ||
    plan.prompt ||
    plan.text ||
    plan.summary ||
    "";

  spec.__genericText = String(text || "").trim();

  // 1) Apply deterministic "universal actions" (pages/sections/theme/intent)
  if (plan.type === "refine") {
    spec = applyUniversalActions(spec, spec.__genericText);
  }

  // 2) Apply legacy deferred intent mutations (kept for backwards compat)
  spec = applyDeferredIntent(spec);

  console.log("=========================");
  return spec;
}
