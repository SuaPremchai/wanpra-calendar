# Source verification — 2026-10-04

## Primary calendar comparison

Retrieved on 2026-10-04:

- 2569: https://myhora.com/calendar/buddhist.aspx (page title explicitly identifies 2569/2026).
- 2570: https://myhora.com/calendar/buddhist-2570.aspx.

Extracted published civil dates, lunar labels and observance remarks from the
`bud-day` rows. The tables also include non-Wan-Phra entries such as Khao Phansa;
Wan Phra comparison includes only waxing/waning 8, 14 and 15 labels.

| Year | Production Wan Phra | Reference | Date/label discrepancies |
| --- | ---: | ---: | ---: |
| 2569 / 2026 | 49 | 49 | 0 |
| 2570 / 2027 | 50 | 50 | 0 |

All 12 production Buddhist observances match the corresponding MyHora date and
remark. No dates or stable IDs changed, and no additional year was introduced.
These are table comparisons, not verification by an independent lunar algorithm.
The source's approximately 06:00–05:59 lunar-day convention is retained.

## Independent public-sector evidence

Bank of Thailand:

- https://www.bot.or.th/en/financial-institutions-holiday.html
- Calendar data: https://www.bot.or.th/content/bot/en/financial-institutions-holiday/jcr:content/root/container/holidaycalendar.model.2026.json
- Notification No. 31/2568, section 4, page 2:
  https://www.bot.or.th/content/dam/bot/fipcs/documents/FPG/2568/EngPDF/25680162.pdf

The English PDF is explicitly an unofficial translation hosted by BOT; it is
used alongside BOT's own published calendar data, not claimed as the official
Thai-language text.

| Event | Production date | BOT evidence | Outcome |
| --- | --- | --- | --- |
| Makha Bucha | 2026-03-03 | Tuesday 3 March | Matches |
| Visakha Bucha | 2026-05-31 | Sunday 31 May, within June 1 substitution description | Matches actual observance |
| Asalha Bucha | 2026-07-29 | Wednesday 29 July (Asarnha Bucha) | Matches |

BOT's financial-institution calendar does not corroborate Khao Phansa. Its former
`cross-checked` status had no retrievable independent citation in the source
package and is corrected to `source-verified`, based on MyHora alone. Atthami and
Ok Phansa 2026 also remain verified against the primary source only. All 2027
important-day statuses remain `provisional-source-verified`; this audit does not
claim contemporary official corroboration for them.

## Evidence and gate

`tests/fixtures/source-verification-2026-10-04.json` stores extracted reference
facts, retrieval date, source URLs and SHA-256 fingerprints of the retrieved
HTML/calendar data/PDF. It does not include source scripts, tracking or full pages.
`tests/provenance.test.mjs` checks every production Wan Phra date/label and every
observance against that evidence. The dataset gate rejects missing/unknown source,
missing status, unsubstantiated cross-check source, unsupported years and count
mismatches. Future retrieval of the unversioned 2569 URL must verify the page year.

Dataset version is `2026.10.04.2`, revision 2; feed identities remain unchanged.
Metadata changes and the Khao Phansa status correction are reflected in regenerated
feeds with the same publication timestamp, so repeated generation is deterministic.
