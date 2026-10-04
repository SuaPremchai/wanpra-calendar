---
name: Codex Cloud production task
description: Production-grade implementation or verification task for WanPra
labels: ["engineering", "quality"]
---

## Objective

Describe the exact change or verification target.

## Constraints

- Follow `/AGENTS.md`.
- Preserve static-first GitHub Pages architecture.
- Do not extend calendar coverage without source verification.
- Do not remove existing functionality without explicit justification.

## Acceptance criteria

- [ ] Implementation is scoped and documented.
- [ ] Tests added/updated.
- [ ] `npm run check` passes.
- [ ] Existing user flows reviewed for regression.
- [ ] Data provenance updated if calendar data changed.
- [ ] GitHub Pages/subpath behavior verified if web assets changed.
- [ ] Known limitations documented.

## Verification evidence

Commands, screenshots, URLs, data-source comparisons, or client test notes.
