import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function loadPromptContract() {
  const contractPath = path.join(__dirname, "prompt.contract.json");
  return JSON.parse(fs.readFileSync(contractPath, "utf-8"));
}

export function loadPrompt(relativePromptPath) {
  const promptPath = path.join(__dirname, "..", "..", relativePromptPath);
  return fs.readFileSync(promptPath, "utf-8");
}

export function validatePromptMutation(contract, attemptedMutations = {}) {
  for (const [key, mutation] of Object.entries(attemptedMutations)) {
    const rule = contract.prompts[key];

    if (!rule) {
      throw new Error(`Prompt type '${key}' is not defined in contract`);
    }

    if (!rule.mutable && mutation !== undefined) {
      throw new Error(`Mutation of '${key}' prompt is forbidden by contract`);
    }
  }
}
