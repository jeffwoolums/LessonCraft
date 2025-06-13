// Builds prompt dynamically based on user input
module.exports = function buildPrompt(request) {
  const { sourceType, sourceDetails } = request.lessonSource;
  const settings = request.settings;

  return `
You are generating a lesson JSON file for the LessonCraft 4.0 system.

Source Type: ${sourceType}
Source Details: ${JSON.stringify(sourceDetails)}

You must output valid JSON matching this exact format:

{
  "title": "string",
  "settings": {
    "maxParableSlides": ${settings.maxParableSlides},
    "maxPointsPerSlide": ${settings.maxPointsPerSlide},
    "maxScripturesPerSlide": ${settings.maxScripturesPerSlide},
    "maxQuotesPerSlide": ${settings.maxQuotesPerSlide},
    "maxArtworksPerSlide": ${settings.maxArtworksPerSlide},
    "maxHymnsPerSlide": ${settings.maxHymnsPerSlide},
    "maxQuestionsPerSlide": ${settings.maxQuestionsPerSlide}
  },
  "slides": [
    {
      "type": "introduction",
      "title": "Lesson Title",
      "introductionText": "Opening narrative text...",
      "parablesOrTopicsCovered": ["Parable Name 1", "Parable Name 2"]
    },
    {
      "type": "parable",
      "title": "Parable Title",
      "description": "Detailed explanation of the parable...",
      "historicalContext": "Brief historical background...",
      "scriptures": [
        {
          "verse": "Full verse text...",
          "reference": "Book Chapter:Verse",
          "link": "https://..."
        }
      ],
      "quotes": [
        {
          "text": "Quote text...",
          "author": "Author Name",
          "source": "Talk or Source Title",
          "link": "https://..." // can be null if not present
        }
      ],
      "thoughtProvokingQuestions": ["Question 1", "Question 2"],
      "artwork": [
        {
          "title": "Artwork Title",
          "url": "https://..."
        }
      ],
      "hymns": [
        {
          "title": "Hymn Title",
          "number": "###",
          "link": "https://..."
        }
      ],
      "mediaPresentation": {
        "mediaType": "video | image | audio",
        "url": "https://...",
        "overlayQuote": "Overlay quote text..."
      }
    },
    {
      "type": "closeout",
      "title": "Closeout Title",
      "summary": "Summary text...",
      "topicsCovered": ["Topic 1", "Topic 2"],
      "scripturesCovered": [
        {
          "verse": "Full verse text...",
          "reference": "Book Chapter:Verse",
          "link": "https://..."
        }
      ],
      "mainPoints": ["Main Point 1", "Main Point 2"]
    },
    {
      "type": "teacherInstructions",
      "title": "Preparation Notes",
      "materialsNeeded": ["Item 1", "Item 2"],
      "preparationAdvice": ["Advice 1", "Advice 2"],
      "engagementTips": ["Tip 1", "Tip 2"]
    }
  ]
}

STRICT RULES:
- Output only valid JSON. Do not output anything else.
- The response must start with '{' and end with '}'.
- No commentary, no explanations, no markdown formatting.
- Always include **all fields**, even if they are empty arrays, empty strings, or null.
- Always include the "settings" block.
- Escape special characters properly.
- This output will be parsed directly into strongly typed Swift Codable models.
- Precision is mandatory. Invalid JSON will break the LessonCraft app.
`;
}
