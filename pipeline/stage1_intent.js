// Stage 1: Intent Extraction
// Converts raw natural language into structured intent JSON

const { callClaude, safeParseJSON } = require("../utils/claude");

const INTENT_PROMPT = (input) => `You are a software architect. Extract structured intent from this product description.
Input: "${input}"

Respond ONLY with valid JSON (no markdown, no explanation, no backticks):
{
  "app_name": "inferred app name",
  "app_type": "crm|ecommerce|saas|cms|social|marketplace|analytics|other",
  "description": "one sentence description",
  "core_features": ["specific feature 1", "specific feature 2"],
  "user_roles": [{"name": "roleName", "capabilities": ["can do X", "can do Y"]}],
  "business_rules": ["rule 1: e.g. premium users can access X", "rule 2"],
  "integrations": ["stripe", "sendgrid"],
  "assumptions": ["assumption made for unclear parts"],
  "clarifications_needed": ["genuinely ambiguous items that need user input"]
}
Be exhaustive. Every feature mentioned must appear. Infer reasonable roles if not specified.
If the prompt is very vague, fill clarifications_needed with specific questions.`;

async function extractIntent(userInput) {
  const start = Date.now();
  const raw = await callClaude(INTENT_PROMPT(userInput));
  const data = safeParseJSON(raw);
  return { data, duration: Date.now() - start };
}

module.exports = { extractIntent };
