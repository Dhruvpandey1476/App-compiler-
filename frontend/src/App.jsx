import { useState, useCallback } from "react";

const EXAMPLES = [
  "Build a CRM with login, contacts, dashboard, role-based access, and premium plan with payments. Admins can see analytics.",
  "Create a SaaS project management tool with workspaces, kanban boards, time tracking, team roles, and Stripe billing.",
  "Build an e-commerce marketplace with product catalog, seller dashboard, cart, checkout, reviews, and admin panel.",
  "Build me a vague app for tracking stuff for my team",
];

const STAGE_META = [
  { id: "intent", label: "01 · Intent Extraction", sub: "NL → Structured Intent" },
  { id: "schema", label: "02 · System Design", sub: "Intent → Architecture" },
  { id: "generation", label: "03 · Schema Generation", sub: "DB · API · UI · Auth" },
  { id: "refinement", label: "04 · Refinement & Repair", sub: "Cross-layer Validation" },
];

const STATUS_COLOR = { idle: "#334155", running: "#06b6d4", done: "#10b981", error: "#ef4444" };
const STATUS_LABEL = { idle: "WAITING", running: "RUNNING", done: "DONE", error: "ERROR" };

function StageCard({ meta, stage, onClick, isActive }) {
  const color = STATUS_COLOR[stage.status];
  return (
    <div onClick={() => stage.status !== "idle" && onClick(meta.id)}
      style={{ background: isActive ? "rgba(6,182,212,0.07)" : "rgba(15,23,42,0.6)", border: `1px solid ${isActive ? "#06b6d4" : "#1e293b"}`, borderRadius: 8, padding: "14px 16px", cursor: stage.status !== "idle" ? "pointer" : "default", transition: "all 0.2s", flex: 1, minWidth: 0 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{ fontFamily: "monospace", fontSize: 11, color: "#64748b", letterSpacing: 1 }}>{meta.label}</span>
        <span style={{ fontFamily: "monospace", fontSize: 10, color, background: color + "22", padding: "2px 6px", borderRadius: 4, border: `1px solid ${color}33` }}>
          {stage.status === "running" ? "● " : ""}{STATUS_LABEL[stage.status]}
        </span>
      </div>
      <div style={{ fontFamily: "monospace", fontSize: 12, color: "#94a3b8" }}>{meta.sub}</div>
      {stage.duration > 0 && <div style={{ fontFamily: "monospace", fontSize: 11, color: "#475569", marginTop: 6 }}>{(stage.duration / 1000).toFixed(2)}s</div>}
      {stage.error && <div style={{ fontFamily: "monospace", fontSize: 11, color: "#ef4444", marginTop: 4 }}>✗ {stage.error.slice(0, 60)}</div>}
    </div>
  );
}

function JsonViewer({ data, maxH = 300 }) {
  const [collapsed, setCollapsed] = useState(true);
  if (!data) return null;
  const str = JSON.stringify(data, null, 2);
  return (
    <div style={{ position: "relative" }}>
      <pre style={{ background: "#020617", border: "1px solid #1e293b", borderRadius: 6, padding: 16, fontFamily: "monospace", fontSize: 12, color: "#7dd3fc", maxHeight: collapsed ? maxH : "none", overflow: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", margin: 0 }}>{str}</pre>
      {str.length > 500 && <button onClick={() => setCollapsed(!collapsed)} style={{ position: "absolute", bottom: 8, right: 8, background: "#1e293b", border: "1px solid #334155", color: "#94a3b8", fontFamily: "monospace", fontSize: 11, padding: "3px 10px", borderRadius: 4, cursor: "pointer" }}>{collapsed ? "▼ expand" : "▲ collapse"}</button>}
    </div>
  );
}

function IssueList({ issues }) {
  if (!issues?.length) return <div style={{ fontFamily: "monospace", fontSize: 12, color: "#10b981" }}>✓ No issues detected</div>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {issues.map((iss, i) => (
        <div key={i} style={{ background: iss.severity === "error" ? "rgba(239,68,68,0.08)" : "rgba(245,158,11,0.08)", border: `1px solid ${iss.severity === "error" ? "#ef444433" : "#f59e0b33"}`, borderRadius: 6, padding: "8px 12px", fontFamily: "monospace", fontSize: 12 }}>
          <span style={{ color: iss.severity === "error" ? "#ef4444" : "#f59e0b" }}>[{(iss.severity || iss.type || "warn").toUpperCase()}]</span>
          <span style={{ color: "#94a3b8", marginLeft: 8 }}>{iss.msg || iss.description}</span>
        </div>
      ))}
    </div>
  );
}

const API_BASE = process.env.REACT_APP_API_URL || "http://localhost:3001";

export default function AppCompiler() {
  const [prompt, setPrompt] = useState("");
  const [running, setRunning] = useState(false);
  const [activePanel, setActivePanel] = useState(null);
  const [stages, setStages] = useState({ intent: { status:"idle",data:null,duration:0,error:null }, schema: { status:"idle",data:null,duration:0,error:null }, generation: { status:"idle",data:null,duration:0,error:null,sub:{} }, refinement: { status:"idle",data:null,duration:0,error:null } });
  const [clientIssues, setClientIssues] = useState([]);
  const [finalSchema, setFinalSchema] = useState(null);
  const [metrics, setMetrics] = useState(null);

  const setStage = (id, patch) => setStages(s => ({ ...s, [id]: { ...s[id], ...patch } }));
  const subColor = (s) => ({ done:"#10b981",running:"#06b6d4",idle:"#334155",error:"#ef4444" }[s]||"#334155");

  const runPipeline = useCallback(async () => {
    if (!prompt.trim() || running) return;
    setRunning(true); setFinalSchema(null); setClientIssues([]); setMetrics(null); setActivePanel(null);
    setStages({ intent:{status:"idle",data:null,duration:0,error:null}, schema:{status:"idle",data:null,duration:0,error:null}, generation:{status:"idle",data:null,duration:0,error:null,sub:{}}, refinement:{status:"idle",data:null,duration:0,error:null} });

    setStage("intent", { status:"running" });
    setStage("schema", { status:"idle" });
    setStage("generation", { status:"idle", sub:{ db:"idle",api:"idle",ui:"idle",auth:"idle" } });
    setStage("refinement", { status:"idle" });

    try {
      const res = await fetch(`${API_BASE}/api/compile`, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ prompt }) });
      if (!res.ok) throw new Error(`Server error ${res.status}`);
      const data = await res.json();
      const t = data.meta?.stage_timings_ms || {};

      setStage("intent", { status:"done", data:data.intent, duration: t.intent||0 });
      setStage("schema", { status:"done", data:data.system_design, duration: t.design||0 });
      setStage("generation", { status:"done", duration: t.generation||0, sub:{db:"done",api:"done",ui:"done",auth:"done"}, data:{ database:data.database, api:data.api, ui:data.ui, auth:data.auth } });
      setStage("refinement", { status:"done", data:data.validation?.llm_audit, duration: t.refinement||0 });
      setClientIssues(data.validation?.client_issues || []);
      setFinalSchema(data);
      const audit = data.validation?.llm_audit;
      setMetrics({ total_ms: data.meta?.total_duration_ms, consistency_score: audit?.consistency_score||"N/A", exec_readiness: audit?.execution_readiness?.score||"N/A", issues: (data.validation?.client_issues?.length||0)+(audit?.issues_found?.length||0), repairs: audit?.repairs_made?.length||0 });
      setActivePanel("output");
    } catch (err) {
      setStages(s => { const u={...s}; for(const k of Object.keys(u)) if(u[k].status==="running") u[k]={...u[k],status:"error",error:err.message}; return u; });
    } finally { setRunning(false); }
  }, [prompt, running]);

  const tabs = finalSchema ? [["output","Full Output"],["intent","Intent"],["schema","Design"],["generation","Schemas"],["refinement","Audit"],["issues","Issues"]] : [];

  return (
    <div style={{ minHeight:"100vh", background:"#080c14", fontFamily:"'Courier New',monospace", color:"#e2e8f0", paddingBottom:60 }}>
      <div style={{ background:"linear-gradient(180deg,#0f172a 0%,#080c14 100%)", borderBottom:"1px solid #1e293b", padding:"24px 32px 20px" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
            <span style={{ color:"#06b6d4", fontSize:20 }}>⬡</span>
            <span style={{ fontSize:18, fontWeight:700, letterSpacing:2, color:"#f1f5f9" }}>APP · COMPILER</span>
            <span style={{ fontSize:10, color:"#06b6d4", border:"1px solid #06b6d433", padding:"2px 8px", borderRadius:4, letterSpacing:1, background:"#06b6d40f" }}>v1.0.0</span>
          </div>
          <div style={{ fontSize:12, color:"#64748b", letterSpacing:1 }}>Natural Language → Structured Config → Validated Schema → Executable Application</div>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"28px 32px 0" }}>
        <div style={{ marginBottom:28 }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
            <span style={{ fontSize:11, color:"#64748b", letterSpacing:1 }}>INPUT PROMPT</span>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
              {EXAMPLES.map((e,i) => <button key={i} onClick={()=>setPrompt(e)} style={{ background:"transparent", border:"1px solid #1e293b", color:"#475569", fontSize:10, padding:"3px 10px", borderRadius:4, cursor:"pointer", fontFamily:"monospace" }}>example {i+1}</button>)}
            </div>
          </div>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} placeholder="Describe your application... (e.g. Build a CRM with login, contacts, role-based access...)" rows={3}
            style={{ width:"100%", background:"#0f172a", border:"1px solid #334155", borderRadius:8, color:"#e2e8f0", fontFamily:"monospace", fontSize:13, padding:"14px 16px", resize:"vertical", outline:"none", boxSizing:"border-box", lineHeight:1.6 }} />
          <div style={{ display:"flex", justifyContent:"flex-end", marginTop:10 }}>
            <button onClick={runPipeline} disabled={!prompt.trim()||running}
              style={{ background: running?"#164e63":"#0891b2", color: running?"#67e8f9":"#fff", border:"none", borderRadius:6, padding:"10px 28px", fontFamily:"monospace", fontSize:13, fontWeight:700, cursor: running?"not-allowed":"pointer", letterSpacing:1, opacity:!prompt.trim()?0.4:1 }}>
              {running ? "⟳  COMPILING..." : "▶  RUN PIPELINE"}
            </button>
          </div>
        </div>

        <div style={{ marginBottom:20 }}>
          <div style={{ fontSize:11, color:"#64748b", letterSpacing:1, marginBottom:10 }}>PIPELINE STAGES</div>
          <div style={{ display:"flex", gap:10, alignItems:"stretch" }}>
            {STAGE_META.map((meta,i) => (
              <div key={meta.id} style={{ display:"flex", alignItems:"center", gap:10, flex:1, minWidth:0 }}>
                <StageCard meta={meta} stage={stages[meta.id]} onClick={setActivePanel} isActive={activePanel===meta.id} />
                {i < STAGE_META.length-1 && <div style={{ color:"#1e293b", fontSize:18, flexShrink:0 }}>→</div>}
              </div>
            ))}
          </div>
          {(stages.generation.status==="running"||stages.generation.status==="done") && (
            <div style={{ marginTop:10, background:"#0f172a", border:"1px solid #1e293b", borderRadius:8, padding:"12px 16px" }}>
              <div style={{ fontSize:11, color:"#64748b", marginBottom:10, letterSpacing:1 }}>SCHEMA GENERATION · SUB-STAGES</div>
              <div style={{ display:"flex", gap:10 }}>
                {["db","api","ui","auth"].map(sub => (
                  <div key={sub} style={{ flex:1, padding:"8px 12px", borderRadius:6, textAlign:"center", background:subColor(stages.generation.sub?.[sub]||"idle")+"15", border:`1px solid ${subColor(stages.generation.sub?.[sub]||"idle")}33` }}>
                    <div style={{ fontSize:10, color:subColor(stages.generation.sub?.[sub]||"idle"), letterSpacing:1 }}>{STATUS_LABEL[stages.generation.sub?.[sub]||"idle"]}</div>
                    <div style={{ fontSize:12, color:"#94a3b8", marginTop:3 }}>{sub==="db"?"Database":sub==="api"?"REST API":sub==="ui"?"UI/Pages":"Auth/Perms"}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {metrics && (
          <div style={{ background:"#0f172a", border:"1px solid #1e293b", borderRadius:8, padding:"12px 20px", display:"flex", gap:32, marginBottom:20, flexWrap:"wrap" }}>
            {[["Total Time",`${(metrics.total_ms/1000).toFixed(2)}s`],["Consistency",`${metrics.consistency_score}/100`],["Exec Readiness",`${metrics.exec_readiness}/100`],["Issues Found",metrics.issues],["Repairs Made",metrics.repairs]].map(([l,v])=>(
              <div key={l}><div style={{ fontSize:10, color:"#64748b", letterSpacing:1 }}>{l}</div><div style={{ fontSize:16, color:"#06b6d4", fontWeight:700 }}>{v}</div></div>
            ))}
          </div>
        )}

        {tabs.length > 0 && (
          <div style={{ display:"flex", gap:6, marginBottom:16, borderBottom:"1px solid #1e293b", paddingBottom:12, flexWrap:"wrap" }}>
            {tabs.map(([id,label])=>(
              <button key={id} onClick={()=>setActivePanel(id)} style={{ background:activePanel===id?"#0891b2":"transparent", border:`1px solid ${activePanel===id?"#0891b2":"#1e293b"}`, color:activePanel===id?"#fff":"#64748b", fontFamily:"monospace", fontSize:11, padding:"5px 14px", borderRadius:5, cursor:"pointer", letterSpacing:0.5 }}>{label}</button>
            ))}
          </div>
        )}

        {activePanel==="output" && finalSchema && <div><div style={{ fontSize:11, color:"#64748b", letterSpacing:1, marginBottom:10 }}>FULL COMPILED SCHEMA · {(finalSchema.meta?.total_duration_ms/1000).toFixed(2)}s · {JSON.stringify(finalSchema).length.toLocaleString()} chars</div><JsonViewer data={finalSchema} maxH={500} /></div>}
        {activePanel==="intent" && stages.intent.data && (
          <div>
            <div style={{ fontSize:11, color:"#64748b", letterSpacing:1, marginBottom:10 }}>STAGE 01 · INTENT EXTRACTION · {(stages.intent.duration/1000).toFixed(2)}s</div>
            {stages.intent.data.assumptions?.length>0 && <div style={{ background:"#fef3c70f", border:"1px solid #f59e0b33", borderRadius:6, padding:"10px 14px", marginBottom:12 }}><div style={{ fontSize:11, color:"#f59e0b", marginBottom:6, letterSpacing:1 }}>ASSUMPTIONS MADE</div>{stages.intent.data.assumptions.map((a,i)=><div key={i} style={{ fontSize:12, color:"#94a3b8", marginBottom:3 }}>• {a}</div>)}</div>}
            {stages.intent.data.clarifications_needed?.length>0 && <div style={{ background:"#06b6d40a", border:"1px solid #06b6d433", borderRadius:6, padding:"10px 14px", marginBottom:12 }}><div style={{ fontSize:11, color:"#06b6d4", marginBottom:6, letterSpacing:1 }}>CLARIFICATIONS NEEDED</div>{stages.intent.data.clarifications_needed.map((c,i)=><div key={i} style={{ fontSize:12, color:"#94a3b8", marginBottom:3 }}>? {c}</div>)}</div>}
            <JsonViewer data={stages.intent.data} />
          </div>
        )}
        {activePanel==="schema" && stages.schema.data && <div><div style={{ fontSize:11, color:"#64748b", letterSpacing:1, marginBottom:10 }}>STAGE 02 · SYSTEM DESIGN · {(stages.schema.duration/1000).toFixed(2)}s</div><JsonViewer data={stages.schema.data} /></div>}
        {activePanel==="generation" && stages.generation.data && (
          <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
            {["database","api","ui","auth"].map(layer=>(
              <div key={layer}>
                <div style={{ fontSize:11, color:"#64748b", letterSpacing:1, marginBottom:8 }}>{layer.toUpperCase()} SCHEMA{layer==="database"?` · ${stages.generation.data.database?.tables?.length||0} tables`:layer==="api"?` · ${stages.generation.data.api?.endpoints?.length||0} endpoints`:layer==="ui"?` · ${stages.generation.data.ui?.pages?.length||0} pages`:` · ${stages.generation.data.auth?.roles?.length||0} roles`}</div>
                <JsonViewer data={stages.generation.data[layer]} maxH={250} />
              </div>
            ))}
          </div>
        )}
        {activePanel==="refinement" && stages.refinement.data && (
          <div>
            <div style={{ fontSize:11, color:"#64748b", letterSpacing:1, marginBottom:10 }}>STAGE 04 · LLM AUDIT · {(stages.refinement.duration/1000).toFixed(2)}s</div>
            {stages.refinement.data.cross_layer_validation && (
              <div style={{ display:"flex", gap:10, marginBottom:16, flexWrap:"wrap" }}>
                {Object.entries(stages.refinement.data.cross_layer_validation).map(([k,v])=>(
                  <div key={k} style={{ background:v?"#10b98115":"#ef444415", border:`1px solid ${v?"#10b98133":"#ef444433"}`, borderRadius:6, padding:"8px 14px" }}>
                    <div style={{ fontSize:10, color:"#64748b", letterSpacing:1 }}>{k.replace(/_/g," ").toUpperCase()}</div>
                    <div style={{ fontSize:13, color:v?"#10b981":"#ef4444", fontWeight:700 }}>{v?"✓ PASS":"✗ FAIL"}</div>
                  </div>
                ))}
              </div>
            )}
            <JsonViewer data={stages.refinement.data} />
          </div>
        )}
        {activePanel==="issues" && (
          <div style={{ display:"flex", flexDirection:"column", gap:20 }}>
            <div><div style={{ fontSize:11, color:"#64748b", letterSpacing:1, marginBottom:10 }}>CLIENT-SIDE VALIDATOR</div><IssueList issues={clientIssues} /></div>
            {stages.refinement.data?.issues_found?.length>0 && <div><div style={{ fontSize:11, color:"#64748b", letterSpacing:1, marginBottom:10 }}>LLM AUDIT ISSUES</div><IssueList issues={stages.refinement.data.issues_found.map(i=>({...i,msg:i.description}))} /></div>}
            {stages.refinement.data?.repairs_made?.length>0 && (
              <div><div style={{ fontSize:11, color:"#10b981", letterSpacing:1, marginBottom:10 }}>✓ REPAIRS APPLIED</div>
                {stages.refinement.data.repairs_made.map((r,i)=>(
                  <div key={i} style={{ background:"#10b98108", border:"1px solid #10b98133", borderRadius:6, padding:"8px 14px", marginBottom:6 }}>
                    <div style={{ fontSize:12, color:"#10b981" }}>Issue: <span style={{ color:"#94a3b8" }}>{r.issue}</span></div>
                    <div style={{ fontSize:12, color:"#10b981", marginTop:4 }}>Fix: <span style={{ color:"#94a3b8" }}>{r.action}</span></div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
