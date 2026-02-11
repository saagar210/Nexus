# DECISIONS

## 2026-02-10 - D-001: Scope reduction to high-confidence type-safety fix
- Context: Baseline verification shows one failing command (`pnpm typecheck`) while tests are fully green.
- Decision: Prioritize a minimal, reversible fix in `HistoryPanel.vue` instead of broad refactors.
- Rationale:
  - Directly tied to observed repository failure.
  - Low-risk and high-value (restores static safety gate).
  - Avoids speculative architecture churn.
- Alternatives considered:
  1. Relax typecheck strictness (rejected: weakens guarantees).
  2. Ignore error with type assertion `as any` (rejected: hides defect).
  3. Refactor history store shape (rejected: unnecessary blast radius).
