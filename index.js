const express = require("express");

// Ensure no duplicate express declarations
// Removed duplicate express declaration that caused SyntaxError
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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/generate", async (req, res) => {
  const { topic, scriptureSources = [], storySources = [] } = req.body;

  const prompt = `
First, provide a detailed, engaging introductory story sourced from official LDS publications (General Conference talks, Ensign articles, Church history, or scriptures). The story should include clear context, relatable characters or historical figures (such as Joseph Smith), specific trials or challenges they faced, and how their experiences directly relate emotionally and doctrinally to the lesson titled "${topic}". This introduction should clearly connect emotionally and doctrinally to the main lesson topic.

Next, create a JSON array representing each slide for the 55-minute lesson. Each slide should build logically from the introduction, and must follow this exact structure:

- "title": String
- "subpoints": Array of objects containing:
    - "text": String (clear and concise main point)
    - "explanation": Optional deeper doctrinal context or definition
    - "scripture": Optional full scripture text if relevant
    - "link": Optional URL linking directly to scripture on churchofjesuschrist.org
- "summary": Optional brief recap (1-2 sentences)
- "quotes": Optional array of relevant quotes from LDS sources
- "story": Optional story or narrative example that expands on the slide’s key points

Sources: ${scriptureSources.join(", ")}, ${storySources.join(", ")}.

Respond ONLY with valid JSON, with no markdown or commentary.

Slides must include vivid stories, doctrinal insights, real-life applications, and clear connections back to the introductory story.
  `;

  try {
    console.log("⚙️ Sending request to OpenAI...");
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a JSON generator. Respond ONLY with valid JSON. Do not include explanations, markdown formatting, or any surrounding text."
        },
        { role: "user", content: prompt }
      ],
      temperature: 0.7,
    });
    console.log("📬 Received response from OpenAI. Raw object:");
    console.log(JSON.stringify(completion, null, 2));

    if (!completion.choices[0]?.message?.content) {
      console.error("❌ Missing message content in OpenAI response.");
    }

    // Remove all occurrences of ```json and ``` anywhere in the response
    let responseText = completion.choices[0].message.content.trim();
    console.log("🧾 Raw OpenAI Response:\n", responseText);
    responseText = responseText
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      responseText = jsonMatch[0].trim();
    } else {
      console.error("❌ No valid JSON array found in response.");
    }
    // Fix OpenAI's accidental double quotes at the start of scripture fields
    responseText = responseText.replace(/"scripture":"\"/g, '"scripture":"');
    try {
      const slides = JSON.parse(responseText);
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.status(200).send(JSON.stringify(slides));

    } catch (parseErr) {
        console.error("❌ Failed to parse OpenAI response as JSON:", responseText);
        console.error("❌ Parse error:", parseErr.message);
        // For debugging: send back raw response and error
        res.status(200).json({ raw: responseText, error: parseErr.message });
      }
  } catch (err) {
    console.error("❌ Error occurred while calling OpenAI:", err);
    res.status(500).send("OpenAI request failed or timed out.");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
