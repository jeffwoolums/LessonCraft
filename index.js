const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai");
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/generate", async (req, res) => {
  const { topic, scriptureSources = [], storySources = [] } = req.body;

  const prompt = `
    Create a JSON array where each object represents one slide for a 55-minute LDS lesson titled "${topic}". 
    Each slide object must contain:
    - "title": String
    - "subpoints": Array of key discussion points
    - "summary": Optional short summary (1-2 sentences)
    - "quotes": Optional relevant quotes (Array of strings)

    Scripture sources: ${scriptureSources.join(", ")}.
    Story sources: ${storySources.join(", ")}.

    Ensure slides include vivid stories, personal examples, and real-life applications from these sources.
    Respond ONLY with valid JSON, without markdown or other text.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content.trim();
    const slides = JSON.parse(responseText);

    res.status(200).json(slides);
  } catch (err) {
    console.error("❌ Error:", err.message || err);
    res.status(500).send("Something went wrong generating lesson");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});