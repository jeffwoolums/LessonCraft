const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai").OpenAI;
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/generate", async (req, res) => {
  const { topic, scriptureSources = [], storySources = [] } = req.body;

  const prompt = `
    Create a JSON array where each object represents one slide for a 55-minute LDS lesson titled "${topic}". 
    Each slide object must contain:
    - "title": String
    - "subpoints": Array of objects. Each object must include:
        - "text": The main point (1 sentence)
        - "explanation": A doctrinal definition or explanation from an LDS perspective
        - "scripture": A relevant scripture quote (include full text)
        - "link": A URL to the scripture on churchofjesuschrist.org
    - "summary": Optional short summary (1-2 sentences)
    - "quotes": Optional relevant quotes (Array of strings)
    - "story": Optional in-depth paragraph that includes a vivid narrative, scripture example, general conference quote, or real-life LDS story related to the topic.

    Scripture sources: ${scriptureSources.join(", ")}.
    Story sources: ${storySources.join(", ")}.

    Ensure slides include vivid stories, doctrinal insights, and real-life applications. 
    Respond ONLY with valid JSON, without markdown or other text.
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: "json",
      messages: [
        {
          role: "system",
          content: "You are a JSON generator. Respond ONLY with valid JSON. Do not include explanations, markdown formatting, or any surrounding text."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });

    // Remove all occurrences of ```json and ``` anywhere in the response
    let responseText = completion.choices[0].message.content.trim();
    console.log("🧾 Raw OpenAI Response:\n", responseText);
    responseText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = responseText.match(/\[\s*{[\s\S]*?}\s*]/);
    if (jsonMatch) {
      responseText = jsonMatch[0].trim();
    } else {
      console.error("❌ No valid JSON array found in response.");
    }
    try {
      const slides = JSON.parse(responseText);
      res.status(200).json(slides);
    } catch (parseErr) {
      console.error("❌ Failed to parse OpenAI response as JSON:", responseText);
      console.error("❌ Parse error:", parseErr.message);
      res.status(500).send("OpenAI response was not valid JSON.");
    }
  } catch (err) {
    console.error("❌ Error:", err.message || err);
    res.status(500).send("Something went wrong generating lesson");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
