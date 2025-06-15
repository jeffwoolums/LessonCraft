# LessonCraft 4.0 Production Build

## Deployment
 
1. Set `OPENAI_API_KEY` in your environment or on Render.
2. Run `npm install`
3. Run `npm start`
4. POST to `/generate` with a payload of:
   ```
   {
     "promptType": "lesson", // or "study", "trivia", "talk", "enrich_scripture", etc.
     ...payloadFields
   }
   ```
5. Add prompt modules as needed to `/Prompts/` or `/Prompts/Enrichment/`.

Enjoy your SaaS-ready modular backend!
