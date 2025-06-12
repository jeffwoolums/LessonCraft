const { OpenAI } = require("openai");
require('dotenv').config();
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

module.exports = async function callOpenAI(prompt) {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: "Respond ONLY with valid JSON." },
      { role: "user", content: prompt }
    ],
    temperature: 0.7
  });

  let response = completion.choices[0].message.content.trim();
  response = response.replace(/^```json|^```|```$/g, '').trim();

  return JSON.parse(response);
}
