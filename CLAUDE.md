# Disinfection Benchmark Modeling Workbench — Agent Ruleset

## 1. Project Identity

**Product:** Disinfection Benchmark Modeling Workbench
**Purpose:** A scientific data analysis tool for water/wastewater treatment engineers and lab scientists. Users import time-series disinfection experiment data (time, disinfectant concentration, CFU counts), fit kinetic inactivation models to that data, and export calibrated model parameters and reports for regulatory and internal review.

**Primary users:** Lab scientists and process engineers at water utilities (e.g. HRSD). Reports are shared with internal reviewers and external stakeholders.

**Stack:**
- Backend: Python 3.11 · FastAPI · SQLite (via `backend/db/database.py`) · scipy (curve fitting) · openpyxl (Excel export)
- Frontend: Next.js 16 · React 18 · TypeScript · Tailwind CSS · Plotly.js
- Dev: uvicorn --reload on port 8000 · Next.js dev on port 3000

**Key model:** Two-Population ICT — `N/N₀ = (1−β)·exp(−kd·ICT^m) + β·exp(−kp·ICT)`
- ICT = cumulative disinfectant exposure (mg·min/L), computed via trapezoidal integration
- Parameters: β (resistant fraction), kd (dominant decay rate), kp (persistent decay rate), m (power-law shape)
- Fitting: scipy `least_squares` with 8 multi-start seeds in log₁₀ space

**DB tables:** `projects`, `samples`, `observations`, `model_fits`, `import_templates`, `fit_events`

---

## 2. Hard Constraints

- **Never commit** `.env`, `*.db`, `__pycache__/`, or any file with credentials.
- **Never hardcode** API keys, file paths, or port numbers — load from environment.
- **Never silently skip rows** during Excel/CSV import — raise a clear error listing offending rows.
- **Never hit external APIs** in tests — mock all network calls.
- **Frontend never calls the DB directly** — all data flows through FastAPI endpoints.
- **All DB schema changes** must handle the "table already exists" case — use `CREATE TABLE IF NOT EXISTS` and `ALTER TABLE … ADD COLUMN` wrapped in try/except for idempotency.
- **Y axis on all plots** must use raw CFU values on a log₁₀ scale (`type: "log"` in Plotly). `tickvals` must be raw values `[1, 10, 100, …]`, NOT exponents. Range `[0, 6]` is in log₁₀ space and is correct.
- **Prediction curve N₀** must use the **median** N₀ across pooled samples — not geometric mean — to handle mixed sample sizes.
- **Parameter reset guard:** use `initializedModelId` ref to prevent `useEffect` from resetting params on every models-state update.

---

## 3. Coding Conventions

**Python (backend):**
- All Pydantic models extend `_Base` (defined in `schemas.py`) which sets `model_config = ConfigDict(protected_namespaces=())` — never subclass `BaseModel` directly.
- Router files live in `backend/routers/`. Register new routers in `backend/main.py`.
- DB access: call `get_connection()` from `backend/db/database.py`, always `conn.close()` after use.
- Journal events: write to `fit_events` table after every fit (both individual and pooled), after Excel import, and after CSV upload.
- JSON fields stored in SQLite (parameters, statistics, quality_score, diagnostics, metadata) are serialized with `json.dumps` on write and `json.loads` on read.

**TypeScript / React (frontend):**
- Shared types live in `frontend/src/types/index.ts`. API client methods live in `frontend/src/lib/api.ts`.
- Components go in `frontend/src/components/`. Page files in `frontend/src/app/`.
- State that gates all downstream computation (chart, Calculated N, pooled fit) uses `activeSamples` — derived from `allSamples` filtered by `pooledSampleIds` Set when in pooled mode.
- `rowOverrides: Record<number, Record<number, string>>` on `PendingSample` tracks inline cell edits in the Excel import Step 4 review screen.
- InitMode has three values: `"auto"` (optimizer picks seeds), `"manual"` (user seeds optimizer), `"fixed"` (skip optimizer entirely, use params as-is).
- Always run `npx tsc --noEmit` in `frontend/` before reporting a task done.

**General:**
- No speculative features, no premature abstractions, no error handling for impossible scenarios.
- Touch only what the task requires — do not clean up adjacent code.
- Match existing style in whatever file you are editing.
- Comments only when the WHY is non-obvious (hidden constraint, workaround, subtle invariant).

---

## 4. Reference Index

- Backend entry point — `backend/main.py`
- DB schema & migrations — `backend/db/database.py`
- All Pydantic schemas — `backend/schemas.py`
- Fitting logic (scipy, multi-start, quality score) — `backend/routers/fitting.py`
- Excel import router — `backend/routers/excel.py`
- Journal endpoints — `backend/routers/journal.py`
- Excel report generator (openpyxl, 8 sheets) — `backend/routers/report.py`
- Main workbench page — `frontend/src/app/projects/[id]/samples/[sid]/page.tsx`
- Plotly chart component — `frontend/src/components/PlotlyChart.tsx`
- Excel import modal — `frontend/src/components/ExcelImportModal.tsx`
- Step 4 review (inline editing) — `frontend/src/components/excel/Step4Review.tsx`
- Process Journal tab — `frontend/src/components/JournalTab.tsx`
- Shared TypeScript types — `frontend/src/types/index.ts`
- API client — `frontend/src/lib/api.ts`

---

## 5. Behavior Rules

**Think before coding.** State assumptions explicitly before implementing. If multiple interpretations exist, surface them — don't pick silently.

**Simplicity first.** Minimum code that solves the problem. No features beyond what was asked. If you write 200 lines and it could be 50, rewrite it.

**Surgical changes.** Touch only what you must. Don't improve adjacent code. Match existing style even if you'd do it differently. Every changed line must trace directly to the request.

**Verify after every step.** Run `npx tsc --noEmit` after frontend changes. Run `python -c "from backend.main import app"` after backend changes. Do not report done until both pass.
