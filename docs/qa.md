# QA and release checks

## Automated gates

`npm run check` validates source provenance, coverage, independent ICS parsing, UTF-8 folding, date boundaries, deterministic output and the real HTTP adapter. Subscription regressions cover every nonempty category combination, stable UIDs across profiles, midnight and late-night alarms, 30-day year rollover, morning alarm deduplication, cache isolation, weak/list/wildcard ETags and noncacheable errors.

`npm run test:e2e` exercises desktop, iPhone-width and Android-width Chromium: selection, persisted settings, download content, subscription URL and real endpoint, stale-profile reset, denied clipboard permission, unconfigured service fallback, offline generation, reload, service worker migration, keyboard interaction and layout. CI and Pages release require these gates. Failed browser runs retain traces for seven days.

`npm run qa:production` checks the public Pages frontend and configured Vercel feed without authentication: matching dataset revision, independent calendar parsing, three different selections, exact event identities, chosen alarm times, no duplicate alarms, deterministic refresh, profile cache isolation, HEAD, conditional requests and invalid settings. The Production QA workflow runs after successful Pages releases and can also be started manually. It retries briefly because the two hosts deploy independently. This detects deployment problems after release; it is not a substitute for the pre-release gates or an automatic rollback.

Support-page QA also covers age-policy gating, fresh acknowledgement, exact clipboard digits, permission-denied fallback, withdrawal, reload/back reset and official external links. These checks do not certify legal compliance or verify a donor’s age.

## Native-client acceptance (manual, pending)

Chromium device emulation does not verify Safari or native calendar behavior. Record device/OS/client version and results before claiming support for notification delivery:

| Flow | Apple Calendar on iPhone | Google Calendar web + Android | Outlook |
| --- | --- | --- | --- |
| Add custom subscription as a separate calendar | Pending | Pending | Pending |
| Verify chosen categories and event dates | Pending | Pending | Pending |
| Verify a real notification at the chosen Bangkok time | Pending | Pending | Pending |
| Refresh the same URL without duplicate events | Pending | Pending | Pending |
| Change settings: unsubscribe old, subscribe new | Pending | Pending | Pending |
| Unsubscribe: all subscribed events disappear | Pending | Pending | Pending |
| Import fallback and remove imported items | Pending | Pending | Pending |

For refresh testing, use a separate staging calendar and a documented fixture revision rather than changing verified production dates. Alarm support and feed refresh schedules are controlled by each client. Report unsupported alarms explicitly. Never suggest that deleting the PWA removes subscribed calendars or individually imported events. Use `icalendar-interoperability.md` for platform instructions.

## QA addition — 2026-10-04

Found and corrected overlapping alarm output when a user selects same-day 06:00 and also enables the morning reminder. That event now has one alarm at the selected instant. Event UIDs and verified dates are unchanged.
