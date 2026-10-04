# Codex Cloud Handoff — WanPra Calendar

## Objective
Take the existing WanPra production foundation and complete the tasks that require a connected GitHub/cloud/browser environment while preserving the product contract in `/AGENTS.md`.

## Target repository
Preferred repository:

```text
SuaPremchai/wanpra-calendar
```

If it does not exist and the environment has permission to create repositories, create it as a **public** repository with default branch `main`.

Do not place WanPra inside another unrelated repository.

## Stage A — Repository bootstrap
1. Initialize/publish the current project without rewriting its architecture.
2. Preserve history from the provided source package where possible.
3. Ensure default branch is `main`.
4. Add repository description suitable for a portfolio project, e.g.:
   `Production-grade Thai Buddhist calendar PWA with configurable iCalendar reminders.`
5. Recommended topics:
   `thai-calendar`, `buddhist-calendar`, `pwa`, `icalendar`, `github-pages`, `javascript`, `privacy-first`.
6. Do not add secrets or external services.

### Acceptance gate
- Repository is public and readable.
- `npm run check` passes from a clean checkout.
- No generated/editor junk is committed.

## Stage B — GitHub Pages
1. Use the included GitHub Actions Pages workflow.
2. Configure Pages to deploy through GitHub Actions if repository settings permission is available.
3. Verify production URL resolves under the repository subpath.
4. Confirm all static assets, service worker, manifest, icons, JSON data, and `.ics` feeds resolve correctly.
5. Verify a hard refresh and direct navigation do not break the site.

### Acceptance gate
- Production URL returns HTTP 200.
- No console errors on initial load.
- No 404s for required assets.
- `feeds/wanpra-default.ics` and `feeds/wanpra-only.ics` are publicly retrievable.

## Stage C — Browser E2E and PWA regression
Add lightweight browser E2E tests (Playwright is acceptable as a dev-only dependency) for:
1. Load home page at a non-root base path.
2. Toggle Wan Phra, Wan Kon, and important-day categories.
3. Change reminder day/time.
4. Confirm summary reflects settings.
5. Generate/download custom `.ics`.
6. Verify generated file contains expected VCALENDAR/VEVENT/VALARM fields.
7. Test dark/light UI if present.
8. Verify mobile viewport at common iPhone and Android widths.
9. Verify manifest and service worker registration on deployed HTTPS environment.

Do not introduce a framework migration just to add tests.

### Acceptance gate
- Existing unit tests still pass.
- E2E passes locally/CI.
- No regression to client-side-only privacy model.

## Stage D — External data verification
The current source-of-truth policy intentionally favors verified calendar tables over unreviewed lunar calculation output.

Tasks:
1. Re-check currently supported years against MyHora's Wan Phra tables.
2. Cross-check major Buddhist observances against contemporary authoritative Thai sources where available (e.g. government/official Buddhist-agency publications).
3. Record source URL/reference, retrieval date, comparison outcome, and discrepancies.
4. Update `docs/data-sources.md` and dataset metadata only when evidence supports the change.
5. Do not extend supported years unless the new year passes the verification gate.

Important known issue:
- Some algorithmic Thai Buddhist datasets differ from MyHora by one civil day because of lunar-day boundary convention. Treat this as a domain-definition issue, not a trivial off-by-one bug.

### Acceptance gate
- Every production event has traceable provenance/status.
- No unsupported dates are silently promoted to verified.
- Dataset validation and all regression tests pass.

## Stage E — iCalendar interoperability audit
Review generated and static feeds for practical compatibility with:
- Apple Calendar
- Google Calendar
- Outlook

Focus on:
- stable UID behavior
- all-day DTSTART semantics
- alarm triggers
- timezone assumptions
- UTF-8 Thai text
- CRLF and line folding
- escaping commas, semicolons, backslashes, and newlines
- duplicate behavior when a feed updates

Where exact client behavior cannot be automated, document the limitation and add reproducible manual test steps. Do not claim verified compatibility without evidence.

## Stage F — Release review
Before declaring the task complete:

```bash
npm ci
npm run check
```

Then review:
- data coverage advertised by UI vs actual dataset
- install/remove PWA guidance
- subscribe/unsubscribe guidance
- Android fallback/import wording
- privacy statement
- accessibility basics
- GitHub Pages base-path safety

Create a concise PR/release summary containing:
- changed files
- tests run/results
- data-source changes
- known limitations
- deployment URL
- rollback approach

## Explicit non-goals
Do not add the following unless separately approved:
- user accounts
- database/backend
- analytics
- push notification server
- paid services
- native iOS/Android apps
- ad SDKs
- arbitrary third-party UI/framework migration
- AI-generated future calendar dates without verification

## Definition of done
WanPra is considered ready for the next product phase when:
- GitHub repo exists and is cleanly structured.
- CI is green.
- GitHub Pages deployment is live and verified.
- browser/PWA smoke tests pass.
- `.ics` generation/feed regression tests pass.
- supported date coverage and provenance are accurate and explicit.
- no existing product flow has regressed.
