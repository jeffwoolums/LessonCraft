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
  Create a complete lesson titled "${topic}" in JSON format. 
  
  Structure it EXACTLY as follows:
  
  {
    "title": "${topic}",
    "lessonPoints": [{
      "title": "Slide title",
      "subpoints": [{
        "text": "Main point clearly stated in one sentence",
        "explanation": "Optional detailed doctrinal explanation",
        "scriptures": [{
          "verse": "Full scripture verse text",
          "link": "URL to scripture on churchofjesuschrist.org"
        }],
        "quotes": ["Relevant LDS quote"],
        "links": ["Additional relevant URLs"]
      }],
      "story": "Optional detailed narrative example (200-300 words)",
      "summary": "Brief summary (1-2 sentences)",
      "scriptures": [{
        "verse": "Additional scripture verse text",
        "link": "URL to additional scripture"
      }],
      "questions": ["Engaging group discussion question 1?", "Question 2?"],
      "quotes": ["Additional relevant LDS quotes"]
    }]
  }
  
  Sources: ${scriptureSources.join(", ")}, ${storySources.join(", ")}.
  
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
