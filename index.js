// index.js (Revised)
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { OpenAI } = require("openai");
require('dotenv').config(); // Ensure this is at the top to load .env variables

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
    scriptures_per_slide = 2, // Default if not provided by client
    include_quotes = true,     // Default if not provided by client
    audience = "Adult Sunday School Class", // Default if not provided
    tone = "Inspirational",      // Default if not provided
    duration_minutes = 45,     // Default if not provided
    content_sources = []       // Default to empty array if not provided
    // speaker, source, points_per_slide, questions_per_slide, introWordCount
    // are received but not used in the prompt below, so removed them for clarity
  } = req.body;

  // Dynamically build the source constraint for the AI prompt
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
        case "Gospel Library (Manuals, Study Guides)": return "Gospel Library manuals and study guides (e.g., Teachings of Presidents of the Church)";
        case "Jesus the Christ by James Talmage": return "the book 'Jesus the Christ' by James Talmage, focusing on its historical and doctrinal insights";
        case "Articles of Faith by James Talmage": return "the book 'Articles of Faith' by James Talmage, especially its foundational doctrinal explanations";
        case "Youth Come, Follow Me": return "Come, Follow Me manuals for Youth";
        case "Adult Come, Follow Me": return "Come, Follow Me manuals for Adults";
        // Default for standard works, General Conference, etc. (No change needed for these in switch)
        default: return source;
      }
    });
    sourceConstraint = `Strictly draw content, quotes, and scriptures from the following authoritative LDS sources available on ChurchofJesusChrist.org: ${specificSources.join(", ")}.`;
  } else {
    sourceConstraint = `Draw content from authoritative LDS sources available on ChurchofJesusChrist.org.`; // Default if no sources selected
  }

  // Determine if quotes and scriptures should be included based on client parameters
  const quoteInstruction = include_quotes ? `Include relevant quotes from these sources.` : `Do NOT include quotes.`;
  const scriptureInstruction = scriptures_per_slide > 0 ? `Include approximately ${scriptures_per_slide} scripture references per lesson point.` : `Do NOT include scripture references.`;


  // Construct the prompt for OpenAI
  const prompt = `
Create an engaging, historically accurate LDS Sunday School lesson titled "${topic}".

Target audience: ${audience}. Tone: ${tone}. Expected duration: ${duration_minutes} minutes.
${sourceConstraint}
${quoteInstruction}
${scriptureInstruction}

For historical context, include fascinating details about the time period surrounding the scriptures or events discussed, such as contemporary Roman life during Christ's ministry, or broader societal happenings during the early Church (e.g., 1830s). Think "Did you know XYNZ was happening at this time?" to enrich the content.

For each lesson point, provide a relevant 'artworkURL' from media.churchofjesuschrist.org. If no direct image matches, provide a URL to a general, relevant image from the site. Ensure the URL is directly to an image asset (e.g., ending in .jpg, .png).

Structure the lesson PRECISELY in the JSON format below. DO NOT include any "id" fields at any level. Ensure all fields are present, even if empty arrays or nulls:

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
      "quotes": [{"text": "", "author": "", "source": "", "link": ""}], // Updated: Ensure full Quote object
      "artworkURL": "", // Added: Ensure artworkURL is present
      "subpoints": [
        {
          "text": "First key teaching or parable",
          "explanation": "Explanation and application to modern life.",
          "scriptures": [{"verse": "", "reference": "", "link": ""}],
          "quotes": [{"text": "", "author": "", "source": "", "link": ""}], // Updated: Ensure full Quote object
          "links": []
        }
      ],
      "questions": ["Discussion question related to the point"],
      "layoutSettings": {} // Simplified: No specific values unless needed for Swift UI logic
    }
  ]
}

CRITICAL INSTRUCTIONS FOR AI:
- The lesson should be engaging and flow logically.
- The introduction should be a concise summary of the overall lesson.
- Each major "lessonPoint" should cover a distinct aspect of the topic.
- EVERY scripture MUST have "verse", "reference", and "link" fields explicitly included. Generate the 'link' to churchofjesuschrist.org for each scripture.
- EVERY quote MUST be an object with "text", "author", "source", and an optional "link" fields explicitly included. For the 'source', provide the specific talk title, magazine issue, or book title.
- EVERY hymn MUST have "title", "number", and "link" fields explicitly included. Generate the 'link' to churchofjesuschrist.org for each hymn.
- Every section must fully comply with this JSON structure without omissions.
- Ensure 'artworkURL' is a valid URL to media.churchofjesuschrist.org or an empty string.

Respond ONLY with valid JSON (no markdown or extra explanation).
`;

  try {
    // Call OpenAI for completion
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        { role: "system", content: "Respond ONLY with valid JSON. Strictly no markdown, no explanations. Provide accurate LDS content from specified sources." },
        { role: "user", content: prompt }
      ],
      temperature: 0.7, // Moderate creativity for factual content
    });

    let responseText = completion.choices[0].message.content.trim();
    // Remove accidental markdown fences if present
    responseText = responseText.replace(/^```json|^```|```$/g, '').trim();

    const lesson = JSON.parse(responseText);
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.status(200).send(JSON.stringify(lesson));
  } catch (err) {
    console.error("❌ OpenAI/JSON Error:", err.message);
    res.status(500).json({ error: `AI Generation Failed: ${err.message}` });
  }
});

// Add your /enrich endpoint here if you have one, or move it from previous versions
// if it's currently missing from your on-hand index.js.
// For example:
/*
app.post("/enrich", async (req, res) => {
    const { text, topic, action } = req.body;

    let enrichmentPrompt = "";
    switch (action) {
        case "expand_summary":
            enrichmentPrompt = `Expand on the following text to provide a more detailed explanation or additional insights, suitable for an LDS lesson about "${topic}": "${text}". Respond ONLY with the enriched text.`;
            break;
        case "add_scripture":
            enrichmentPrompt = `Based on this text from an LDS lesson: "${text}", suggest ONE highly relevant scripture reference from the LDS standard works (e.g., "Moses 1:39", "D&C 121:7-8"). Provide ONLY the scripture reference (e.g., "John 3:16").`;
            break;
        case "add_historical_context":
            enrichmentPrompt = `Based on this lesson point: "${text}" related to the topic of "${topic}", provide a brief, interesting historical context related to the scriptures or events discussed. Focus on "Did you know that XYNZ was happening at this time?" type of information. Respond ONLY with the historical context.`;
            break;
        case "add_quote":
            enrichmentPrompt = `Based on this text from an LDS lesson: "${text}" about "${topic}", suggest ONE relevant quote from an LDS General Authority (past or present). Provide ONLY the quote text and author in the format: "Quote Text" - Author.`;
            break;
        default:
            return res.status(400).json({ error: "Invalid enrichment action." });
    }

    try {
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
                { role: "system", content: "You are an assistant that provides focused, concise, LDS-centric content enrichment. Your response should be direct text for the requested action, without conversational filler." },
                { role: "user", content: enrichmentPrompt }
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
*/

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
