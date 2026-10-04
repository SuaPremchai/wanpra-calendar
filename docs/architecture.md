# Architecture

WanPra is **static-first, domain-driven, and subscription-ready**. GitHub Pages is only the current delivery layer.

```text
Verified dataset -> Calendar core -> ICS exporter -> Web/PWA
                                      |
                                      +-> static subscription feeds
```

## Boundaries
- `src/data`: versioned source records and provenance.
- `src/core`: calendar/date business rules; no DOM access.
- `src/exporters`: standards-based output such as iCalendar.
- `src/ui`: browser interaction only.
- `scripts`: validation/build/feed generation.
- `tests`: regression gates.

A future API/native app can reuse the same contracts without moving UI rules into the calendar core.
