const API_KEY = process.env.OPENAI_API_KEY;

export async function generateSectionContent({
  siteName,
  pageTitle,
  sectionType,
  instruction,
  tone = "neutral"
}) {
  if (!API_KEY) {
    return null;
  }

  const prompt = `
You are writing content for a website.

Site: ${siteName}
Page: ${pageTitle}
Section: ${sectionType}
Tone: ${tone}

Instruction:
${instruction}

Write clean, concise HTML suitable for a website section.
Do not include <html>, <head>, or <body> tags.
`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + API_KEY,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7
    })
  });

  const data = await res.json();
  return data.choices?.[0]?.message?.content || null;
}
