# iCalendar interoperability audit — 2026-10-04

## Automated evidence

`npm run check` parses both static feeds with the independent `ical.js` parser
(development only; no browser runtime dependency). Tests cover:

- 111 default events / 99 Wan Phra-only events; unique, stable UIDs.
- All-day DATE DTSTART, exclusive next-day DTEND, Gregorian semantics.
- Absolute UTC DISPLAY alarms: previous day 17:00 Bangkok = 10:00Z.
- Same-day 06:00 Bangkok = previous UTC day 23:00Z; year/month/leap boundaries.
- UTF-8 Thai text, CRLF, 75-octet folding and punctuation escaping.
- Mixed CRLF/CR/LF TEXT input is normalized before escaping, preventing a raw CR
  from introducing an unintended property.
- Static feeds reproduce byte-for-byte using versioned publication time/revision.
- A logical event keeps its UID when its date changes; SEQUENCE increments.

The wire-format audit passed. These checks do not establish native client
interoperability: Apple Calendar, Google Calendar and Outlook have not been
operated in this environment. Their treatment of imported/subscribed alarms,
refresh intervals and duplicate imports must be tested as follows.

## Reproducible client tests

Use a separate test calendar, not an existing personal calendar. Record client
name/version, device OS, local timezone, notification permissions and results.
Use https://suapremchai.github.io/wanpra-calendar/feeds/wanpra-default.ics for the
default subscription; custom reminders apply only to the downloaded file.

1. Apple Calendar: add a new calendar subscription with the HTTPS feed URL (or
   webcal URL), using a short refresh interval if offered. Inspect Thai titles,
   all-day dates and notification settings on macOS/iOS.
2. Google Calendar web: Other calendars → From URL for subscriptions. For custom
   files, Settings → Import & export → Import, selecting a dedicated test calendar.
   Confirm whether feed/import alarms are retained or calendar notification
   settings must be configured; do not infer support from successful event import.
3. Outlook: Add calendar → Subscribe from web/Internet calendar where available.
   Import a custom file into a separate test calendar. Record which Outlook
   product is used (web, new Windows, classic Windows, Mac), since flows differ.
4. Check a known event (2026-10-04) and Thai label, then inspect default alarm
   timestamp (2026-10-03 17:00 Asia/Bangkok). For delivery tests, generate a local
   fixture dated tomorrow with an alarm a few minutes ahead. Do not publish that
   synthetic fixture as production source data. Repeat in a non-Bangkok device
   timezone to distinguish absolute alarm time from local all-day display.
5. For refresh/duplicate behavior, serve a private test feed with one stable ID,
   then correct its date while keeping UID and increasing SEQUENCE/LAST-MODIFIED.
   Refresh each client and confirm one updated event. Measure actual refresh
   delay; clients may ignore X-PUBLISHED-TTL/REFRESH-INTERVAL.
6. Import the same custom file twice only in the test calendar and record whether
   duplicates result. Imported files are snapshots; do not promise update or
   deduplication semantics across clients.
7. Unsubscribe/remove the test subscription and delete the dedicated import
   calendar. Confirm events/reminders are removed and personal calendars remain.

Status: RFC/serialization and browser-download checks verified; real calendar
client import, notification delivery and feed-refresh behavior await manual tests.
