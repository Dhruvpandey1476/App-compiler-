const Groq = require("groq-sdk");
require("dotenv").config();

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function callClaude(prompt, retries = 2) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const msg = await client.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        max_tokens: 4000,
        messages: [
          { role: "system", content: "You are a software architect. Always respond with ONLY valid JSON. No markdown fences, no explanation, no preamble. Pure JSON only." },
          { role: "user", content: prompt }
        ]
      });
      return msg.choices[0].message.content;
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
    }
  }
}

function safeParseJSON(text) {
  const clean = text.replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
  try { return JSON.parse(clean); } catch (_) {
    const match = clean.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
    throw new Error("JSON parse failed: " + clean.slice(0, 200));
  }
}

module.exports = { callClaude, safeParseJSON };
