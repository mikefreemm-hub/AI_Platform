export function parseCommand(text) {
  const lower = text.toLowerCase();

  if (lower.includes("pricing") && lower.includes("title")) {
    const title = text.split("to").slice(1).join("to").trim();
    return {
      type: "update_page_title",
      slug: "pricing",
      title
    };
  }

  throw new Error("Unrecognized command");
}
