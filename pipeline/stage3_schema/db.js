// Stage 3a: Database Schema Generation
// Produces PostgreSQL-compatible table definitions aligned to system design

const { callClaude, safeParseJSON } = require("../../utils/claude");

const DB_PROMPT = (intent, design) => `Generate a complete PostgreSQL database schema.
App: "${intent.app_name}", Features: ${JSON.stringify(intent.core_features)}, Roles: ${JSON.stringify(intent.user_roles?.map(r => r.name))}
Entities: ${JSON.stringify(design.entities?.map(e => ({ name: e.name, attrs: e.attributes?.map(a => a.name), rels: e.relations })))}

Respond ONLY with valid JSON:
{
  "tables": [
    {
      "name": "snake_case_table",
      "description": "purpose",
      "columns": [
        {
          "name": "col",
          "type": "UUID|VARCHAR(255)|TEXT|INTEGER|BOOLEAN|TIMESTAMPTZ|DECIMAL(10,2)|JSONB",
          "nullable": false,
          "unique": false,
          "default": null,
          "primary_key": false,
          "foreign_key": {"table": "other_table", "column": "id"}
        }
      ],
      "indexes": [{"name": "idx_name", "columns": ["col1"], "unique": false}]
    }
  ],
  "enums": [{"name": "enum_name", "values": ["val1","val2"]}]
}
RULES:
- Every table MUST include: id (UUID, PK), created_at (TIMESTAMPTZ NOT NULL), updated_at (TIMESTAMPTZ NOT NULL)
- Cover ALL entities from the design
- Add a "users" table if not already present (id, email, password_hash, role, created_at, updated_at)
- Foreign keys must reference existing tables`;

async function generateDBSchema(intent, design) {
  const start = Date.now();
  const raw = await callClaude(DB_PROMPT(intent, design));
  const data = safeParseJSON(raw);
  return { data, duration: Date.now() - start };
}

module.exports = { generateDBSchema };
