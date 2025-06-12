const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const buildPrompt = require("./prompts/PromptBuilder");
const callOpenAI = require("./services/OpenAIService");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/generate", async (req, res) => {
  try {
    const request = req.body;
    const prompt = buildPrompt(request);
    const lesson = await callOpenAI(prompt);
    res.status(200).json(lesson);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
