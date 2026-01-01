import { executeSpec } from "./executeSpec.js";

export default async function runFull(spec, options = {}) {
  const intent = options.intent || {};

  const normalized = {
    quality: intent.quality || "basic",
    tone: intent.tone || "neutral"
  };

  const files = executeSpec(spec, normalized);

  return {
    files,
    meta: {
      quality: normalized.quality,
      tone: normalized.tone,
      generatedAt: Date.now()
    }
  };
}
