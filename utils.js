function sanitizeSettings(settings) {
    return {
        maxParableSlides: settings?.maxParableSlides ?? 3,
        maxPointsPerSlide: settings?.maxPointsPerSlide ?? 5,
        maxScripturesPerSlide: settings?.maxScripturesPerSlide ?? 2,
        maxQuotesPerSlide: settings?.maxQuotesPerSlide ?? 2,
        maxArtworksPerSlide: settings?.maxArtworksPerSlide ?? 1,
        maxHymnsPerSlide: settings?.maxHymnsPerSlide ?? 1,
        maxQuestionsPerSlide: settings?.maxQuestionsPerSlide ?? 5,
    };
}
module.exports = { sanitizeSettings };