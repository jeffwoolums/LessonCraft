
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors());
app.use(bodyParser.json());

app.post("/generate", async (req, res) => {
  const { topic, scriptureSources = [], storySources = [] } = req.body;

  try {
    // Dynamically build the prompt based on the selected sources
    let prompt = `Create a detailed LDS lesson plan about "${topic}". 
    Use these scripture sources: ${scriptureSources.join(", ")}, 
    and include a story from: ${storySources.join(", ")}.
    Format the output with title, summary, subpoints, and quotes with citations.`;

    // For now, mock the result or load from a test JSON
    const responseJSON = fs.readFileSync("./lessons/sample_lesson.json", "utf8");
    const lesson = JSON.parse(responseJSON);

    res.status(200).json(lesson);
  } catch (err) {
    console.error("❌ Error in /generate:", err);
    res.status(500).send("Something went wrong generating lesson");
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});