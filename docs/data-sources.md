# Data sources and quality policy

## Primary Wan Phra source
- MyHora 2569: https://myhora.com/calendar/buddhist.aspx
- MyHora 2570: https://myhora.com/calendar/buddhist-2570.aspx

MyHora explicitly documents a Thai lunar-day boundary close to sunrise / approximately 06:00–05:59. WanPra stores dates as the source publishes them and does not silently shift them at midnight.

## Cross-check policy
Selected **2569 / 2026** major Buddhist dates are cross-checked with contemporary Thai public-sector sources before being marked `cross-checked`. Future-year important dates may be marked `provisional-source-verified` until contemporary official calendars are available.

## Coverage policy
The UI may only expose years present in the validated dataset. Do not advertise 2571+ until those years pass the same validation gate.

## Known risk
Thai lunar calendar implementations can differ by one civil day if they use different day-boundary conventions. An independent open-source dataset reviewed during development documents this exact class of mismatch. This is why WanPra treats data provenance as a first-class domain concern instead of generating all years from an unqualified lunar algorithm.
