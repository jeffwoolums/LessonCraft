// /prompts/enrichPrompts.js

function buildEnrichmentPrompt({ text, topic, action }) {
  switch (action) {
    case "expand_summary":
      return `Expand this text for an LDS lesson on "${topic}": "${text}". Output detailed expanded content only.`;
    case "add_scripture":
      return `Based on: "${text}", suggest 1 highly relevant scripture (full reference only).`;
    case "add_historical_context":
      return `Add historical context to this LDS lesson point: "${text}". Output "Did you know?" historical fact.`;
    case "add_quote":
      return `Suggest 1 quote from LDS General Authorities related to: "${text}" on topic "${topic}". Output text + author + source.`;
    default:
      throw new Error("Invalid enrichment action.");
  }
}

module.exports = { buildEnrichmentPrompt };
