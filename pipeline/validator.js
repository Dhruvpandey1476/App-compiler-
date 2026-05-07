// Client-side cross-layer validation engine — zero latency, structural checks
function validateCrossLayer(schema) {
  const issues = [];
  const dbTables = new Set(schema.database?.tables?.map(t => t.name) || []);
  const apiPaths = schema.api?.endpoints?.map(e => e.path) || [];
  const authRoles = new Set(schema.auth?.roles?.map(r => r.name) || []);
  const intentRoles = new Set(schema.intent?.user_roles?.map(r => r.name) || []);

  // 1. API → DB
  schema.api?.endpoints?.forEach(ep => {
    (ep.db_tables || []).forEach(tbl => {
      if (tbl && !dbTables.has(tbl))
        issues.push({ severity:"error", type:"API→DB", msg:`Endpoint ${ep.method} ${ep.path} references missing table: "${tbl}"` });
    });
  });

  // 2. UI → API
  schema.ui?.pages?.forEach(pg => {
    (pg.components || []).forEach(comp => {
      if (comp.api_endpoint) {
        const found = apiPaths.some(p => p === comp.api_endpoint || p.replace(/:[^/]+/g,':x') === comp.api_endpoint.replace(/:[^/]+/g,':x'));
        if (!found) issues.push({ severity:"warning", type:"UI→API", msg:`Page "${pg.path}" component "${comp.name}" references unknown endpoint: "${comp.api_endpoint}"` });
      }
    });
  });

  // 3. Auth roles vs Intent
  authRoles.forEach(role => {
    if (!intentRoles.has(role)) issues.push({ severity:"warning", type:"Auth→Intent", msg:`Auth role "${role}" not declared in intent` });
  });

  // 4. DB structure
  schema.database?.tables?.forEach(tbl => {
    const cols = tbl.columns?.map(c => c.name) || [];
    if (!cols.includes('id')) issues.push({ severity:"error", type:"DB", msg:`Table "${tbl.name}" missing required "id" column` });
    if (!cols.includes('created_at')) issues.push({ severity:"warning", type:"DB", msg:`Table "${tbl.name}" missing "created_at"` });
  });

  return issues;
}
module.exports = { validateCrossLayer };
