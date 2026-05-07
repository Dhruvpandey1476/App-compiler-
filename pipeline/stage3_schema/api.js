// Stage 3b: REST API Schema Generation
// Produces endpoint definitions aligned to the DB schema

const { callClaude, safeParseJSON } = require("../../utils/claude");

const API_PROMPT = (intent, design, db) => `Generate a complete REST API schema aligned to this database.
DB Tables: ${JSON.stringify(db.tables?.map(t => ({ name: t.name, cols: t.columns?.map(c => c.name) })))}
Roles: ${JSON.stringify(intent.user_roles?.map(r => r.name))}
Features: ${JSON.stringify(intent.core_features)}
Business Rules: ${JSON.stringify(intent.business_rules)}

Respond ONLY with valid JSON:
{
  "base_url": "/api/v1",
  "endpoints": [
    {
      "path": "/resource/:id",
      "method": "GET|POST|PUT|PATCH|DELETE",
      "description": "what it does",
      "auth_required": true,
      "allowed_roles": ["admin","user"],
      "request": {
        "params": [{"name": "id", "type": "uuid", "required": true}],
        "query": [{"name": "page", "type": "integer", "required": false, "default": 1}],
        "body": {"field": "type"}
      },
      "response": {
        "200": {"description": "success", "schema": {"field": "type"}},
        "401": "Unauthorized",
        "403": "Forbidden",
        "404": "Not found"
      },
      "db_tables": ["table_names_this_endpoint_touches"]
    }
  ]
}
RULES:
- Include CRUD (list, get, create, update, delete) for every entity
- Include auth endpoints: POST /auth/register, POST /auth/login, POST /auth/refresh, POST /auth/logout
- db_tables must only reference tables that exist in the DB schema
- Apply role-based access per business rules`;

async function generateAPISchema(intent, design, db) {
  const start = Date.now();
  const raw = await callClaude(API_PROMPT(intent, design, db));
  const data = safeParseJSON(raw);
  return { data, duration: Date.now() - start };
}

module.exports = { generateAPISchema };
