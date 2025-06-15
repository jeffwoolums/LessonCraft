function buildLessonPrompt(request) {
  const {
    topic = "Default Topic",
    audience = "Adult Sunday School",
    tone = "Inspirational",
    duration_minutes = 45,
    lessonSource = "FreeTopic",
    comeFollowMeURL = null,
    conferenceTalkURL = null,
    content_sources = [],
    settings = {
      maxParableSlides: 3,
      maxPointsPerSlide: 5,
      maxScripturesPerSlide: 2,
      maxQuotesPerSlide: 2,
      maxArtworksPerSlide: 1,
      maxHymnsPerSlide: 1,
      maxQuestionsPerSlide: 5
    }
  } = request || {};
 
  const specificSources = content_sources.map(source => {
    switch (source) {
      case "ComeFollowMe": return "Come Follow Me manuals";
      case "ConferenceTalks": return "General Conference talks";
      case "Liahona": return "Liahona magazine";
      case "Friend": return "Friend magazine";
      case "ForStrengthOfYouth": return "For the Strength of Youth";
      case "PreachMyGospel": return "Preach My Gospel manual";
      case "ChurchHistory": return "Church History and Saints volumes";
      case "JesusTheChrist": return "Jesus the Christ by James E. Talmage";
      case "GospelTopics": return "Gospel Topics Essays";
      case "Hymns": return "The 1985 Hymns";
      case "Scriptures": return "Standard Works (Bible, Book of Mormon, Doctrine & Covenants, Pearl of Great Price)";
      default: return source;
    }
  });

  let sourceConstraint = `Use ONLY LDS sources: ${specificSources.join(", ")} from ChurchofJesusChrist.org.`;

  if (lessonSource === "ComeFollowMe" && comeFollowMeURL) {
    sourceConstraint += ` Align directly with content from ${comeFollowMeURL}`;
  }
  if (lessonSource === "ConferenceTalk" && conferenceTalkURL) {
    sourceConstraint += ` Align directly with content from ${conferenceTalkURL}`;
  }

  // v4.0 Prompt
  return `
Create an engaging, historically accurate, content-rich LDS Sunday School lesson.

Title: "${topic}"
Audience: ${audience}
Tone: ${tone}
Expected Duration: ${duration_minutes} minutes
${sourceConstraint}

Instructions:
- The lesson must begin with a descriptive introduction (400–500 words), based on a true story or article from LDS magazines, General Conference, or church history, fully cited. Do not invent fake stories.
- Every parable slide must include:
  - A 4–5 sentence summary or description.
  - Several thought-provoking questions (at least ${settings.maxQuestionsPerSlide}).
  - At least ${settings.maxScripturesPerSlide} relevant scriptures (verse, reference, link).
  - At least ${settings.maxQuotesPerSlide} quotes (text, author, source, link).
  - Historical context about the time and place.
  - At least ${settings.maxHymnsPerSlide} hymn(s) (title, number, link).
  - At least ${settings.maxArtworksPerSlide} artwork(s), video(s), or media item(s) (title, url).
  - Media overlay (for TV output, with a quote over the image/video).
- After all parable slides, include:
  - A “closeout” slide with a summary of what was taught, a recap of points, and a closing testimony.
  - A “teacherInstructions” slide detailing how to prepare (e.g., materials, whiteboard, handouts, tips).
- Output strictly valid JSON. DO NOT use markdown, explanations, or omit any fields.
- Use this JSON structure for the full lesson:

{
  "settings": ${JSON.stringify(settings)},
  "slides": [
    {
      "type": "introduction",
      "title": "Lesson Title",
      "introductionText": "",
      "parablesOrTopicsCovered": []
    },
    {
      "type": "parable",
      "title": "",
      "description": "",
      "historicalContext": "",
      "scriptures": [{ "verse": "", "reference": "", "link": "" }],
      "quotes": [{ "text": "", "author": "", "source": "", "link": "" }],
      "thoughtProvokingQuestions": [""],
      "artwork": [{ "title": "", "url": "" }],
      "hymns": [{ "title": "", "number": "", "link": "" }],
      "mediaPresentation": { "mediaType": "", "url": "", "overlayQuote": "" }
    },
    {
      "type": "closeout",
      "title": "Lesson Recap & Testimony",
      "summary": "",
      "topicsCovered": [],
      "scripturesCovered": [],
      "mainPoints": []
    },
    {
      "type": "teacherInstructions",
      "title": "Instructions for the Teacher",
      "materialsNeeded": [],
      "preparationAdvice": [],
      "engagementTips": []
    }
  ]
}
`;
}
module.exports = { buildLessonPrompt };
