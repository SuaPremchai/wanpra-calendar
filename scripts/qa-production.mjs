import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import ICAL from 'ical.js';
import { CUSTOM_FEED_ENDPOINT } from '../src/config.js';
import { SUPPORT_PAYMENT } from '../src/support-config.js';
import { buildSubscriptionUrl } from '../src/core/subscription.js';
import { buildCalendarEvents } from '../src/core/calendar.js';

const site = 'https://suapremchai.github.io/wanpra-calendar/';
const dataset = JSON.parse(await fs.readFile(new URL('../src/data/calendar-data.json', import.meta.url)));
assert.ok(CUSTOM_FEED_ENDPOINT, 'Production feed must be configured');
async function get(url, options = {}) {
  return fetch(url, { redirect: 'error', signal: AbortSignal.timeout(15000), ...options });
}
const home = await get(site);
assert.equal(home.status, 200);
assert.ok((await home.text()).includes('id="customSubscribeBtn"'), 'Live frontend missing subscription UI');
const config = await get(new URL('src/config.js', site));
assert.equal(config.status, 200);
assert.ok((await config.text()).includes(CUSTOM_FEED_ENDPOINT), 'Live frontend uses another endpoint');
let previousEtag;
for (const settings of [
  { includeWanPhra: false, includeWanKon: true, includeImportant: false, daysBefore: 2, time: '19:30' },
  { includeWanPhra: true, includeWanKon: false, includeImportant: false, daysBefore: 0, time: '06:00', extraMorning: true },
  { includeWanPhra: true, includeWanKon: true, includeImportant: true, daysBefore: 30, time: '00:00', extraMorning: true },
]) {
  const url = buildSubscriptionUrl(CUSTOM_FEED_ENDPOINT, settings);
  const response = await get(url, previousEtag ? { headers: { 'If-None-Match': previousEtag } } : {});
  assert.equal(response.status, 200, 'Public feed or profile cache isolation failed');
  assert.match(response.headers.get('content-type') || '', /^text\/calendar/);
  assert.equal(response.headers.get('set-cookie'), null);
  const body = await response.text();
  const calendar = new ICAL.Component(ICAL.parse(body));
  assert.equal(calendar.getFirstPropertyValue('x-wanpra-dataset-version'), dataset.metadata.datasetVersion, 'Production data version drift');
  const events = calendar.getAllSubcomponents('vevent');
  const expected = buildCalendarEvents(dataset, { ...settings, from: dataset.metadata.coverage.from, to: dataset.metadata.coverage.to });
  assert.deepEqual(events.map(e => e.getFirstPropertyValue('uid')).sort(), expected.map(e => e.id + '@wanpra-calendar').sort());
  assert.equal(new Set(events.map(e => e.getFirstPropertyValue('uid'))).size, events.length);
  const expectedByUid = new Map(expected.map(event => [event.id + '@wanpra-calendar', event]));
  for (const event of events) {
    const date = event.getFirstPropertyValue('dtstart').toString();
    const expectedEvent = expectedByUid.get(event.getFirstPropertyValue('uid'));
    assert.equal(date, expectedEvent.date, 'Production event date drift');
    assert.equal(event.getFirstPropertyValue('sequence'), dataset.metadata.revision, 'Production revision drift');
    const type = event.getFirstPropertyValue('categories');
    assert.equal(type, expectedEvent.type.toUpperCase());
    const alarms = event.getAllSubcomponents('valarm');
    const extra = settings.extraMorning && type === 'WANPHRA' && !(settings.daysBefore === 0 && settings.time === '06:00');
    assert.equal(alarms.length, extra ? 2 : 1);
    const [hour, minute] = settings.time.split(':').map(Number);
    const target = new Date(`${date}T00:00:00Z`);
    target.setUTCDate(target.getUTCDate() - settings.daysBefore);
    target.setUTCHours(hour - 7, minute);
    assert.equal(alarms[0].getFirstPropertyValue('trigger').toJSDate().toISOString(), target.toISOString());
  }
  assert.equal(await (await get(url)).text(), body);
  previousEtag = response.headers.get('etag');
  assert.ok(previousEtag);
  const cached = await get(url, { headers: { 'If-None-Match': previousEtag } });
  assert.equal(cached.status, 304); assert.equal(await cached.text(), '');
  const head = await get(url, { method: 'HEAD' });
  assert.equal(head.status, 200); assert.equal(await head.text(), '');
  console.log(`Production profile passed: ${events.length} unique events, selected alarms, deterministic response, HEAD and ETag.`);
}
const invalid = await get(CUSTOM_FEED_ENDPOINT + '?days=31');
assert.equal(invalid.status, 400);
assert.equal(invalid.headers.get('cache-control'), 'no-store');
const post = await get(CUSTOM_FEED_ENDPOINT, { method: 'POST' });
assert.equal(post.status, 405);
assert.equal(post.headers.get('allow'), 'GET, HEAD');
console.log('Production QA passed: public frontend, feed configuration, data revision, profile isolation and error responses.');

const supportPage = await get(new URL('support.html', site));
assert.equal(supportPage.status, 200);
const supportHtml = await supportPage.text();
assert.ok(supportHtml.includes('id="supportAge"') && supportHtml.includes('id="supportConsent"'), 'Support acknowledgement controls missing');
assert.ok(supportHtml.includes('id="paymentDetails"') && supportHtml.includes('hidden'), 'Support reveal gate missing');
assert.ok(SUPPORT_PAYMENT && /^\d{10}$/.test(SUPPORT_PAYMENT.number));
const recipientConfig = await get(new URL('src/support-config.js', site));
assert.equal(recipientConfig.status, 200);
const recipientSource = await recipientConfig.text();
assert.ok(recipientSource.includes(SUPPORT_PAYMENT.number) && recipientSource.includes(SUPPORT_PAYMENT.name), 'Published recipient differs from authorized configuration');
for (const asset of ['support.css', 'src/ui/support.js']) assert.equal((await get(new URL(asset, site))).status, 200);
console.log('Production support page passed: required controls, authorized recipient configuration and assets.');
