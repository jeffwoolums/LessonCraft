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
        return response.data;
    } catch (err) {
        return null;
    }
}

module.exports = { callOpenAI };
