const express = require('express');
const bodyParser = require('body-parser');
const { routePrompt } = require('./Prompts/MasterPromptRouter');
const { callOpenAI } = require('./OpenAIServices');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

app.post('/generate', async (req, res) => {
    try {
        const { promptType = "lesson", ...requestBody } = req.body;
        const systemPrompt = routePrompt(promptType, requestBody);

        const aiResponse = await callOpenAI(systemPrompt);

        if (!aiResponse || !aiResponse.choices || !aiResponse.choices[0].message.content) {
            return res.status(500).json({ error: "AI response missing content" });
        }

        const rawJSON = aiResponse.choices[0].message.content;
        let lessonObject = {};
        try {
            lessonObject = JSON.parse(rawJSON);
        } catch (e) {
            return res.status(500).json({ error: "Invalid JSON from AI" });
        }

        if (!lessonObject.slides) {
            return res.status(500).json({ error: "Missing required fields in AI response." });
        }

        res.json(lessonObject);
    } catch (err) {
        res.status(500).json({ error: "Internal server error" });
    }
});

app.listen(port, () => {
    console.log(`LessonCraft AI Proxy running on port ${port}`);
});