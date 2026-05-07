const { callClaude, safeParseJSON } = require("../../utils/claude");
const AUTH_PROMPT = (intent, design) => `Generate a complete auth and permissions schema.
Roles: ${JSON.stringify(intent.user_roles)}, Hierarchy: ${JSON.stringify(design.role_hierarchy)}, Rules: ${JSON.stringify(intent.business_rules)}
Respond ONLY with valid JSON:
{"strategy":"jwt","token_expiry":"15m","refresh_token_expiry":"7d","roles":[{"name":"admin","description":"full access","inherits":[]}],"permissions":[{"role":"admin","resource":"users","actions":["create","read","update","delete"],"conditions":null}],"protected_routes":[{"path":"/admin/*","roles":["admin"]}],"public_routes":["/auth/login","/auth/register"],"oauth_providers":[],"password_policy":{"min_length":8,"require_uppercase":true,"require_number":true}}`;
async function generateAuthSchema(intent, design) {
  const start = Date.now();
  const data = safeParseJSON(await callClaude(AUTH_PROMPT(intent, design)));
  return { data, duration: Date.now() - start };
}
module.exports = { generateAuthSchema };
