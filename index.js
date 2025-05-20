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
First, provide a detailed, engaging introductory story of at least 300 words sourced from official LDS publications (General Conference talks, Ensign articles, Church history, scriptures). The story should prominently feature relatable historical figures (e.g., Joseph Smith, Brigham Young, pioneers) or contemporary individuals from church articles. Clearly describe their personal challenges, struggles, or pivotal life events. Include specific doctrinal principles and scriptures that directly connect emotionally and doctrinally to the lesson topic: "${topic}". End the introduction by explicitly stating how this story sets up the key themes of the lesson.

Next, create a JSON array representing each slide for a 55-minute lesson. Each slide must build logically from the introductory story and follow this structure exactly:

- "title": String
- "subpoints": Array of objects containing:
    - "text": String (main point clearly stated in one sentence)
    - "explanation": Optional deeper doctrinal explanation or definition
    - "scripture": Optional scripture (include the full scripture text)
    - "link": Optional URL linking to the scripture at churchofjesuschrist.org
- "summary": Optional brief recap (1-2 sentences)
- "quotes": Optional array of relevant LDS quotes
- "story": Optional in-depth narrative or illustrative example connected to the slide’s key points

Sources: ${scriptureSources.join(", ")}, ${storySources.join(", ")}.

Respond ONLY with valid JSON. No markdown or commentary.
`;

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
