import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import ICAL from 'ical.js';
import feed from '../api/calendar.js';
import { buildSubscriptionUrl, parseSubscriptionQuery } from '../src/core/subscription.js';

test('custom subscription has canonical, persistent settings in its URL', () => {
  const settings = { includeWanPhra: false, includeWanKon: true, includeImportant: false, daysBefore: 2, time: '19:30', extraMorning: true };
  const url = buildSubscriptionUrl('https://feed.example/calendar.ics', settings);
  assert.deepEqual(parseSubscriptionQuery(new URL(url).searchParams), settings);
  assert.equal(url, buildSubscriptionUrl('https://feed.example/calendar.ics', { ...settings }));
  assert.equal(new URL(url).searchParams.get('v'), '1');
  assert.throws(() => buildSubscriptionUrl('http://feed.example/calendar.ics', settings));
});

test('feed rejects invalid settings rather than silently creating another calendar', () => {
  for (const query of ['v=2','wanphra=1&wanphra=0','unknown=1','days=-1','days=31','days=1.5','days=01','time=24:00','time=12:60','wanphra=true','morning=bad','wanphra=0&wankon=0&important=0']) {
    assert.throws(() => parseSubscriptionQuery(new URLSearchParams(query)), query);
  }
  assert.equal(parseSubscriptionQuery(new URLSearchParams()).time, '17:00');
});

test('HTTP feed returns deterministic custom alarms, isolated cache validators and no duplicates', async () => {
  const server = http.createServer(feed);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/calendar.ics`;
  try {
    const url = buildSubscriptionUrl(base, { includeWanPhra: true, includeWanKon: true, includeImportant: false, daysBefore: 2, time: '19:30', extraMorning: true });
    const response = await fetch(url);
    assert.equal(response.status, 200);
    assert.match(response.headers.get('content-type'), /^text\/calendar/);
    assert.match(response.headers.get('cache-control'), /s-maxage=21600/);
    assert.equal(response.headers.get('set-cookie'), null);
    const body = await response.text();
    const components = new ICAL.Component(ICAL.parse(body)).getAllSubcomponents('vevent');
    assert.equal(components.length, 197); // first derived Wan Kon is outside supported coverage
    assert.equal(new Set(components.map(c => c.getFirstPropertyValue('uid'))).size, 197);
    assert.ok(components.every(c => c.getFirstPropertyValue('categories') !== 'IMPORTANT'));
    assert.ok(body.includes('TRIGGER;VALUE=DATE-TIME:20260101T123000Z'));
    assert.ok(body.includes('TRIGGER;VALUE=DATE-TIME:20260102T230000Z'));
    assert.equal(await (await fetch(url)).text(), body);
    assert.equal((await fetch(url, { headers: { 'If-None-Match': response.headers.get('etag') } })).status, 304);
    const head = await fetch(url, { method: 'HEAD' });
    assert.equal(head.status, 200); assert.equal(await head.text(), '');
    assert.equal(head.headers.get('etag'), response.headers.get('etag'));
    const different = await fetch(buildSubscriptionUrl(base, { daysBefore: 0, time: '06:00' }));
    assert.notEqual(different.headers.get('etag'), response.headers.get('etag'));
    assert.equal((await fetch(base+'?days=31')).status, 400);
    assert.equal((await fetch(base, { method: 'POST' })).status, 405);
  } finally {
    await new Promise(resolve => server.close(resolve));
  }
});
