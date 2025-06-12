// /prompts/utils.js

function cleanAIResponse(responseText) {
  return responseText.replace(/^```json|^```|```$/g, "").trim();
}

module.exports = { cleanAIResponse };
