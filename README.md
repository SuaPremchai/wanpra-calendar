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
- No account, backend, analytics, or user-data upload

## Quality gates
```bash
npm run check
```
Runs dataset validation, Node test suite, deterministic build, and dist integrity checks.

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

## Architecture
See `docs/architecture.md`. Data policy is documented in `docs/data-sources.md`.

## License
MIT.

## Codex Cloud / coding-agent handoff
Agent rules live in [`AGENTS.md`](AGENTS.md). Cloud implementation and verification tasks are defined in [`docs/CODEX_CLOUD_HANDOFF.md`](docs/CODEX_CLOUD_HANDOFF.md).
