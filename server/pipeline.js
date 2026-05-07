const { extractIntent } = require("../pipeline/stage1_intent");
const { generateDesign } = require("../pipeline/stage2_design");
const { generateDBSchema } = require("../pipeline/stage3_schema/db");
const { generateAPISchema } = require("../pipeline/stage3_schema/api");
const { generateUISchema } = require("../pipeline/stage3_schema/ui");
const { generateAuthSchema } = require("../pipeline/stage3_schema/auth");
const { refineSchema } = require("../pipeline/stage4_refinement");
const { validateCrossLayer } = require("../pipeline/validator");

async function runPipeline(prompt) {
  const t0 = Date.now(); const timings = {};
  const s1 = await extractIntent(prompt); timings.intent = s1.duration;
  const s2 = await generateDesign(s1.data); timings.design = s2.duration;
  const s3db = await generateDBSchema(s1.data, s2.data);
  const s3api = await generateAPISchema(s1.data, s2.data, s3db.data);
  const s3ui = await generateUISchema(s1.data, s3api.data);
  const s3auth = await generateAuthSchema(s1.data, s2.data);
  timings.generation = s3db.duration + s3api.duration + s3ui.duration + s3auth.duration;
  const bundle = { intent: s1.data, system_design: s2.data, database: s3db.data, api: s3api.data, ui: s3ui.data, auth: s3auth.data };
  const clientIssues = validateCrossLayer(bundle);
  const s4 = await refineSchema(bundle); timings.refinement = s4.duration;
  return { meta: { generated_at: new Date().toISOString(), pipeline_version: "1.0.0", input_prompt: prompt, total_duration_ms: Date.now() - t0, stage_timings_ms: timings }, ...bundle, validation: { client_issues: clientIssues, llm_audit: s4.data } };
}
module.exports = { runPipeline };
