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

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

app.post("/generate", async (req, res) => {
  const { topic, scriptureSources = [], storySources = [] } = req.body;

  const prompt = `
    Create a JSON array where each object represents one slide for a 55-minute LDS lesson titled "${topic}". 
    Each slide object must exactly match this structure:
    - "title": String
    - "subpoints": Array of objects exactly matching this format:
        - "text": String (main discussion point, 1 sentence)
        - "explanation": Optional String (doctrinal explanation or definition)
        - "scripture": Optional String (relevant scripture quote, include full text)
        - "link": Optional String (URL to scripture on churchofjesuschrist.org)
    - "summary": Optional short summary (1-2 sentences, String or null)
    - "quotes": Optional relevant quotes (Array of strings or empty array)
    - "story": Optional in-depth paragraph or null

    Respond ONLY with valid JSON array matching exactly the described structure, without markdown, commentary, or any other text.
    Scripture sources: ${scriptureSources.join(", ")}.
    Story sources: ${storySources.join(", ")}.

    Ensure slides include vivid stories, doctrinal insights, and real-life applications. 
    Respond ONLY with valid JSON, without markdown or other text.
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
      res.status(200).json(slides);
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
