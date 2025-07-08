const express = require('express');
const bodyParser = require('body-parser');
const { callOpenAI } = require('../OpenAIServices');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

// Main lesson generation route
app.post('/generate', async (req, res) => {
    try {
        const requestBody = req.body;

        // Build dynamic system prompt based on iOS payload
        const systemPrompt = buildSystemPrompt(requestBody);

        // Call OpenAI via hardened service
        const aiResponse = await callOpenAI(systemPrompt);

        if (!aiResponse || !aiResponse.choices || !aiResponse.choices[0].message.content) {
            return res.status(500).json({ error: "AI response missing content" });
        }

        const rawJSON = aiResponse.choices[0].message.content;

        // Validate returned JSON before sending to client
        let lessonObject = {};
        try {
            lessonObject = JSON.parse(rawJSON);
        } catch (e) {
            return res.status(500).json({ error: "Invalid JSON from AI" });
        }

        res.json(lessonObject);
    } catch (err) {
        console.error("Server error:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

// Hardened production-grade system prompt builder
function buildSystemPrompt(requestBody) {
    const {
        topic = 'Untitled Topic',
        scriptures_per_slide = 2,
        include_quotes = true,
        audience = 'General Audience',
        tone = 'Neutral',
        duration_minutes = 30,
        content_sources = []
    } = requestBody;

    return `
You are LessonCraft AI, a highly strict Christian lesson generator.
Your job: generate a valid lesson JSON object for the iOS app.

⚠ VERY IMPORTANT RULES:
- Output must be valid JSON.
- DO NOT include markdown, comments, explanations or any non-JSON text.
- Output must directly match the following Swift Codable structure.
- Use correct field names, types, and slide types as described below.

STRUCTURE:

{
  "title": "string",
  "settings": {
    "maxParableSlides": int (optional),
    "maxPointsPerSlide": int (optional),
    "maxScripturesPerSlide": int (optional),
    "maxQuotesPerSlide": int (optional),
    "maxArtworksPerSlide": int (optional),
    "maxHymnsPerSlide": int (optional),
    "maxQuestionsPerSlide": int (optional)
  },
  "slides": [
    {
      "type": "introduction",
      "title": "string",
      "introductionText": "string",
      "parablesOrTopicsCovered": [ "string" ]
    },
    {
      "type": "parable",
      "title": "string",
      "description": "string",
      "historicalContext": "string",
      "scriptures": [{ "verse": "string", "reference": "string", "link": "string" }],
      "quotes": [{ "text": "string", "author": "string", "source": "string", "link": "string (optional)" }],
      "thoughtProvokingQuestions": [ "string" ],
      "artwork": [{ "title": "string", "url": "string" }],
      "hymns": [{ "title": "string", "number": "string", "link": "string" }],
      "mediaPresentation": { "mediaType": "string", "url": "string", "overlayQuote": "string" }
    },
    {
      "type": "closeout",
      "title": "string",
      "summary": "string",
      "topicsCovered": [ "string" ],
      "scripturesCovered": [{ "verse": "string", "reference": "string", "link": "string" }],
      "mainPoints": [ "string" ]
    },
    {
      "type": "teacherInstructions",
      "title": "string",
      "materialsNeeded": [ "string" ],
      "preparationAdvice": [ "string" ],
      "engagementTips": [ "string" ]
    }
  ]
}

Lesson generation parameters:
- Topic: ${topic}
- Audience: ${audience}
- Tone: ${tone}
- Duration: ${duration_minutes} minutes
- Scriptures per Slide: ${scriptures_per_slide}
- Include Quotes: ${include_quotes}
- Content Sources: ${content_sources.join(', ')}
    `.trim();
}

app.listen(port, () => {
    console.log(`LessonCraft AI Proxy running on port ${port}`);
});
