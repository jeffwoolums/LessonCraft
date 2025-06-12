# Input schema
const LessonRequestSchema = {
  lessonSource: {
    sourceType: "ComeFollowMe | GeneralConference | CustomTopic | LibrarySource",
    sourceDetails: {
      year: 2025,
      weekNumber: 24,
      lessonLink: "...",
      talkTitle: "...",
      talkLink: "...",
      customPrompt: "...",
      librarySection: "...",
      libraryLink: "..."
    }
  },
  settings: {
    maxParableSlides: 5,
    maxPointsPerSlide: 5,
    maxScripturesPerSlide: 4,
    maxQuotesPerSlide: 3,
    maxArtworksPerSlide: 1,
    maxHymnsPerSlide: 1,
    maxQuestionsPerSlide: 5
  }
};
