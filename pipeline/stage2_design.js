// Stage 2: System Design
// Converts structured intent into app architecture (entities, flows, roles)

const { callClaude, safeParseJSON } = require("../utils/claude");

const DESIGN_PROMPT = (intent) => `You are a senior backend architect. Convert this intent into a system design.
Intent: ${JSON.stringify(intent, null, 2)}

Respond ONLY with valid JSON (no markdown):
{
  "entities": [
    {
      "name": "PascalCase entity name",
      "description": "what it represents",
      "attributes": [
        {"name": "field", "type": "string|int|bool|timestamp|uuid|decimal|json", "required": true, "unique": false}
      ],
      "relations": [
        {"entity": "OtherEntity", "type": "one-to-many|many-to-many|one-to-one", "through": "junction_table or null"}
      ]
    }
  ],
  "flows": [
    {
      "name": "flow name",
      "trigger": "what starts it",
      "steps": ["step1", "step2"],
      "actors": ["roleName"]
    }
  ],
  "role_hierarchy": {"admin": ["manager"], "manager": ["user"]},
  "data_model": {
    "primary_entities": ["Entity1"],
    "junction_tables": [{"name": "tbl", "connects": ["E1","E2"]}]
  }
}
Cover every entity implied by the features. Think carefully about relations.`;

async function generateDesign(intent) {
  const start = Date.now();
  const raw = await callClaude(DESIGN_PROMPT(intent));
  const data = safeParseJSON(raw);
  return { data, duration: Date.now() - start };
}

module.exports = { generateDesign };
