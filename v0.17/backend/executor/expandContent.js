import { writeSection } from "./aiWriter.js";

export async function expandIfThin({ title, content, allowAI = false }) {
  const MIN_LENGTH = 240;

  if (content.length >= MIN_LENGTH) {
    return content;
  }

  if (!allowAI) {
    return content + `
<p>
${title} are an important part of many systems. Over time, proven methods,
best practices, and real-world examples have shaped how people understand
and apply this topic effectively.
</p>`;
  }

  const aiText = await writeSection({
    topic: title,
    intent: "Expand this section with practical, informative detail"
  });

  return content + `
<p>${aiText.replace(/\n+/g, "</p><p>")}</p>`;
}
