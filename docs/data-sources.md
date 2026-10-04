# Data sources and quality policy

## Primary Wan Phra source
- MyHora 2569: https://myhora.com/calendar/buddhist.aspx
- MyHora 2570: https://myhora.com/calendar/buddhist-2570.aspx

MyHora explicitly documents a Thai lunar-day boundary close to sunrise / approximately 06:00–05:59. WanPra stores dates as the source publishes them and does not silently shift them at midnight.

## Cross-check policy
The 2026 Makha, Visakha and Asalha Bucha dates are cross-checked with the Bank of Thailand calendar and Notification No. 31/2568. Visakha uses the actual May 31 observance, not the June 1 substitution holiday. Khao Phansa, Atthami and Ok Phansa 2026 are verified against MyHora only. All 2027 important dates remain `provisional-source-verified`.

See [the 2026-10-04 audit](data-verification-2026-10-04.md) for retrieval URLs, comparison outcomes and the correction of Khao Phansa's unsupported cross-check status. All 99 Wan Phra dates and lunar labels and all 12 observances match the retrieved MyHora tables. Source evidence is retained as factual test fixtures with SHA-256 fingerprints.

## Coverage policy
The UI may only expose years present in the validated dataset. Do not advertise 2571+ until those years pass the same validation gate.

## Known risk
Thai lunar calendar implementations can differ by one civil day if they use different day-boundary conventions. An independent open-source dataset reviewed during development documents this exact class of mismatch. This is why WanPra treats data provenance as a first-class domain concern instead of generating all years from an unqualified lunar algorithm.
