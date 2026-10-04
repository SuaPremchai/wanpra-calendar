# WanPra — Thai Buddhist Calendar

Production-grade static-first calendar project designed for GitHub Pages.

## What it does
- Wan Phra calendar (verified coverage currently 2569–2570)
- Optional Wan Kon derived from verified Wan Phra dates
- Buddhist important days with source-quality status
- Custom reminder day/time in `Asia/Bangkok`
- Client-side `.ics` generation
- Static subscription feed with the recommended reminder: **1 day before at 17:00 Thailand time**
- PWA install support
- Optional stateless Custom Subscription feed; no account, database or analytics
- Subscription settings are sent in the feed URL; personal calendar contents are not uploaded

QA coverage, production checks and pending native-client acceptance: [`docs/qa.md`](docs/qa.md).

## Quality gates
```bash
npm ci
npm run check
npx playwright install --with-deps chromium
npm run test:e2e
```
Runs dataset validation, Node tests including independent ICS parsing and source-evidence comparisons, deterministic build, dist integrity checks and browser regressions under a project subpath.

## Local development
Serve the repository over HTTP (service workers/modules do not work correctly from `file://`):
```bash
python -m http.server 8080
```
Open `http://localhost:8080`.

## GitHub Pages
The repository contains `.github/workflows/pages.yml`. Enable **Settings -> Pages -> Source: GitHub Actions** once. Every push to `main` runs CI and deploys `dist/`.

## Subscription
Default feed: `feeds/wanpra-default.ics`
- Wan Phra + Buddhist important days
- reminder: previous day 17:00 Asia/Bangkok

`feeds/wanpra-only.ics` contains Wan Phra only.

Custom Subscription deployment and activation gate: [`docs/custom-subscription.md`](docs/custom-subscription.md).

## Voluntary project support

The footer links to `support.html`. It requires fresh age-policy and voluntary-support acknowledgement before displaying the owner-authorized public recipient. See [`docs/support-page.md`](docs/support-page.md) for privacy, navigation and legal limits.

## Architecture
See `docs/architecture.md`. Data policy is documented in `docs/data-sources.md`.

Live site: https://suapremchai.github.io/wanpra-calendar/
Source audit: [`docs/data-verification-2026-10-04.md`](docs/data-verification-2026-10-04.md).
Calendar client limitations and manual steps: [`docs/icalendar-interoperability.md`](docs/icalendar-interoperability.md).
Browser tests: [`docs/browser-testing.md`](docs/browser-testing.md).

## License
MIT.

## Codex Cloud / coding-agent handoff
Agent rules live in [`AGENTS.md`](AGENTS.md). Cloud implementation and verification tasks are defined in [`docs/CODEX_CLOUD_HANDOFF.md`](docs/CODEX_CLOUD_HANDOFF.md).
