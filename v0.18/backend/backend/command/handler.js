import execute from "../executor/index.js";

export async function handleCommand({ site, text, buildRoot }) {
  if (!text) {
    throw new Error("Command text required");
  }

  // Simple routing (expand later)
  if (text.toLowerCase().startsWith("create")) {
    return await execute({
      mode: "full",
      prompt: text,
      buildRoot
    });
  }

  return await execute({
    mode: "page",
    target: { slug: "pricing" },
    buildRoot
  });
}
