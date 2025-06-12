// /prompts/generateLessonPrompt.js

function buildLessonPrompt({
  topic,
  audience = "Adult Sunday School",
  tone = "Inspirational",
  duration_minutes = 45,
  lessonSource = "FreeTopic",
  comeFollowMeURL = null,
  conferenceTalkURL = null,
  content_sources = [],
}) {

  const specificSources = content_sources.map((source) => {
    switch (source) {
      case "ComeFollowMe": return "Come Follow Me study materials";
      case "ConferenceTalks": return "General Conference Talks";
      case "Liahona": return "Liahona Magazine";
      case "Friend": return "Friend Magazine";
      case "ForStrengthOfYouth": return "For the Strength of Youth Magazine";
      case "PreachMyGospel": return "Preach My Gospel Manual";
      case "ChurchHistory": return "Church History topics and Saints volumes";
      case "JesusTheChrist": return "Jesus the Christ by James E. Talmage";
      case "GospelTopics": return "Gospel Topics Essays";
      case "Hymns": return "The official Hymns of the Church (1985 edition)";
      case "Scriptures": return "The Standard Works (Bible, Book of Mormon, Doctrine and Covenants, Pearl of Great Price)";
      default: return source;
    }
  });

  let sourceConstraint = `Use official LDS sources available at ChurchofJesusChrist.org, including ${specificSources.join(", ")}.`;

  if (lessonSource === "ComeFollowMe" && comeFollowMeURL) {
    sourceConstraint += ` This lesson should follow the content at: ${comeFollowMeURL}`;
  }
  if (lessonSource === "ConferenceTalk" && conferenceTalkURL) {
    sourceConstraint += ` This lesson should follow the content at: ${conferenceTalkURL}`;
  }

  return `
You are building a highly detailed, structured LDS teaching lesson.

TOPIC: ${topic}
AUDIENCE: ${audience}
TONE: ${tone}
DURATION: ${duration_minutes} minutes

${sourceConstraint}

STRUCTURE INSTRUCTIONS:

- Build the lesson as JSON with a "slides" array.
- The first slide is always INTRODUCTION (400-500 word introduction story).
- Then multiple PARABLE slides, each with:
  - Title
  - Description (4-5 sentences)
  - HistoricalContext
  - Scriptures (verse, reference, link)
  - Quotes (text, author, source, link)
  - ThoughtProvokingQuestions (3-5)
  - Hymns (title, number, link)
  - Artwork (title, url)
  - MediaPresentation (mediaType, url, overlayQuote)
- Then CLOSEOUT slide summarizing full lesson.
- Then TEACHERINSTRUCTIONS slide with:
  - MaterialsNeeded
  - PreparationAdvice
  - EngagementTips

- All data must come from ChurchofJesusChrist.org or its official publications.
- Scripture links MUST point to ChurchofJesusChrist.org.
- Hymn links MUST point to ChurchofJesusChrist.org/music.
- Quotes MUST have author, source, and link.

Respond ONLY with valid JSON. DO NOT include markdown or explanations.

JSON STRUCTURE:
{
  "slides": [
    { type: "introduction", ... },
    { type: "parable", ... },
    { type: "closeout", ... },
    { type: "teacherInstructions", ... }
  ]
}
  `;
}

module.exports = { buildLessonPrompt };
