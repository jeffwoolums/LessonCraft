# Builds prompt dynamically based on user input
module.exports = function buildPrompt(request) {
  const { sourceType, sourceDetails } = request.lessonSource;
  const settings = request.settings;

  return `
You are LessonCraft AI V4.0.

Source Type: ${sourceType}
Source Details: ${JSON.stringify(sourceDetails)}

Generate a full LDS doctrinal lesson EXACTLY in this JSON structure:

{
  "settings": { ... },
  "slides": [
    { "type": "introduction", ... },
    { "type": "parable", ... },
    { "type": "closeout", ... },
    { "type": "teacherInstructions", ... }
  ]
}

✅ Introduction Slide (400-500 words)
✅ Each Parable Slide:
- 4-5 sentence doctrinal description
- Historical context
- ${settings.maxScripturesPerSlide} scriptures (reference, verse, link)
- ${settings.maxQuotesPerSlide} quotes (author, source, link)
- ${settings.maxQuestionsPerSlide} thought-provoking questions
- 1 artwork URL
- 1 hymn (title, number, link)
- Optional media overlay quote

✅ Closeout Slide:
- Summary of key points and scriptures

✅ Teacher Instructions Slide:
- Materials needed
- Preparation advice
- Engagement tips
- Accessibility options

🔒 Pull exclusively from ChurchofJesusChrist.org official sources.
🔒 Return only valid JSON output.
`;
}
