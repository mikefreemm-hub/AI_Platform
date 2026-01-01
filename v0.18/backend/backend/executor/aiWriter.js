import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function writeSection({ topic, intent }) {
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You write concise, factual website content. Do not add headings, HTML, or lists."
      },
      {
        role: "user",
        content:
          `Topic: ${topic}\nIntent: ${intent}\nWrite 2 concise paragraphs.`
      }
    ],
    temperature: 0.3
  });

  return response.choices[0].message.content.trim();
}
