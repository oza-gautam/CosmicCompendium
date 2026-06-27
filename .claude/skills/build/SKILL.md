---
name: build
description: Devin-style agentic build flow. Reviews requirements, designs solution, gets user approval, then builds end-to-end autonomously — tests, code review, commit, docker rebuild, and handoff report. Usage: /build <feature-or-issue-description>
---

You are operating in **autonomous build mode**. Follow this exact flow. Do not skip phases. Do not ask for tool approvals — execute all tools directly.

The user has invoked: /build $ARGUMENTS

---

## PHASE 1 — UNDERSTAND

Work autonomously. No user input yet.

1. Read the GitHub issue or feature description from `$ARGUMENTS`. If it references an issue number, fetch it with `gh issue view <N>`.
2. Read the implementation plan in `docs/implementation_plans/` if one exists for this feature.
3. Read all files directly relevant to the feature area: API module, web pages, types, DTOs, existing tests.
4. Read `CLAUDE.md` for architecture constraints and coding conventions.
5. Read `packages/types/src/` for existing shared types.
6. Trace the full data flow: database table → API endpoint → frontend page.

Produce an internal understanding. Do not output it yet — move to Phase 2.

---

## PHASE 2 — DESIGN & PLAN

Produce a single, structured design document in your response. Include all of the following:

### 2a. Problem Statement
One paragraph: what this feature does and why it matters.

### 2b. Architecture Overview (Mermaid)
```mermaid
graph TD showing the data flow end to end
```

### 2c. Database Changes
Table: column name | type | constraints | migration number

### 2d. API Changes
Table: method | endpoint | auth | request shape | response shape

### 2e. UI Changes
ASCII mockup of any new or changed pages/components.

### 2f. User Interaction Flow (Mermaid)
```mermaid
sequenceDiagram showing user actions and system responses
```

### 2g. Implementation Plan
Numbered list of every file to create or modify, with one-line description of the change.

### 2h. Test Plan
Bullet list of unit + integration tests to write.

### 2i. Risk & Concerns
Any architecture misalignment, security considerations, or open questions.

---

**CHECKPOINT 1 — DESIGN REVIEW**

Ask the user:
> "Here is the design and implementation plan above. Do you want to proceed, or do you have refinements?"

Options: Proceed | Refine

If **Refine**: ask what to change, update the plan, then ask again:
> "Updated plan above. Approve to proceed?"

Options: Approve | Refine again

Do not proceed to Phase 3 until the user explicitly approves.

---

## PHASE 3 — EXECUTE (fully autonomous after approval)

Execute in this exact order. Use `bypassPermissions` semantics — call every tool without waiting for approval.

### Step 1 — Tests First
- Create test files in `apps/api/src/modules/<module>/<module>.spec.ts` and/or `apps/web/src/__tests__/`.
- Tests must cover: happy path, validation errors, auth/role guards, edge cases from the plan.
- Tests will fail at this point — that is expected.

### Step 2 — Database Migration
- Write the SQL migration file at `database/migrations/<NNN>_<name>.sql`.
- Follow existing migration numbering (check the highest existing number).
- Include rollback comment block.

### Step 3 — Shared Types
- Add/update types in `packages/types/src/`.
- Run `cd packages/types && npx tsc --noEmit` to verify.

### Step 4 — API Layer
Build in this order: DTO → Entity/Schema → Service → Controller → Module registration.
- Follow `ApiResponse<T>` envelope for all responses.
- Add `@Roles('admin')` guards where required.
- Add audit log calls via `AuditService` for admin mutations.
- Run `cd apps/api && npx nest build` after completing the API.

### Step 5 — Frontend
- Build API client methods in `apps/web/src/lib/api-client.ts`.
- Build public page(s) in `apps/web/src/app/`.
- Build admin page(s) in `apps/web/src/app/admin/`.
- Follow TailwindCSS 4 patterns from existing pages.
- Never make direct DB or storage calls from the frontend.

### Step 6 — Run Tests
```bash
cd apps/api && npx jest --testPathPattern=<module> --passWithNoTests
```
If tests fail: read the error, fix the code (not the tests unless the test logic is wrong), re-run. Repeat until all pass.

### Step 7 — Type Check
```bash
npx tsc --noEmit -p apps/api/tsconfig.json
npx tsc --noEmit -p apps/web/tsconfig.json
```
Fix all type errors before continuing.

### Step 8 — Code Review (self-review checklist)
Go through every file changed and verify:
- [ ] No direct DB calls from frontend
- [ ] No hardcoded secrets, URLs, or addresses (use `TEMPLE_INFO` from `@hcclt/utils`)
- [ ] All API inputs validated with class-validator DTOs
- [ ] Auth guards present on all protected routes
- [ ] No silent `.catch(() => {})` — use `.catch(console.error)` minimum
- [ ] `ApiResponse<T>` envelope on all API responses
- [ ] Audit logging on admin mutations
- [ ] No `console.log` left in production code
- [ ] Migration file numbered correctly and idempotent-safe

Fix anything that fails the checklist.

### Step 9 — Commit
Stage only the files changed for this feature. Write a conventional commit message.
```bash
git add <specific files>
git commit -m "feat(<module>): <description>"
```
Do NOT push. Do NOT merge. Do NOT touch develop/main.

### Step 10 — Local Rebuild
Run `.\docker\dev-start.ps1` from the repo root to force-rebuild and restart Docker. Wait for containers to be healthy before continuing.

### Step 11 — Smoke Test
```bash
curl -s http://localhost:3001/api/v1/health
curl -s http://localhost:3001/api/v1/<new-endpoint>
```
Verify the API responds correctly.

---

## PHASE 4 — HANDOFF

Write a status report to `docs/session-reports/YYYY-MM-DD-<feature-slug>.md` with:

```markdown
# Build Report — <Feature Name>
**Date:** <today>
**Branch:** <branch>
**Issue:** #<N>

## What Was Built
<bullet list of files created/modified>

## Migration
Migration NNN — <name> — applied locally via docker rebuild

## API Endpoints
<table of new endpoints>

## Manual Test Cases
Numbered list of exact steps the user should follow to verify the feature works:
1. Navigate to...
2. Click...
3. Verify...
(Include both happy path and at least 2 edge cases)

## Known Limitations
<anything deferred or not implemented>

## Next Steps
<what comes after this, if anything>
```

Then output to the user:

> **Build complete. Ready for your review.**
>
> - Branch: `<branch>`
> - Containers: running at http://localhost:3000 (web) and http://localhost:3001 (API)
> - Report: `docs/session-reports/YYYY-MM-DD-<feature-slug>.md`
>
> Follow the manual test cases in the report. When you're satisfied, let me know and I'll open the PR to `develop`.

**Wait for the user's next command. Do not open a PR unless explicitly told to.**
