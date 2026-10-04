# Release checklist

- [x] Dataset validation passes.
- [x] Known-date and source-evidence regression tests pass.
- [x] ICS UTC alarm conversion tests pass.
- [x] Generated lines respect 75-octet folding.
- [x] `dist/` contains no unexpected external dependencies.
- [x] PWA opens on mobile widths; keyboard focus and reduced-motion regression covered.
- [x] Subscription feed URL is reachable after deploy.
- [x] Automated category matrix, alarm boundary and duplicate-alarm QA.
- [x] Production QA workflow configured for post-release public endpoint checks.
- [ ] Native-client acceptance matrix in `qa.md` completed.
- [ ] iOS Apple Calendar subscription smoke test.
- [ ] Google Calendar import smoke test.
- [ ] Outlook import smoke test.
- [x] Review data-source status for future-year important dates (2027 remains provisional).

Native calendar-client checks remain pending; use the reproducible steps in
`icalendar-interoperability.md`. Chromium viewport emulation does not verify Safari
or native installation/reminder delivery.
