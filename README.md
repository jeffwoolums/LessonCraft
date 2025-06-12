# LessonCraft-AI Backend (v4.0)

## Quickstart

1. `npm install express cors body-parser openai`
2. Place your OpenAI key in your Xcode request (`apiKey`)—do not store in .env for max security.
3. Start server: `node index.js`
4. POST to `/generate` or `/enrich` from your Xcode client.

## Prompts

All prompt templates are in `/prompts`. You can extend for new use cases (trivia, study companion, etc).

## Security

No .env required. All secrets injected per request.

## Xcode Client

Just call `/generate` or `/enrich` with the correct payload. This backend is king of the hill for lesson and enrichment AI!
