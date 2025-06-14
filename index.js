const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const buildPrompt = require('./Prompts/PromptBuilder');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

// OpenAI API setup
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.post('/generate', async (req, res) => {
    try {
        const userRequest = req.body;

        console.log("Received lesson generation request");

        const systemPrompt = buildPrompt(userRequest);

        const aiResponse = await axios.post(
            OPENAI_API_URL,
            {
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: 'Generate the lesson JSON.' }
                ],
                temperature: 0.0,
                top_p: 1.0,
                presence_penalty: 0.0,
                frequency_penalty: 0.0,
                response_format: "json"
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        const rawJSON = aiResponse.data.choices[0].message.content;
        const lessonObject = JSON.parse(rawJSON);

        if (!lessonObject.title || !lessonObject.slides) {
            console.error("Missing required fields in response");
            return res.status(500).json({ error: "Missing required fields in AI response." });
        }

        console.log("Lesson successfully generated.");
        res.json(lessonObject);
    } catch (err) {
        console.error("Error during lesson generation:", err);
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port, () => {
    console.log(`LessonCraft AI Proxy running on port ${port}`);
});
