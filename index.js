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
  Structure the lesson in JSON format exactly as shown below. The lesson duration should be ${duration_minutes} minutes.

  {
    "title": "${topic}",
    "lessonPoints": [
      {
        "title": "Introduction",
        "story": "Provide a rich, detailed introductory narrative (350-450 words) clearly illustrating the significance of the topic through an engaging story from official LDS publications or documented Church history.",
        "historicalContext": "Provide substantial historical background, including specific events, dates, locations, and key figures directly connected to the lesson topic. Ensure this context is accurate and informative.",
        "relatableHymns": [{
          "title": "Relevant Hymn",
          "number": "Hymn number",
          "link": "URL to hymn"
        }],
        "subpoints": [{
          "text": "Clear introductory doctrinal point",
          "explanation": "Provide a thorough, in-depth doctrinal explanation with scriptural support.",
          "scriptures": [
            ${Array(scriptures_per_slide).fill('{"verse": "Complete verse text", "link": "Direct URL to verse"}').join(",\n")}
          ],
          ${include_quotes ? `"quotes": ["Relevant and inspirational quote from LDS Church leaders or publications."],` : ""}
          "links": ["URL to further resources or church materials if applicable"]
        }],
        "questions": ["Thought-provoking and practical opening discussion question"],
        "summary": "Detailed and practical summary (3-4 sentences highlighting key takeaways clearly)"
      },
      {
        "title": "First Parable or Key Teaching",
        "story": "Provide a detailed, illustrative parable or example (250-350 words) with clear spiritual or doctrinal lessons.",
        "historicalContext": "Detailed historical background or context for this teaching, including specific references if available.",
        "relatableHymns": [{
          "title": "Relevant Hymn",
          "number": "Hymn number",
          "link": "URL"
        }],
        "subpoints": [
          ${Array(points_per_slide).fill(`{
            "text": "Clear doctrinal or practical point",
            "explanation": "Detailed and insightful explanation with clear daily life application and scriptural support.",
            "scriptures": [
              ${Array(scriptures_per_slide).fill('{"verse": "Complete verse text", "link": "URL"}').join(",\n")}
            ],
            ${include_quotes ? `"quotes": ["Relevant LDS quote"]` : ""}
          }`).join(",\n")}
        ],
        "questions": ["Two to three engaging, application-based questions"],
        "summary": "Detailed summary with practical applications clearly articulated"
      },
      {
        "title": "Second Parable or Key Teaching",
        "story": "Provide another richly detailed parable or historical example (250-350 words).",
        "historicalContext": "Relevant historical insights, including dates or individuals involved.",
        "relatableHymns": [{"title": "Relevant Hymn", "number": "number", "link": "URL"}],
        "subpoints": [
          ${Array(points_per_slide).fill(`{
            "text": "Detailed doctrinal teaching",
            "explanation": "Clear doctrinal insights and practical applications with scriptural backing.",
            "scriptures": [
              ${Array(scriptures_per_slide).fill('{"verse": "Complete verse text", "link": "URL"}').join(",\n")}
            ],
            ${include_quotes ? `"quotes": ["Inspirational LDS quote"]` : ""}
          }`).join(",\n")}
        ],
        "questions": ["Engaging discussion questions"],
        "summary": "Well-articulated and practical summary"
      },
      {
        "title": "Third Parable or Key Teaching",
        "story": "Additional clear, detailed example or historical narrative (250-350 words).",
        "historicalContext": "Rich historical context clearly linking the story to LDS Church history or scriptures.",
        "relatableHymns": [{"title": "Relevant Hymn", "number": "number", "link": "URL"}],
        "subpoints": [
          ${Array(points_per_slide).fill(`{
            "text": "Key doctrinal point clearly articulated",
            "explanation": "Clear doctrinal and practical application.",
            "scriptures": [
              ${Array(scriptures_per_slide).fill('{"verse": "Complete verse text", "link": "URL"}').join(",\n")}
            ],
            ${include_quotes ? `"quotes": ["Relevant inspirational LDS quote"]` : ""}
          }`).join(",\n")}
        ],
        "questions": ["Discussion-inviting questions"],
        "summary": "Detailed and practical summary clearly encapsulating the section’s teaching"
      },
      {
        "title": "Conclusion",
        "story": "Concise and inspiring closing narrative (150-200 words) summarizing the key messages and reinforcing practical applications.",
        "historicalContext": "Optional relevant historical wrap-up",
        "relatableHymns": [{"title": "Closing Hymn", "number": "number", "link": "URL"}],
        "questions": ["One final reflective and practical question for the group"],
        ${include_quotes ? `"quotes": ["Inspirational and motivating LDS quote"],` : ""}
        "summary": "Clearly encapsulate the lesson’s core teachings and practical takeaways"
      }
    ]
  }

  Important guidelines for generation:
  - Include detailed historical contexts (dates, locations, individuals, and events).
  - Provide rich, insightful summaries clearly focused on practical application.
  - Ensure each parable or key teaching is thoroughly explained with clear doctrinal and practical insights.
  - Include multiple scriptures, relevant hymns, meaningful LDS quotes, and thoughtful discussion questions appropriate for adults.

  Respond strictly with valid JSON. No markdown, explanations, or additional commentary.
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
