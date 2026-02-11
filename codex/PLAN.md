# DELTA PLAN

## A) Executive Summary

### Current state (repo-grounded)
- Electron + Vue + TypeScript architecture with explicit main/renderer/shared boundaries (`electron/main`, `src`, `shared`).
- Shared type-safe IPC contract is centralized in `shared/ipc-channels.ts` and domain types in `shared/ipc-types.ts`.
- History state is managed in Pinia setup store (`src/stores/history.ts`) with ref-backed entries and computed filters.
- History UI composition sits in `src/components/history/HistoryPanel.vue` and `HistoryItem.vue`.
- Unit test suite is comprehensive and currently green at 84 tests (`tests/unit/**`).
- Baseline static type verification fails on `HistoryPanel.vue` function signature using `.value` on store-unwrapped array.

### Key risks
- Leaving baseline typecheck red weakens CI confidence and future refactor safety.
- Incorrect store typing in UI layer can mask runtime data assumptions.
- History panel currently has no dedicated component regression tests for load-from-history behavior.

### Improvement themes (prioritized)
1. Restore static type correctness in History panel loading path.
2. Add focused regression test coverage for history interaction contract.
3. Maintain auditable session artifacts and checkpoints for interruption-safe resume.

## B) Constraints & Invariants (Repo-derived)
- Must preserve IPC contracts and database schema unchanged for this delta.
- Must not alter request execution semantics (method/url/header/body mapping from history reload).
- Inferred invariant: history click should repopulate request store and response store consistently with stored entry shape.
- Non-goals:
  - No redesign of history UX.
  - No store architecture refactor.
  - No persistence-layer or migration work.

## C) Proposed Changes by Theme (Prioritized)

### Theme 1: Type correctness in `HistoryPanel`
- Current approach: function parameter typed as `typeof historyStore.entries.value[0]`.
- Proposed change: use explicit `HistoryEntry` type import for parameter.
- Why: compatible with Pinia auto-unwrapped refs and stable against store implementation details.
- Tradeoffs: tighter explicit type coupling to shared contract, but contract is already source of truth.
- Scope boundary: one component only.
- Migration approach: direct edit + typecheck validation.

### Theme 2: Regression test for history load behavior
- Current approach: store tests exist; no component test for `HistoryPanel` click-to-load flow.
- Proposed change: add `tests/unit/components/HistoryPanel.test.ts` covering:
  - rendering entries
  - click event invokes state restoration in request/response stores
- Why: protects core workflow and prevents recurrence of typing/interaction drift.
- Tradeoffs: slightly more test maintenance.
- Scope boundary: one new test file, no production behavior expansion.
- Migration approach: introduce with test stubs/mocks consistent with existing test style.

### Theme 3: Auditable operational artifacts
- Current approach: no codex session artifacts in repo.
- Proposed change: add/update `codex/*.md` planning + logs for this run.
- Why: interruption/resume clarity and evidence trail.
- Tradeoffs: additional documentation files.
- Scope boundary: codex folder only.

## D) File/Module Delta (Exact)
- ADD:
  - `codex/SESSION_LOG.md` — run log + execution gate.
  - `codex/PLAN.md` — delta plan.
  - `codex/DECISIONS.md` — key judgment calls.
  - `codex/CHECKPOINTS.md` — checkpoint trail + rehydration blocks.
  - `codex/VERIFICATION.md` — verification evidence.
  - `codex/CHANGELOG_DRAFT.md` — delivery summary draft.
  - `tests/unit/components/HistoryPanel.test.ts` — regression tests for history panel behavior.
- MODIFY:
  - `src/components/history/HistoryPanel.vue` — replace brittle inferred parameter type with explicit shared domain type.
- REMOVE/DEPRECATE:
  - None.
- Boundary rules:
  - Allowed: component may import types from `@shared/ipc-types`.
  - Forbidden: no changes to IPC channel map or DB layer in this delta.

## E) Data Models & API Contracts (Delta)
- Current: `HistoryEntry` defined in `shared/ipc-types.ts` and used across IPC + renderer.
- Proposed: no schema shape change; only stronger typing reference in component.
- Compatibility: fully backward/forward compatible (no runtime contract change).
- Migrations: none.
- Versioning strategy: N/A (internal contract unchanged).

## F) Implementation Sequence (Dependency-Explicit)
1. **Step S1**
   - Objective: Fix History panel parameter typing.
   - Files: `src/components/history/HistoryPanel.vue`.
   - Preconditions: baseline error confirmed.
   - Dependencies: `HistoryEntry` shared type.
   - Verification: `pnpm typecheck`.
   - Rollback: revert component edit.
2. **Step S2**
   - Objective: Add regression component tests for history click flow.
   - Files: `tests/unit/components/HistoryPanel.test.ts`.
   - Preconditions: S1 complete.
   - Dependencies: Pinia test setup and store contracts.
   - Verification: `pnpm test -- tests/unit/components/HistoryPanel.test.ts`.
   - Rollback: remove new test file if unstable.
3. **Step S3**
   - Objective: Full verification + docs/changelog refresh.
   - Files: `codex/*.md`.
   - Preconditions: S1/S2 green.
   - Dependencies: none.
   - Verification: `pnpm test && pnpm typecheck`.
   - Rollback: if failures arise, back out last step and isolate.

## G) Error Handling & Edge Cases
- Current pattern: parse JSON fields from history with local `try/catch` ignore on malformed payloads.
- Proposed improvement: preserve existing error tolerance; only type-level correction and behavior test.
- Edge cases to validate:
  - history entry with no response status should not set success response fields.
  - malformed headers JSON should not crash load path.
  - response error should populate response store error.

## H) Integration & Testing Strategy
- Integration points:
  - `HistoryPanel` ↔ `history`, `request`, `response` stores.
- Unit tests to add:
  - component render and click behavior in new `HistoryPanel.test.ts`.
- Regression checks:
  - full `pnpm test` and `pnpm typecheck`.
- Definition of Done:
  - baseline typecheck issue resolved.
  - new component tests pass reliably.
  - no existing tests regress.

## I) Assumptions & Judgment Calls
- Assumption: existing `.value` usage is accidental and not intentional store exposure contract.
- Assumption: no hidden runtime reliance on the function parameter’s current inferred form.
- Judgment call: prioritize targeted fix + tests over larger history module refactor.
- Alternative rejected: broad typing cleanup across all components in one pass (scope creep risk).
