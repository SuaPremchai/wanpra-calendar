# Browser regression

Run `npm ci`, `npx playwright install --with-deps chromium`, `npm run check`, then
`npm run test:e2e`. The test server intentionally serves only `/wanpra-calendar/`.
CI and Pages deployment both require these checks to pass.

To test deployed HTTPS, use
`E2E_BASE_URL=https://suapremchai.github.io/wanpra-calendar/ npm run test:e2e`.
`PLAYWRIGHT_EXECUTABLE_PATH` optionally selects an installed Chromium executable.
Keep TLS verification enabled; environments with an HTTPS proxy must configure
Chromium to trust the environment's CA before running the HTTPS suite.

The suite checks category selection including independent Wan Kon, empty
selection, reminders and settings persistence, downloaded ICS content and UTF-8
folding, presets, themes, mobile overflow, manifest scope and service worker.
iPhone and Android projects exercise their viewport/device settings in Chromium;
they do not establish Safari, native installation or calendar-client compatibility.

## Stage B verification — 2026-10-04

- Pages run 37194041120, attempt 2: successful deployment.
- Home, direct `index.html`, stylesheet, JS modules, dataset, manifest, service
  worker, all three PNG icons, SVG icon and both ICS feeds returned HTTP 200.
- Chromium browser smoke: initialized UI, no page/console errors, reload works
  under the repository subpath. Environment proxy CA was trusted explicitly.
