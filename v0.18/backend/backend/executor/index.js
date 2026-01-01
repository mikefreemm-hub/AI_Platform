import runFull from "./runFull.js";
import runPage from "./runPage.js";

export default async function execute(options) {
  const mode = options?.mode || "full";

  if (mode === "full") {
    return runFull(options);
  }

  if (mode === "page") {
    return runPage(options);
  }

  throw new Error(`Unknown execution mode: ${mode}`);
}
