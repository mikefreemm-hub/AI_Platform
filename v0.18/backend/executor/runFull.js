import { executeSpec } from "./executeSpec.js";

export default async function runFull(spec, options = {}) {
  const intent = options.intent || {};

  const files = executeSpec(spec, intent);

  return {
    files,
    meta: {
      intent,
      generatedAt: Date.now()
    }
  };
}
