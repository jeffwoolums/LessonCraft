// index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// Health endpoint
app.get("/health", (req, res) => {
  res.send("🩺 Server is alive.");
});

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Lesson generator endpoint
app.post("/generate", async (req, res) => {
  // Extract lesson input parameters with defaults
  const {
    topic,
    scriptures_per_slide = 2,
    include_quotes = true,
    speaker = "",
    source = "",
    audience = "Adult Sunday School Class",
    tone = "Inspirational",
    duration_minutes = 45,
    points_per_slide = 3,
    questions_per_slide = 2,
    introWordCount = 300 // support for custom intro length if desired
  } = req.body;

  // Construct the prompt for OpenAI
  const prompt = `
Create an engaging, historically accurate LDS Sunday School lesson titled "${topic}".

STRUCTURE the lesson PRECISELY in the JSON format below. DO NOT include any "id" fields at any level:

{
  "title": "Lesson Title",
  "lessonPoints": [
    {
      "title": "Introduction",
      "summary": "Brief lesson intro summary.",
      "story": "A relevant, inspiring, or historical story.",
      "historicalContext": "Brief historical context if applicable.",
      "relatableHymns": [{"title": "", "number": "", "link": ""}],
      "scriptures": [{"verse": "", "reference": "", "link": ""}],
      "quotes": [{"text": "", "author": "", "source": ""}],
      "subpoints": [
        {
          "text": "First key teaching or parable",
          "explanation": "Explanation and application to modern life.",
          "scriptures": [{"verse": "", "reference": "", "link": ""}],
          "quotes": [{"text": "", "author": "", "source": ""}],
          "links": []
        }
      ],
      "questions": ["Discussion question related to the point"],
      "layoutSettings": {
        "sizing": {"width": 375, "height": 667},
        "margins": {"top": 16, "bottom": 16, "left": 16, "right": 16},
        "borders": {"color": "gray", "width": 2, "radius": 8},
        "graphicSettings": {"shadowEnabled": true, "shadowRadius": 5, "shadowOpacity": 0.3}
      }
    }
  ]
}

Instructions:
- The introduction should be around ${introWordCount} words.
- Generate ${points_per_slide} major lesson points ("lessonPoints" array).
- Each point must include all listed fields, even if some arrays are empty.
- Include ${scriptures_per_slide} scripture references per lesson point, and ${questions_per_slide} discussion questions per point.
- Use a warm, ${tone} tone for an ${audience}.

Respond ONLY with valid JSON (no markdown or extra explanation).
`;

  try {
    // Call OpenAI for completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Respond ONLY with valid JSON. Strictly no markdown, no explanations." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    let responseText = completion.choices[0].message.content.trim();
    // Remove accidental markdown fences if present
    responseText = responseText.replace(/^```json|^```|```$/g, '').trim();

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
