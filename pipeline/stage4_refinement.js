const { callClaude, safeParseJSON } = require("../utils/claude");
const REFINEMENT_PROMPT = (schema) => `You are a schema validator. Audit this multi-layer app schema for inconsistencies and fix them.
DB Tables: ${JSON.stringify(schema.database?.tables?.map(t=>t.name))}
API Endpoints: ${JSON.stringify(schema.api?.endpoints?.map(e=>({path:e.path,method:e.method,db_tables:e.db_tables})))}
UI Pages: ${JSON.stringify(schema.ui?.pages?.map(p=>({path:p.path,components:p.components?.map(c=>c.api_endpoint)})))}
Auth Roles: ${JSON.stringify(schema.auth?.roles?.map(r=>r.name))}
Intent Roles: ${JSON.stringify(schema.intent?.user_roles?.map(r=>r.name))}
Check: (1) API db_tables refs exist in DB (2) UI api_endpoints exist in API (3) roles consistent (4) no orphaned entities.
Respond ONLY with valid JSON:
{"issues_found":[{"severity":"error|warning","layer":"db|api|ui|auth|cross-layer","description":"specific issue","affected":"what"}],"repairs_made":[{"issue":"what was broken","action":"what was fixed"}],"consistency_score":85,"execution_readiness":{"score":90,"blockers":[],"warnings":[]},"cross_layer_validation":{"api_db_aligned":true,"ui_api_aligned":true,"auth_consistent":true,"roles_consistent":true}}`;
async function refineSchema(fullSchema) {
  const start = Date.now();
  const data = safeParseJSON(await callClaude(REFINEMENT_PROMPT(fullSchema)));
  return { data, duration: Date.now() - start };
}
module.exports = { refineSchema };
