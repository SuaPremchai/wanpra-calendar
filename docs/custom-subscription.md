# Custom Subscription

Custom settings produce a persistent calendar URL. Subscribe once to keep the events in a separate calendar; unsubscribe from that calendar to remove the whole set. Importing a downloaded ICS file remains available, but imported events are managed by the calendar application and may require individual deletion.

Settings are part of the URL, not a mutable account profile. Changing categories or reminders requires unsubscribing from the previous calendar and subscribing to the new URL. Updated source dates use the existing URL and stable event UIDs after redeployment. Calendar applications control refresh timing and may ignore ICS alarms; verify notifications in the target application. Do not import the file and subscribe to the same selection simultaneously if duplicate visible events are unwanted.

## Hosting and privacy

GitHub Pages continues to serve the frontend and default static feeds. A dedicated Vercel project serves `api/calendar.js`, with `/calendar.ics` as its public route. The read-only service uses the bundled verified dataset and has no database, account, cookies or paid integrations. Hosting can start on Hobby subject to Vercel eligibility, limits and current terms; unlimited free usage is not guaranteed.

Selected categories and reminder settings travel in the URL to the host. They are not secret; hosting infrastructure may record request logs. No personal calendar contents are uploaded.

## Deployment gate

Production feed: `https://wanpra-feed.vercel.app/calendar.ics`. The user created the dedicated project after the connector returned HTTP 403. Public unauthenticated production smoke checks passed (GET, independently parsed ICS, 98 unique Wan Kon events, selected alarms, deterministic response, HEAD, ETag 304, invalid query 400 and POST 405). The frontend now uses this verified endpoint. For redeployment or a domain change, preserve the following gate:
1. Import `SuaPremchai/wanpra-calendar` into a dedicated Vercel project, for example `wanpra-feed`, using the repository root and framework Other. `vercel.json` supplies build, output and route settings. No environment variables or storage integrations are needed.
2. Use a stable, public production domain. Calendar applications cannot access protected previews or login pages. Check deployment protection for this dedicated project; never embed bypass tokens in calendar URLs.
3. Verify `/calendar.ics?v=1&wanphra=0&wankon=1&important=0&morning=0&days=2&time=19%3A30`: HTTP 200, `text/calendar`, 98 unique Wan Kon events and the selected alarms. Repeat to confirm deterministic output. HEAD must work, conditional ETag requests return 304, invalid parameters return 400 and POST returns 405.
4. Set `CUSTOM_FEED_ENDPOINT` in `src/config.js` to that verified HTTPS `/calendar.ics` URL. Increment the service worker version when changing the configuration.
5. Run `npm run check` and `npm run test:e2e`; only then merge the frontend branch and allow GitHub Pages to publish it.
6. Manually subscribe and unsubscribe on supported calendar clients. On Google Calendar, subscription is generally added through its web interface. Confirm actual alarm behavior separately from successful event subscription.

The browser test server injects a localhost endpoint and calls the real API handler. Passing these tests verifies application behavior, but does not establish successful Vercel deployment or native-client interoperability.
