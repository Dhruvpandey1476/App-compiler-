const { runPipeline } = require("../server/pipeline");
const dataset = require("./dataset.json");
const fs = require("fs");
async function evaluate() {
  const results = []; const all = [...dataset.real_prompts, ...dataset.edge_cases];
  console.log(`Running evaluation on ${all.length} prompts...\n`);
  for (const item of all) {
    console.log(`[${item.id}] ${item.prompt.slice(0,60)}...`);
    const t = Date.now();
    try {
      const output = await runPipeline(item.prompt);
      const audit = output.validation?.llm_audit;
      results.push({ id:item.id, type:item.type||"real", status:"success", latency_ms:Date.now()-t, consistency_score:audit?.consistency_score||null, execution_readiness:audit?.execution_readiness?.score||null, issues_found:(output.validation?.client_issues?.length||0)+(audit?.issues_found?.length||0), repairs_made:audit?.repairs_made?.length||0, tables:output.database?.tables?.length||0, endpoints:output.api?.endpoints?.length||0, pages:output.ui?.pages?.length||0 });
      console.log(`  done in ${((Date.now()-t)/1000).toFixed(2)}s`);
    } catch(err) {
      results.push({ id:item.id, type:item.type||"real", status:"error", latency_ms:Date.now()-t, error:err.message });
      console.log(`  error: ${err.message}`);
    }
    await new Promise(r=>setTimeout(r,1000));
  }
  const success = results.filter(r=>r.status==="success");
  const summary = { total:results.length, success:success.length, success_rate:((success.length/results.length)*100).toFixed(1)+"%", avg_latency_ms:Math.round(success.reduce((a,r)=>a+r.latency_ms,0)/success.length), avg_consistency:(success.reduce((a,r)=>a+(r.consistency_score||0),0)/success.length).toFixed(1), avg_exec_readiness:(success.reduce((a,r)=>a+(r.execution_readiness||0),0)/success.length).toFixed(1), total_issues_found:success.reduce((a,r)=>a+r.issues_found,0), total_repairs:success.reduce((a,r)=>a+r.repairs_made,0), results };
  fs.writeFileSync(__dirname+"/results.json", JSON.stringify(summary,null,2));
  console.log("\n=== EVAL SUMMARY ===\nSuccess Rate:", summary.success_rate, "\nAvg Latency:", summary.avg_latency_ms+"ms", "\nAvg Consistency:", summary.avg_consistency+"/100", "\nResults saved to evaluation/results.json");
}
evaluate().catch(console.error);
