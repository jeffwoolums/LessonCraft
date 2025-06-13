const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios');
const buildPrompt = require('./PromptBuilder');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 10000;

app.use(bodyParser.json());

// OpenAI API setup
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const MAX_ATTEMPTS = 1;

app.post('/generateLesson', async (req, res) => {
    try {
        const userRequest = req.body;

        let attempt = 0;
        let validJSON = null;

        while (attempt < MAX_ATTEMPTS) {
            attempt++;
            console.log(`Generating lesson (attempt ${attempt})...`);

            const systemPrompt = buildPrompt(userRequest);

            const aiResponse = await axios.post(
                OPENAI_API_URL,
                {
                    model: 'gpt-4o',  // <-- adjust model as needed
                    messages: [
                        { role: 'system', content: systemPrompt },
                        { role: 'user', content: 'Generate the lesson JSON.' }
                    ],
                    temperature: 0.0,
                    top_p: 1.0,
                    presence_penalty: 0.0,
                    frequency_penalty: 0.0
                },
                {
                    headers: {
                        'Authorization': `Bearer ${OPENAI_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                }
            );

            const rawAIText = aiResponse.data.choices[0].message.content.trim();

            console.log("Raw AI response received.");

            // Attempt to parse JSON safely
            try {
                // Remove any markdown or non-JSON wrapping
                const cleanedJSON = extractJSON(rawAIText);
                const parsed = JSON.parse(cleanedJSON);

                // Quick top-level schema check (title + slides presence)
                if (parsed.title && parsed.slides) {
                    validJSON = parsed;
                    console.log("Valid JSON decoded.");
                    break;
                } else {
                    console.log("JSON missing required fields: title or slides");
                }
            } catch (err) {
                console.log("JSON parse failed:", err.message);
            }
        }

        if (validJSON) {
            res.json(validJSON);
        } else {
            res.status(500).json({ error: 'Failed to generate valid lesson after multiple attempts.' });
        }
    } catch (err) {
        console.error('Unexpected error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// JSON extraction helper — removes non-JSON garbage from response
function extractJSON(rawText) {
    const firstBrace = rawText.indexOf('{');
    const lastBrace = rawText.lastIndexOf('}');
    if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No JSON boundaries found.");
    }
    return rawText.substring(firstBrace, lastBrace + 1);
}

app.listen(port, () => {
    console.log(`LessonCraft AI Proxy running on port ${port}`);
});
