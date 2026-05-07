const { callClaude, safeParseJSON } = require("../../utils/claude");
const UI_PROMPT = (intent, api) => `Generate a complete UI schema for a web app.
App: "${intent.app_name}", Roles: ${JSON.stringify(intent.user_roles?.map(r=>r.name))}
API Endpoints: ${JSON.stringify(api.endpoints?.map(e=>e.method+" "+e.path+" — "+e.description))}
Features: ${JSON.stringify(intent.core_features)}
Respond ONLY with valid JSON:
{"pages":[{"path":"/url","name":"Name","description":"purpose","auth_required":true,"allowed_roles":["admin"],"layout":"sidebar|topnav|fullscreen|centered","components":[{"type":"table|form|chart|card|modal|list|stats-grid|kanban","name":"ComponentName","api_endpoint":"/api/v1/endpoint","method":"GET","fields":["field1"],"description":"what it does"}]}],"navigation":{"primary":[{"label":"Dashboard","path":"/dashboard","icon":"grid","roles":["all"]}],"secondary":[{"label":"Settings","path":"/settings"}]},"global_components":["Navbar","Sidebar","Toast","Modal","LoadingSpinner"],"theme":{"primary_color":"#3b82f6","font":"Inter"}}
RULES: api_endpoint must exist in API. Include /login, /register (public), /dashboard. Cover all roles.`;
async function generateUISchema(intent, api) {
  const start = Date.now();
  const data = safeParseJSON(await callClaude(UI_PROMPT(intent, api)));
  return { data, duration: Date.now() - start };
}
module.exports = { generateUISchema };
