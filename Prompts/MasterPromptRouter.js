const { buildLessonPrompt } = require('./GenerateLessonPrompt');
const { buildStudyPrompt } = require('./StudyPrompt');
const { buildTalkPrompt } = require('./TalkPrompt');
const { buildTriviaPrompt } = require('./TriviaPrompt');
const { buildEnrichScripturePrompt } = require('./Enrichment/EnrichScripturePrompt');
const { buildEnrichQuotePrompt } = require('./Enrichment/EnrichQuotePrompt');
const { buildEnrichExpandPrompt } = require('./Enrichment/EnrichExpandPrompt');
const { buildEnrichContextPrompt } = require('./Enrichment/EnrichContextPrompt');

function routePrompt(promptType, request) {
    switch ((promptType || 'lesson').toLowerCase()) {
        case 'study':
            return buildStudyPrompt(request);
        case 'talk':
            return buildTalkPrompt(request);
        case 'trivia':
            return buildTriviaPrompt(request);
        case 'enrich_scripture':
            return buildEnrichScripturePrompt(request);
        case 'enrich_quote':
            return buildEnrichQuotePrompt(request);
        case 'enrich_expand':
            return buildEnrichExpandPrompt(request);
        case 'enrich_context':
            return buildEnrichContextPrompt(request);
        case 'lesson':
        default:
            return buildLessonPrompt(request);
    }
}

module.exports = { routePrompt };