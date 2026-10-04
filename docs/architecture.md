# Architecture

WanPra is **static-first, domain-driven, and subscription-ready**. GitHub Pages is only the current delivery layer.

```text
Verified dataset -> Calendar core -> ICS exporter -> Web/PWA
                                      |
                                      +-> static subscription feeds
                                      +-> stateless custom feed (Vercel API)
```

## Boundaries
- `src/data`: versioned source records and provenance.
- `src/core`: calendar/date business rules; no DOM access.
- `src/exporters`: standards-based output such as iCalendar.
- `src/ui`: browser interaction only.
- `api`: read-only custom feed using the same dataset, core and exporter.
- `src/config.js`: verified public feed endpoint; null keeps subscription disabled.
- `scripts`: validation/build/feed generation.
- `tests`: regression gates.

The custom API reuses the same contracts without moving UI rules into the calendar core. See `custom-subscription.md` for deployment, privacy and client limitations.
