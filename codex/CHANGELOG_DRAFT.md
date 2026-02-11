# CHANGELOG DRAFT

## Theme: History panel type-safety and regression hardening
- Fixed a TypeScript typing defect in history item load flow by using explicit shared `HistoryEntry` typing.
- Added new component-level regression tests for History panel interaction and state restoration behavior.

## Theme: Session auditability
- Added Codex operational artifacts (plan, session log, decisions, checkpoints, verification evidence).

## Theme: Verification quality
- Increased test count from 84 to 87 by adding focused coverage around History panel user interaction.
- Restored full typecheck health by replacing brittle inferred typing with the shared `HistoryEntry` contract.
