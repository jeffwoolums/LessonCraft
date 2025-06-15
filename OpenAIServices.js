const axios = require('axios');
require('dotenv').config();

const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function callOpenAI(systemPrompt) {
    try {
        const response = await axios.post(
            OPENAI_API_URL,
            {
                model: 'gpt-4o',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: 'Generate the full lesson JSON as specified.' }
                ],
                temperature: 0.0,
                top_p: 1.0,
                presence_penalty: 0.0,
                frequency_penalty: 0.0,
                response_format: "json"  // FORCE pure JSON output from GPT-4o
            },
            {
                headers: {
                    'Authorization': `Bearer ${OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );

        // ✅ Validate basic structure before returning to index.js
        if (!response.data || !response.data.choices || !response.data.choices[0].message || !response.data.choices[0].message.content) {
            console.error("Unexpected OpenAI response structure.");
            return null;
        }

        return response.data;
    } catch (err) {
        console.error("OpenAI API Error:", err);
        return null;
    }
}

module.exports = { callOpenAI };
