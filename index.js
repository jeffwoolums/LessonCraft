const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

app.get("/health", (req, res) => {
  res.send("🩺 Server is alive.");
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/generate", async (req, res) => {
  const {
    topic,
    scriptures_per_slide = 2,
    include_quotes = true,
    speaker = "Default",
    source = "Not specified",
    audience = "Adult Sunday School Class",
    tone = "Inspirational",
    duration_minutes = 45,
    points_per_slide = 3,
    questions_per_slide = 2
  } = req.body;

  const prompt = `
Create an engaging and historically accurate LDS Sunday School lesson titled "${topic}".

Structure the lesson precisely in the JSON format below, explicitly including ALL REQUIRED FIELDS:

{
  "title": "Lesson Title",
  "lessonPoints": [
    {
      "title": "Introduction",
      "summary": "Brief one-sentence summary.",
      "story": "Engaging narrative (350-450 words).",
      "historicalContext": "Historical context (150-200 words).",
      "scriptures": [
        {
          "verse": "Complete scripture verse text",
          "reference": "Book Chapter:Verse (e.g., Alma 32:21)",
          "link": "Direct URL"
        }
      ],
      "quotes": [
        {
          "text": "Inspirational quote.",
          "author": "Author name",
          "source": "Source URL or reference"
        }
      ],
      "questions": ["Reflective question"]
    }
    // Include additional lesson points similarly
  ]
}

CRITICAL:
- EVERY scripture MUST have "verse", "reference", and "link" fields explicitly included.
- Every section must fully comply with this JSON structure without omissions.

Respond strictly with valid JSON ONLY. No markdown or extra explanations.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Respond ONLY with valid JSON. Strictly no markdown, no explanations." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    let responseText = completion.choices[0].message.content.trim();
    responseText = responseText.replace(/^```json|```$/g, '').trim();

    const lesson = JSON.parse(responseText);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify(lesson));
  } catch (err) {
    console.error("❌ OpenAI/JSON Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
