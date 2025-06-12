const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
const { buildLessonPrompt } = require("./prompts/generateLessonPrompt");
const { buildEnrichmentPrompt } = require("./prompts/enrichPrompts");
const { cleanAIResponse } = require("./prompts/utils");
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// Healthcheck
app.get("/health", (req, res) => {
  res.send("🟢 Server is alive and kicking.");
});

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Generate Lesson Endpoint
app.post("/generate", async (req, res) => {
  const {
    topic,
    audience,
    tone,
    duration_minutes,
    lessonSource,
    comeFollowMeURL,
    conferenceTalkURL,
    content_sources
  } = req.body;

  const prompt = buildLessonPrompt({
    topic,
    audience,
    tone,
    duration_minutes,
    lessonSource,
    comeFollowMeURL,
    conferenceTalkURL,
    content_sources
  });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Respond ONLY with valid JSON. No markdown, no explanations." },
        { role: "user", content: prompt }
      ],
      temperature: 0.6
    });

    let responseText = completion.choices[0].message.content.trim();
    responseText = cleanAIResponse(responseText);
    const lesson = JSON.parse(responseText);

    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify(lesson));
  } catch (err) {
    console.error("AI Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// Enrichment Endpoint
app.post("/enrich", async (req, res) => {
  const { text, topic, action } = req.body;
  const enrichmentPrompt = buildEnrichmentPrompt({ text, topic, action });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Only output the enriched text. No explanation." },
        { role: "user", content: enrichmentPrompt }
      ],
      temperature: 0.7,
      max_tokens: 800
    });

    const enrichedText = completion.choices[0].message.content.trim();
    res.status(200).json({ enrichedText });
  } catch (err) {
    console.error("Enrichment Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ LessonCraft AI Server running at http://localhost:${PORT}`);
});
