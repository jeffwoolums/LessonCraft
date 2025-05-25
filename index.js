const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai").OpenAI;

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

app.get("/health", (req, res) => {
  res.send("🩺 Server is alive.");
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post("/generate", async (req, res) => {
  const { topic, scriptureSources = [], storySources = [] } = req.body;

const prompt = `
Create an LDS Sunday School lesson titled "${topic}" structured exactly as follows in JSON format. The lesson duration should be around 35–40 minutes.

{
  "title": "${topic}",
  "lessonPoints": [
    {
      "title": "Introduction",
      "story": "Detailed introductory narrative (300-400 words), sourced from official LDS publications or Church history.",
      "historicalContext": "Relevant brief historical background.",
      "relatableHymns": [{
        "title": "Relevant Hymn",
        "number": "Hymn number",
        "link": "URL to hymn"
      }],
      "subpoints": [{
        "text": "Clear introductory point",
        "explanation": "Detailed doctrinal explanation",
        "scriptures": [{"verse": "Verse text", "link": "URL"}],
        "quotes": ["LDS quote"],
        "links": ["Additional URLs"]
      }],
      "questions": ["Opening question"],
      "summary": "Brief summary (1-2 sentences)"
    },
    {
      "title": "First Parable or Key Teaching",
      "story": "Brief narrative example (200-300 words).",
      "historicalContext": "Historical background (if applicable).",
      "relatableHymns": [{
        "title": "Relevant Hymn",
        "number": "Hymn number",
        "link": "URL"
      }],
      "subpoints": [
        {"text": "First key point clearly stated", "explanation": "Detailed explanation", "scriptures": [{"verse": "Verse text", "link": "URL"}], "quotes": ["LDS quote"]},
        {"text": "Second key point clearly stated", "explanation": "Detailed explanation", "scriptures": [{"verse": "Verse text", "link": "URL"}], "quotes": ["LDS quote"]},
        {"text": "Third key point clearly stated", "explanation": "Detailed explanation", "scriptures": [{"verse": "Verse text", "link": "URL"}], "quotes": ["LDS quote"]}
      ],
      "questions": ["2-3 engaging questions"],
      "summary": "Brief summary"
    },
    {
      "title": "Second Parable or Key Teaching",
      "story": "Brief narrative example.",
      "historicalContext": "Historical background.",
      "relatableHymns": [{"title": "Hymn", "number": "number", "link": "URL"}],
      "subpoints": [
        {"text": "First detailed doctrinal point", "explanation": "...", "scriptures": [...], "quotes": [...]},
        {"text": "Second detailed doctrinal point", "explanation": "...", "scriptures": [...], "quotes": [...]}
      ],
      "questions": ["Engaging discussion questions"],
      "summary": "Brief summary"
    },
    {
      "title": "Third Parable or Key Teaching",
      "story": "Brief narrative example.",
      "historicalContext": "Historical background.",
      "relatableHymns": [{"title": "Hymn", "number": "number", "link": "URL"}],
      "subpoints": [
        {"text": "Clear doctrinal point", "explanation": "...", "scriptures": [...], "quotes": [...]},
        {"text": "Another doctrinal point", "explanation": "...", "scriptures": [...], "quotes": [...]}
      ],
      "questions": ["Engaging questions"],
      "summary": "Brief summary"
    },
    {
      "title": "Conclusion",
      "story": "Closing narrative (100-150 words).",
      "historicalContext": "Optional historical context",
      "relatableHymns": [{"title": "Closing Hymn", "number": "number", "link": "URL"}],
      "questions": ["Final reflective question"],
      "quotes": ["Inspirational quote"],
      "summary": "Encapsulate key lessons clearly"
    }
  ]
}

- Ensure each section has sufficient depth, multiple points, hymns, scriptures, historical context, and quotes.
- Include thoughtful and practical discussion questions suitable for adult participants.

Provide ONLY valid JSON. No markdown or commentary.
`;
  try {
    console.log("⚙️ Sending request to OpenAI...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are a JSON generator. Respond ONLY with valid JSON. No markdown formatting, explanations, or extra text." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    let responseText = completion.choices[0].message.content.trim();
    responseText = responseText.replace(/^```json|```$/g, '').trim();

    try {
      const lesson = JSON.parse(responseText);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(200).send(JSON.stringify(lesson));
    } catch (parseErr) {
      console.error("❌ Failed to parse OpenAI response as JSON:", responseText);
      res.status(500).json({ raw: responseText, error: parseErr.message });
    }
  } catch (err) {
    console.error("❌ Error calling OpenAI:", err);
    res.status(500).json({ error: "OpenAI request failed.", details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
