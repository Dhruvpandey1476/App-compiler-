# App Compiler — Architecture

## Overview
A multi-stage LLM pipeline that converts natural language into a validated, executable application schema. Modeled after compiler design: parse → analyze → codegen → optimize.

## Pipeline Stages

```
User Input
    │
    ▼
[Stage 1] Intent Extraction
    │  NL → Structured Intent JSON
    │  Extracts: features, roles, rules, assumptions, clarifications
    │
    ▼
[Stage 2] System Design
    │  Intent → Architecture
    │  Produces: entities, flows, role hierarchy, data model
    │
    ▼
[Stage 3] Schema Generation (4 sequential layers)
    │  a) DB Schema   — tables, columns, indexes, enums
    │  b) API Schema  — endpoints aligned to DB tables
    │  c) UI Schema   — pages/components aligned to API endpoints
    │  d) Auth Schema — roles, permissions, protected routes
    │
    ▼
[Stage 4] Refinement & Repair
       LLM audits all layers for cross-layer inconsistencies
       + Client-side structural validator (zero latency)
       Reports: issues found, repairs made, consistency score, exec readiness
```

## Why Sequential (not parallel) in Stage 3?
Each layer feeds the next to enforce alignment:
- DB defines the data contract
- API is generated knowing exact DB tables (so db_tables refs are valid)
- UI is generated knowing exact API endpoints (so component endpoints are valid)
- Auth is generated last knowing all roles from intent + design

## Validation Engine (Dual Layer)
1. **Client-side validator** (`pipeline/validator.js`): Fast structural checks
   - API endpoint references → DB tables (all must exist)
   - UI component endpoints → API paths (all must exist)
   - Auth roles → Intent roles (must be consistent)
   - DB tables → required columns (id, created_at)

2. **LLM audit** (`pipeline/stage4_refinement.js`): Semantic checks
   - Cross-layer logical consistency
   - Orphaned entities
   - Business rule enforcement
   - Outputs: issues[], repairs[], consistency_score, execution_readiness

## Output Contract
Defined in `schemas/output_schema.json`. All 6 layers required:
- meta, intent, system_design, database, api, ui, auth, validation

## Execution Readiness
Output maps directly to real runtimes:
- `database.tables` → Prisma schema / SQL migrations
- `api.endpoints` → Express/Fastify route definitions
- `ui.pages` → React Router + component scaffold
- `auth` → JWT middleware + RBAC rules

## Failure Handling
- Vague prompts → `clarifications_needed[]` populated in intent
- Conflicting requirements → assumptions documented, most conservative interpretation used
- JSON parse failures → regex fallback extraction, then retry up to 2x
- Cross-layer mismatches → documented in validation, repaired where possible

## Cost vs Quality Tradeoff
| Approach | Calls | Latency | Consistency |
|----------|-------|---------|-------------|
| Single prompt | 1 | ~5s | Low (~40%) |
| This pipeline | 6 | ~30-60s | High (~85%) |

The 6x latency cost buys cross-layer alignment and repair. For production use, stage 3 layers could be parallelized (losing alignment guarantees) or cached by intent hash.
