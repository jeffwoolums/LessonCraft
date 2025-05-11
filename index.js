
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { Readability } = require('@mozilla/readability');
const { JSDOM } = require('jsdom');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function extractArticleText(url) {
    try {
        const response = await fetch(url);
        const html = await response.text();
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();
        return article?.textContent || '';
    } catch (error) {
        console.error("❌ Failed to extract article:", error);
        return '';
    }
}

app.post('/generate', async (req, res) => {
    const { topic } = req.body;

    let promptText = topic;

    // If it's a URL, extract readable article text
    if (topic.startsWith('http')) {
        console.log("🌐 Detected URL, extracting content...");
        const articleText = await extractArticleText(topic);
        if (articleText.length > 100) {
            promptText = `Create a lesson plan based on this article content: \n${articleText}`;
        } else {
            return res.status(400).json({ error: "Unable to extract useful content from URL." });
        }
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Authorization": `Bearer ${OPENAI_API_KEY}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{ role: "user", content: `Create a 3-point lesson plan with titles, 3-4 bullet subpoints each, and at least 2 quotes per section on: "${promptText}"` }],
            temperature: 0.7
        })
    });

    const data = await response.json();

    try {
        const rawText = data.choices[0].message.content;

        const sections = rawText.split(/\n(?=\d+\.)/).map(section => {
            const titleMatch = section.match(/^\d+\.\s*(.*)/);
            const title = titleMatch ? titleMatch[1].trim() : "Lesson Section";
            const bullets = Array.from(section.matchAll(/[-•]\s+(.*)/g)).map(m => m[1].trim());
            const quotes = Array.from(section.matchAll(/“([^”]+)”|"(.*?)"/g)).map(m => m[1] || m[2]);

            return {
                id: Math.random().toString(36).substring(2, 10),
                title,
                subpoints: bullets,
                quotes
            };
        });

        res.json(sections);
    } catch (err) {
        console.error("❌ JSON parse error:", err);
        res.status(500).json({ error: "Failed to parse OpenAI response." });
    }
});

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
    console.log(`✅ Proxy server running on http://localhost:${PORT}`);
});
