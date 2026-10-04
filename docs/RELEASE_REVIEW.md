# Cloud handoff release review — 2026-10-04

Deployment: https://suapremchai.github.io/wanpra-calendar/
Repository: https://github.com/SuaPremchai/wanpra-calendar

## Result

WanPra remains a static, client-side PWA under the GitHub Pages project path.
Supported coverage remains 2569–2570: 99 Wan Phra records and 12 important-day
records. No calendar date or stable event ID changed. Calendar-client notification
delivery and native installation are explicitly not claimed as verified.

## Changes

- `package.json`, lockfile, Playwright config, test server, E2E suite and CI/Pages
  workflows: reproducible clean installs; deployment requires unit and browser
  quality gates. Playwright and `ical.js` are development-only dependencies.
- Dataset, source docs, factual evidence fixture, provenance tests and dataset
  validator: full MyHora date/label comparison; BOT citations for three 2026
  observances; Khao Phansa status corrected to primary-source verification only.
  All 2027 observances stay provisional. Dataset revision 2 regenerates both feeds.
- ICS exporter and interoperability tests/docs: independent parser verification,
  deterministic feeds, UTC alarms, stable UIDs and mixed-newline escaping.
- `index.html`, `src/ui/app.js`, `styles.css`, `sw.js`: Thai install/remove,
  subscribe/unsubscribe and Android import guidance; correct install fallback;
  visible keyboard focus for morning reminders; readable dark-theme panels;
  scope-specific cache cleanup and version bump so existing installs update.
- README, browser testing docs and release checklist: reproducible commands and
  explicit scope of automated versus manual verification.

## Validation

Required final commands:

```sh
npm ci
npm run check
npm run test:e2e
```

Regression suite: 17 Node tests and 21 Chromium browser cases across desktop,
iPhone-width and Android device settings. Browser cases include project-subpath
loading/refresh, categories, custom download/reminders/persistence, themes/mobile
overflow, manifest/worker scope, offline reload, cache isolation, keyboard focus
and reduced motion. Source comparisons cover all 99 dates/lunar labels and all
12 important-day records. Feed comparison is byte-for-byte deterministic.

Stage A clean-source check and CI passed. Stage B live assets and both feeds
returned HTTP 200 with no browser console/page errors. Stage C browser tests
passed locally and on GitHub CI. Final CI/deployment outcomes are recorded in
GitHub Actions and must be green before this revision is considered released.

## Limits

- Real Apple Calendar, Google Calendar and Outlook import/subscription, alarm
  delivery and refresh/deduplication await the documented manual client tests.
- Chromium phone emulation does not verify Safari or native PWA installation.
- Only Makha, Visakha and Asalha Bucha 2026 have independent BOT corroboration.
  Other 2026 observances use MyHora only; 2027 observances remain provisional.
- PWA removal and calendar unsubscribe/import removal are separate operations.
  Imported files are snapshots and repeated imports can duplicate events.
- No accounts, backend, analytics, tracking or personal-data upload was added.

## Rollback

Revert the affected application change on `main`, retain the audited source
metadata and stable UIDs, bump the service-worker cache version, run both quality
gates and redeploy through the Pages workflow. Do not force-push history or delete
the repository. If a feed needs a correction, increase dataset revision and
publication timestamp, regenerate feeds and recheck; do not reset event UIDs or
decrease SEQUENCE. Calendar clients may take time to refresh subscribed feeds.
