// index.js (V4.0 - King of the Hill)

const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

// OpenAI client
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Helper: Build the AI prompt dynamically based on client request
 */
function buildPrompt(request) {
  const {
    topic,
    audience = "Adult Sunday School",
    tone = "Inspirational",
    duration_minutes = 45,
    lessonSource = "FreeTopic", // FreeTopic, ComeFollowMe, ConferenceTalk, URL, etc.
    comeFollowMeURL = null,
    conferenceTalkURL = null,
    content_sources = [],
  } = request;

  // Map LDS sources into OpenAI-readable format
  const specificSources = content_sources.map((source) => {
    switch (source) {
      case "ComeFollowMe":
        return "Come Follow Me study materials";
      case "ConferenceTalks":
        return "General Conference Talks";
      case "Liahona":
        return "Liahona Magazine";
      case "Friend":
        return "Friend Magazine";
      case "ForStrengthOfYouth":
        return "For the Strength of Youth Magazine";
      case "PreachMyGospel":
        return "Preach My Gospel Manual";
      case "ChurchHistory":
        return "Church History topics and Saints volumes";
      case "JesusTheChrist":
        return "Jesus the Christ by James E. Talmage";
      case "GospelTopics":
        return "Gospel Topics Essays";
      case "Hymns":
        return "The official Hymns of the Church (1985 edition)";
      case "Scriptures":
        return "The Standard Works (Bible, Book of Mormon, Doctrine and Covenants, Pearl of Great Price)";
      default:
        return source;
    }
  });

  let sourceConstraint = `Use official LDS sources available at ChurchofJesusChrist.org, including ${specificSources.join(", ")}.`;

  if (lessonSource === "ComeFollowMe" && comeFollowMeURL) {
    sourceConstraint += ` This lesson should follow the content at: ${comeFollowMeURL}`;
  }

  if (lessonSource === "ConferenceTalk" && conferenceTalkURL) {
    sourceConstraint += ` This lesson should follow the content at: ${conferenceTalkURL}`;
  }

  const prompt = `
You are building a highly detailed, structured LDS teaching lesson.

TOPIC: ${topic}
AUDIENCE: ${audience}
TONE: ${tone}
DURATION: ${duration_minutes} minutes

${sourceConstraint}

VERY IMPORTANT STRUCTURE INSTRUCTIONS:

- Build the lesson as a JSON object with a "slides" array.
- The first slide is always the INTRODUCTION with a rich 400-500 word introduction story.
- Followed by multiple PARABLE slides (typically 2-5), each with:
  - Title
  - Description (4-5 full sentences)
  - Historical Context
  - Scriptures (each with verse, reference, link)
  - Quotes (each with text, author, source, link)
  - Thought Provoking Questions (3-5 questions)
  - Hymns (title, number, link)
  - Artwork (title, url)
  - MediaPresentation (mediaType, url, overlayQuote)
- Include a CLOSEOUT slide that summarizes the full lesson.
- Include a TEACHER INSTRUCTIONS slide with:
  - MaterialsNeeded (physical materials to bring)
  - PreparationAdvice (spiritual preparation for teacher)
  - EngagementTips (how to facilitate the class)

- Use real data from ChurchofJesusChrist.org where possible.
- Every scripture link must link directly to ChurchofJesusChrist.org.
- Every hymn link must link directly to ChurchofJesusChrist.org/music.
- Every quote must include author, source, and link.

Respond ONLY with valid JSON. DO NOT include markdown or explanations.

JSON STRUCTURE:
{
  "slides": [
    {
      "type": "introduction",
      "title": "string",
      "introductionText": "string (400-500 word introduction)",
      "parablesOrTopicsCovered": ["string", "string"]
    },
    {
      "type": "parable",
      "title": "string",
      "description": "string",
      "historicalContext": "string",
      "scriptures": [{ "verse": "string", "reference": "string", "link": "string" }],
      "quotes": [{ "text": "string", "author": "string", "source": "string", "link": "string" }],
      "thoughtProvokingQuestions": ["string"],
      "artwork": [{ "title": "string", "url": "string" }],
      "hymns": [{ "title": "string", "number": "string", "link": "string" }],
      "mediaPresentation": { "mediaType": "string", "url": "string", "overlayQuote": "string" }
    },
    {
      "type": "closeout",
      "title": "string",
      "summary": "string",
      "topicsCovered": ["string"],
      "scripturesCovered": [{ "reference": "string", "link": "string" }],
      "mainPoints": ["string"]
    },
    {
      "type": "teacherInstructions",
      "title": "string",
      "materialsNeeded": ["string"],
      "preparationAdvice": ["string"],
      "engagementTips": ["string"]
    }
  ]
}
`;

  return prompt;
}

/**
 * Generate Lesson Route (MAIN AI FUNCTION)
 */
app.post("/generate", async (req, res) => {
  const prompt = buildPrompt(req.body);

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are an expert LDS lesson generator. Output ONLY valid JSON.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
    });

    let responseText = completion.choices[0].message.content.trim();
    responseText = responseText.replace(/^```json|^```|```$/g, "").trim();

    const lesson = JSON.parse(responseText);
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.status(200).send(JSON.stringify(lesson));
  } catch (err) {
    console.error("❌ OpenAI/JSON Error:", err.message);
    res.status(500).json({ error: `AI Generation Failed: ${err.message}` });
  }
});

app.listen(PORT, () => {
  console.log(`✅ King of the Hill v4.0 Server running at http://localhost:${PORT}`);
});
