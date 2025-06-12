function buildLessonPrompt({
  topic,
  audience = "Adult Sunday School",
  tone = "Inspirational",
  duration_minutes = 45,
  lessonSource = "FreeTopic",
  comeFollowMeURL = null,
  conferenceTalkURL = null,
  content_sources = []
}) {

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

  return `
You are generating a FULL LDS lesson JSON.

- Write an INTRODUCTION of 400-500 words with story, context, and purpose.
- Then create multiple PARABLE SLIDES. Each slide includes:
    - title, description (4-5 sentences), historicalContext
    - 2+ scriptures (verse, reference, link)
    - 2+ quotes (text, author, source, link)
    - 3-5 thoughtProvokingQuestions
    - 1 hymn (title, number, link)
    - 1 artwork (title, url)
    - mediaPresentation (mediaType, url, overlayQuote)
- After parables: add CLOSEOUT slide (summary + recap points).
- After closeout: add TEACHERINSTRUCTIONS slide (materials, preparation, engagement tips).

Output strict JSON only. No markdown, no explanations.

JSON FORMAT:
{
  "slides": [
    { "type": "introduction", ... },
    { "type": "parable", ... },
    { "type": "closeout", ... },
    { "type": "teacherInstructions", ... }
  ]
}
`;
}

module.exports = { buildLessonPrompt };
