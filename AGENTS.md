# AGENTS.md — WanPra Calendar

## Mission
Maintain **WanPra — Thai Buddhist Calendar** as a production-grade, static-first, privacy-first web application deployable to GitHub Pages.

This is intentionally a small product with production engineering standards. Do not trade correctness, provenance, accessibility, portability, or testability for speed.

## Product contract
- Primary platform: GitHub Pages + PWA.
- Must work on iOS, Android, and desktop browsers.
- Primary calendar UX: subscribed calendar feed where supported.
- Fallback UX: user-generated/imported `.ics`.
- Default reminder: **1 day before at 17:00 Asia/Bangkok**.
- Users may customize reminder days/times for generated `.ics` files.
- Calendar categories:
  - Wan Phra (วันพระ)
  - Wan Kon (วันโกน), derived from Wan Phra
  - major Buddhist observances
- PWA and subscribed calendar must be removable/unsubscribable cleanly.
- GitHub Pages remains the static PWA. The user-authorized Custom Subscription extension adds a stateless read-only feed endpoint on Vercel Hobby; no accounts, analytics, tracking code, database, or personal-calendar upload.
- Feed preferences are encoded in a public versioned URL and sent to the feed host when a calendar retrieves it. Do not claim that subscription settings never leave the device; provider infrastructure may retain standard request logs.

- The voluntary support page publishes only the owner-confirmed public recipient. Do not collect donor identity, slips or banking credentials. Keep the 20+ project policy and fresh acknowledgement before UI reveal; do not claim that the page certifies fundraising or tax compliance.

## Data correctness rules — non-negotiable
1. Do **not** infer or fabricate Wan Phra dates.
2. Do **not** extend supported years merely because an algorithm can calculate them.
3. Supported year coverage must match verified source data in `src/data/calendar-data.json` and documented provenance.
4. Preserve source provenance, source URL/reference, verification status, dataset version, and revision metadata.
5. Thai lunar-day boundary differences are material. MyHora documents a lunar-day convention around 06:00–05:59. Do not silently replace verified dates with civil-midnight calculations.
6. Algorithmic datasets may be used for comparison/testing but must not silently become production source-of-truth if their dates diverge from the selected reference convention.
7. New years require a data-quality gate and regression tests before release.

## Architecture rules
Keep boundaries explicit:
- `src/data/` — source data and repository adapter
- `src/core/` — domain/business logic only
- `src/exporters/` — RFC 5545/iCalendar serialization
- `src/ui/` — DOM/browser interaction
- `scripts/` — build/validation/feed generation
- `tests/` — deterministic regression tests
- `api/` — stateless HTTP adapter for Custom Subscription; reuse domain logic and exporter from `src/`.

Do not move calendar math, timezone logic, or ICS serialization into UI code.

## iCalendar correctness
- Follow RFC 5545 semantics.
- Preserve stable event UIDs across date corrections/revisions whenever the logical event is the same.
- Ensure CRLF output and safe UTF-8 line folding.
- Do not assume all-day alarms are interpreted identically across clients.
- Reminder calculations must be deterministic and timezone-aware.
- Default 17:00 Thailand reminder corresponds to UTC+07:00 and must remain correct without DST assumptions.
- Avoid duplicate events during feed refreshes.

## GitHub Pages constraints
- The app must work from a project subpath such as:
  `https://SuaPremchai.github.io/wanpra-calendar/`
- Do not assume deployment at domain root.
- Assets, manifest, service worker, and feed paths must remain subpath-safe.
- Build output is `dist/`.
- CI must pass before Pages deployment.

## Quality gate
Before proposing a merge or release, run:

```bash
npm run check
```

Also perform browser smoke/E2E tests for the main user flows when tooling is available.

Required regression coverage includes:
- dataset validation
- Wan Kon derived correctly even when Wan Phra display is disabled
- year boundaries
- leap-date handling where relevant
- reminder date rollovers across month/year boundaries
- 17:00 Asia/Bangkok alarm conversion
- stable UIDs
- RFC 5545 folding/escaping
- deterministic generated feeds
- GitHub Pages subpath loading

## UX/accessibility
- Mobile-first responsive UI.
- Keyboard-accessible controls.
- Maintain visible focus states.
- Do not communicate state using color alone.
- Honor reduced-motion where animation exists.
- Thai copy is the primary user-facing language; technical docs may be English.

## Security/privacy
- No secrets in the client or repository.
- No remote analytics/tracking scripts.
- Keep CSP restrictive where GitHub Pages allows it.
- Do not add third-party runtime dependencies unless there is a concrete, reviewed benefit.
- Prefer browser-native APIs and zero-dependency modules for the current scope.

## Change discipline
For every non-trivial change:
1. Inspect current behavior and tests.
2. Make the smallest coherent change.
3. Add/update tests.
4. Run `npm run check`.
5. Review impact on existing flows and business rules.
6. Summarize changed files, risks, and regression status.

Do not delete working features, source provenance, tests, or documentation as cleanup unless explicitly justified.

## Current release posture
Current production data coverage is intentionally limited. Do not advertise unsupported future years until their data passes the verification gate.
