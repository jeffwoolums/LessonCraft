const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const { Configuration, OpenAIApi } = require('openai');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

app.post('/generate-lesson', async (req, res) => {
  const { topic, text } = req.body;
  if (!topic && !text) {
    return res.status(400).json({ error: 'Missing topic or text' });
  }

  // Build the prompt
  const prompt = text
    ? `Create a structured lesson plan based on the following text. Break it into cards with topic, description, scripture, quote, hymn, image suggestion, and video suggestion. Return JSON.\nText: ${text}`
    : `Create a structured lesson plan on the topic "${topic}". Break it into cards with topic, description, scripture, quote, hymn, image suggestion, and video suggestion. Return JSON.`;

  try {
    const completion = await openai.createChatCompletion({
      model: 'gpt-4',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that creates religious lesson plans in JSON format.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 1500,
    });
    // Try to parse the JSON from the response
    const responseText = completion.data.choices[0].message.content;
    let lessonJson;
    try {
      lessonJson = JSON.parse(responseText);
    } catch (e) {
      // Try to extract JSON from markdown or text
      const match = responseText.match(/```json([\s\S]*?)```/);
      if (match) {
        lessonJson = JSON.parse(match[1]);
      } else {
        return res.status(500).json({ error: 'Failed to parse JSON from OpenAI response', responseText });
      }
    }
    res.json(lessonJson);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/', (req, res) => {
  res.send('LessonCraftAI Proxy Server is running.');
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
}); 