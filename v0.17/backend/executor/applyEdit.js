import fs from "fs";
import path from "path";
import { writeSection } from "./aiWriter.js";

export async function applyEdit({
  buildRoot,
  site,
  revision,
  page,
  instruction
}) {
  const pagePath = path.join(
    buildRoot,
    site,
    revision,
    `${page}.html`
  );

  if (!fs.existsSync(pagePath)) {
    throw new Error("Page does not exist");
  }

  const html = fs.readFileSync(pagePath, "utf-8");

  const match = html.match(/<main>([\s\S]*?)<\/main>/);
  if (!match) {
    throw new Error("No <main> section found");
  }

  const original = match[1].trim();

  const rewritten = await writeSection({
    topic: site,
    intent: instruction
  });

  const updated = html.replace(
    /<main>[\s\S]*?<\/main>/,
    `<main>\n${rewritten}\n</main>`
  );

  fs.writeFileSync(pagePath, updated, "utf-8");

  return { page, status: "updated" };
}
