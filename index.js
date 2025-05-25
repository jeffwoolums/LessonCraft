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
Create a detailed LDS lesson titled "${topic}" in JSON format. This comprehensive lesson should be structured precisely as follows for a 40-minute class, including relatable hymns and historical context where applicable:

{
  "title": "${topic}",
  "lessonPoints": [
    {
      "title": "Introduction",
      "story": "Detailed introductory narrative (about 300 words), sourced from official LDS publications, conference talks, or significant Church history events relevant to the lesson topic. Provide historical context if applicable.",
      "historicalContext": "Brief historical background (if relevant to the story), about 2-3 sentences, highlighting cultural, historical, or doctrinal settings related to the story.",
      "relatableHymns": [{
        "title": "Hymn Title",
        "number": "Hymn number",
        "link": "URL to hymn on churchofjesuschrist.org"
      }],
      "subpoints": [
        {
          "text": "Main introductory point clearly stated in one sentence",
          "explanation": "Detailed doctrinal explanation",
          "scriptures": [{
            "verse": "Full scripture text",
            "link": "URL to scripture on churchofjesuschrist.org"
          }],
          "quotes": ["Relevant LDS quote"],
          "links": ["Optional URL"]
        }
      ],
      "summary": "Brief summary (1-2 sentences)",
      "questions": ["1-2 engaging introductory questions"],
      "quotes": ["Additional relevant LDS quotes"]
    },
    {
      "title": "First Key Teaching Section",
      "story": "Brief narrative example (100-200 words), including historical context if applicable.",
      "historicalContext": "Optional historical context (1-2 sentences)",
      "relatableHymns": [{
        "title": "Relevant Hymn Title",
        "number": "Hymn number",
        "link": "URL to hymn"
      }],
      "subpoints": [
        {
          "text": "Clearly stated doctrinal point",
          "explanation": "Detailed doctrinal explanation",
          "scriptures": [{"verse": "Scripture verse", "link": "URL"}],
          "quotes": ["Relevant LDS quote"]
        },
        {
          "text": "Another clearly stated doctrinal point",
          "explanation": "Detailed doctrinal explanation",
          "scriptures": [{"verse": "Scripture verse", "link": "URL"}],
          "quotes": ["Relevant LDS quote"]
        }
      ],
      "summary": "Brief summary (1-2 sentences)",
      "questions": ["2 thoughtful discussion questions"]
    },
    {
      "title": "Second Key Teaching Section",
      "story": "Brief narrative example (100-200 words), including historical context if applicable.",
      "historicalContext": "Optional historical context (1-2 sentences)",
      "relatableHymns": [{
        "title": "Relevant Hymn Title",
        "number": "Hymn number",
        "link": "URL to hymn"
      }],
      "subpoints": [
        {
          "text": "Clearly stated doctrinal point",
          "explanation": "Detailed doctrinal explanation",
          "scriptures": [{"verse": "Scripture verse", "link": "URL"}],
          "quotes": ["Relevant LDS quote"]
        }
      ],
      "summary": "Brief summary (1-2 sentences)",
      "questions": ["2 thoughtful discussion questions"]
    },
    {
      "title": "Third Key Teaching Section",
      "story": "Brief narrative example (100-200 words), including historical context if applicable.",
      "historicalContext": "Optional historical context (1-2 sentences)",
      "relatableHymns": [{
        "title": "Relevant Hymn Title",
        "number": "Hymn number",
        "link": "URL to hymn"
      }],
      "subpoints": [
        {
          "text": "Clearly stated doctrinal point",
          "explanation": "Detailed doctrinal explanation",
          "scriptures": [{"verse": "Scripture verse", "link": "URL"}],
          "quotes": ["Relevant LDS quote"]
        }
      ],
      "summary": "Brief summary (1-2 sentences)",
      "questions": ["2 thoughtful discussion questions"]
    },
    {
      "title": "Conclusion",
      "story": "Brief concluding narrative (100-150 words)",
      "historicalContext": "Optional concluding historical context (1-2 sentences)",
      "relatableHymns": [{
        "title": "Closing Hymn Title",
        "number": "Hymn number",
        "link": "URL to hymn"
      }],
      "subpoints": [],
      "summary": "Encapsulate key lessons clearly and briefly",
      "questions": ["Final reflective question"],
      "quotes": ["Closing inspirational quote"]
    }
  ]
}

Guidelines:
- Clearly align each historical context to enhance the understanding of each story.
- Provide exact hymn titles, numbers, and URLs from churchofjesuschrist.org relevant to each lesson point.
- Each doctrinal subpoint must include scriptures and quotes sourced directly from official LDS teachings.
- Include thoughtful, engaging questions suitable for group discussion in an adult LDS Sunday School class.

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
