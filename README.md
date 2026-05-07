# App Compiler 🔧
> Natural Language → Structured Config → Validated Schema → Executable Application

A multi-stage LLM pipeline that behaves like a compiler for software generation.

## Architecture
```
Input Prompt
  → [Stage 1] Intent Extraction     (NL → structured intent)
  → [Stage 2] System Design         (intent → entities, flows, roles)
  → [Stage 3] Schema Generation     (DB → API → UI → Auth, sequential for alignment)
  → [Stage 4] Refinement & Repair   (LLM audit + client-side cross-layer validation)
  → Final JSON Schema (execution-ready)
```

## Quick Start

### 1. Install dependencies
```bash
# Backend
npm install

# Frontend
cd frontend && npm install
```

### 2. Set environment variables
```bash
cp .env.example .env
# Add your ANTHROPIC_API_KEY to .env
```

### 3. Run
```bash
# Terminal 1: Backend API
npm start

# Terminal 2: Frontend
cd frontend && npm start
```

Open http://localhost:3000

## Project Structure
```
app-compiler/
├── pipeline/
│   ├── stage1_intent.js          # NL → structured intent
│   ├── stage2_design.js          # intent → system design
│   ├── stage3_schema/
│   │   ├── db.js                 # DB schema (PostgreSQL)
│   │   ├── api.js                # REST API schema (aligned to DB)
│   │   ├── ui.js                 # UI/pages schema (aligned to API)
│   │   └── auth.js               # Auth/permissions schema
│   ├── stage4_refinement.js      # LLM cross-layer audit + repair
│   └── validator.js              # Client-side structural validator
├── utils/
│   └── groq.js                 # Groq llama 3.3 7b
├── server/
│   ├── index.js                  # Express API server
│   └── pipeline.js               # Pipeline orchestrator
├── frontend/src/
│   └── App.jsx                   # React UI
├── schemas/
│   └── output_schema.json        # JSON Schema contract for output
├── evaluation/
│   ├── dataset.json              # 10 real + 10 edge case prompts
│   └── run_eval.js               # Evaluation runner
└── docs/
    └── architecture.md           # Full architecture documentation
```

## Run Evaluation
```bash
npm run evaluate
# Outputs results to evaluation/results.json
```

## API Endpoint
```
POST /api/compile
Content-Type: application/json

{ "prompt": "Build a CRM with login, contacts, and role-based access" }
```

## Output Schema
All 8 layers guaranteed in every response:
- `meta` — pipeline metadata, timings
- `intent` — extracted features, roles, assumptions, clarifications
- `system_design` — entities, flows, role hierarchy
- `database` — PostgreSQL tables, columns, indexes, enums
- `api` — REST endpoints with auth, roles, DB refs
- `ui` — pages, components, navigation
- `auth` — JWT strategy, roles, permissions, protected routes
- `validation` — client issues, LLM audit, consistency score, exec readiness
