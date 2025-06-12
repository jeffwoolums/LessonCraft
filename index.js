const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const { OpenAI } = require("openai");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// Health endpoint
app.get("/health", (req, res) => {
  res.send("🩺 Server is alive.");
});

// Load prompts from /prompts folder
function loadPrompt(name) {
  return fs.readFileSync(`./prompts/${name}.json`, "utf-8");
}

// Main lesson generator
app.post("/generate", async (req, res) => {
  const {
    apiKey,
    topic,
    audience = "Adult Sunday School Class",
    tone = "Inspirational",
    duration_minutes = 45,
    content_sources = []
  } = req.body;

  if (!apiKey) {
    return res.status(400).json({ error: "Missing API Key." });
  }

  const openai = new OpenAI({ apiKey });

  // Custom sources string
  let sourceConstraint = "";
  if (content_sources.length > 0) {
    const specificSources = content_sources.map(source => {
      switch (source) {
        case "Ensign/Liahona (Church Magazines)": return "articles from the Ensign and Liahona magazines";
        case "Friend Magazine (Children)": return "articles from the Friend magazine";
        case "For the Strength of Youth Magazine": return "content from the For The Strength of Youth magazine";
        case "Hymns (1985 Hymnbook)": return "the 1985 Hymnbook";
        case "Children's Songbook": return "the Children's Songbook";
        case "General Sacred Music (Other LDS.org Music)": return "other official sacred music on ChurchofJesusChrist.org/music";
        case "Church History (Saints, Gospel Topics Essays)": return "Church History (Saints series, Gospel Topics Essays, Church History topics)";
        case "Gospel Library (Manuals, Study Guides)": return "Gospel Library manuals and study guides";
        case "Jesus the Christ by James Talmage": return "the book 'Jesus the Christ' by James Talmage";
        case "Articles of Faith by James Talmage": return "the book 'Articles of Faith' by James Talmage";
        case "Youth Come, Follow Me": return "Come, Follow Me manuals for Youth";
        case "Adult Come, Follow Me": return "Come, Follow Me manuals for Adults";
        default: return source;
      }
    });
    sourceConstraint = `Strictly draw content from: ${specificSources.join(", ")}.`;
  } else {
    sourceConstraint = `Draw content from authoritative LDS sources available on ChurchofJesusChrist.org.`;
  }

  // Load the lesson prompt template and fill placeholders
  let lessonPrompt = loadPrompt("lesson");
  lessonPrompt = lessonPrompt
    .replace(/{{topic}}/g, topic)
    .replace(/{{audience}}/g, audience)
    .replace(/{{tone}}/g, tone)
    .replace(/{{duration_minutes}}/g, duration_minutes)
    .replace(/{{sourceConstraint}}/g, sourceConstraint);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Respond ONLY with valid JSON." },
        { role: "user", content: lessonPrompt }
      ],
      temperature: 0.7
    });

    let responseText = completion.choices[0].message.content.trim();
    responseText = responseText.replace(/^```json|^```|```$/g, '').trim();

    const lesson = JSON.parse(responseText);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify(lesson));
  } catch (err) {
    console.error("❌ OpenAI Error:", err.message);
    res.status(500).json({ error: `AI Generation Failed: ${err.message}` });
  }
});

// Enrichment endpoint
app.post("/enrich", async (req, res) => {
  const { apiKey, text, topic, action } = req.body;
  if (!apiKey) return res.status(400).json({ error: "Missing API Key." });

  let promptName;
  switch (action) {
    case "expand_summary":
      promptName = "enrich_expand";
      break;
    case "add_scripture":
      promptName = "enrich_scripture";
      break;
    case "add_historical_context":
      promptName = "enrich_context";
      break;
    case "add_quote":
      promptName = "enrich_quote";
      break;
    default:
      return res.status(400).json({ error: "Invalid enrichment action." });
  }

  let prompt = loadPrompt(promptName);
  prompt = prompt
    .replace(/{{text}}/g, text)
    .replace(/{{topic}}/g, topic || "");

  try {
    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "You are an assistant that provides focused, concise, LDS-centric content enrichment. Your response should be direct text for the requested action, without conversational filler." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 500
    });

    let enrichedContent = completion.choices[0].message.content.trim();
    res.status(200).json({ enrichedText: enrichedContent });
  } catch (err) {
    console.error("❌ OpenAI/Enrichment Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
