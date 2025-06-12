function buildEnrichmentPrompt({ text, topic, action }) {
  switch (action) {
    case "expand_summary":
      return `Expand this for LDS lesson topic "${topic}": "${text}"`;
    case "add_scripture":
      return `Suggest 1 relevant scripture for: "${text}"`;
    case "add_historical_context":
      return `Add historical context for: "${text}"`;
    case "add_quote":
      return `Suggest 1 LDS General Authority quote for: "${text}"`;
    default:
      throw new Error("Invalid enrichment action.");
  }
}

module.exports = { buildEnrichmentPrompt };
