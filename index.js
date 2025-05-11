
const express = require('express');
const fetch = require('node-fetch');
const { JSDOM } = require('jsdom');
const { Readability } = require('@mozilla/readability');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const PORT = process.env.PORT || 10000;

app.post('/generate', async (req, res) => {
    const topic = req.body.topic;

    if (!topic) {
        return res.status(400).json({ error: 'Topic is required' });
    }

    let promptText = topic;

    // Check if it's a URL and try to extract article content
    if (/^https?:\/\//.test(topic)) {
        console.log('🌐 Detected URL, extracting content...');
        try {
            const response = await fetch(topic);
            const html = await response.text();
            const dom = new JSDOM(html, { url: topic });
            const article = new Readability(dom.window.document).parse();

            if (article && article.textContent) {
                console.log('📄 Extracted article text:', article.textContent.slice(0, 500) + '...');
                promptText = article.textContent;
            } else {
                console.warn('⚠️ Failed to extract main article content. Using original topic.');
            }
        } catch (err) {
            console.error('❌ Error fetching or parsing article:', err);
        }
    }

    const messages = [
        { role: "system", content: "You are an AI assistant that creates clear, concise lesson plans from topics or articles." },
        { role: "user", content: `Create a 3-part lesson with key talking points, subpoints, and two quotes for each section on: ${promptText}` }
    ];

    try {
        const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENAI_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "gpt-3.5-turbo",
                messages,
                temperature: 0.7
            })
        });

        const result = await aiResponse.json();
        const output = result.choices?.[0]?.message?.content;

        console.log("🤖 AI Output:", output?.slice(0, 500) + '...');
        res.json(parseLessonOutput(output));
    } catch (err) {
        console.error("❌ Error calling OpenAI API:", err);
        res.status(500).json({ error: "OpenAI API error" });
    }
});

// Helper: split AI response into structured lesson
function parseLessonOutput(text) {
    const sections = text.split(/\n\n(?=\d+\.)/); // split by numbered parts
    return sections.map(section => {
        const [titleLine, ...rest] = section.split("\n");
        const title = titleLine.replace(/^\d+\.\s*/, '').trim();
        const subpoints = rest.filter(l => /^[-*]/.test(l)).map(l => l.replace(/^[-*]\s*/, ''));
        const quotes = rest.filter(l => /[-"“”']/.test(l) && !/^[-*]/.test(l));
        return { title, subpoints, quotes };
    });
}

app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
});
