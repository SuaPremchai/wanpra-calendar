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

test('all seven category combinations stay isolated, with stable identities across reminder changes', async () => {
  const server = http.createServer(feed);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/calendar.ics`;
  const categoryCounts = { WANPHRA: 99, WANKON: 98, IMPORTANT: 12 };
  const knownIds = new Map();
  try {
    for (let mask = 1; mask < 8; mask++) {
      const settings = { includeWanPhra: Boolean(mask & 1), includeWanKon: Boolean(mask & 2), includeImportant: Boolean(mask & 4), extraMorning: true, daysBefore: 30, time: '00:00' };
      const response = await fetch(buildSubscriptionUrl(base, settings));
      assert.equal(response.status, 200);
      const events = new ICAL.Component(ICAL.parse(await response.text())).getAllSubcomponents('vevent');
      const counts = {};
      for (const event of events) {
        const type = event.getFirstPropertyValue('categories');
        const uid = event.getFirstPropertyValue('uid');
        const date = event.getFirstPropertyValue('dtstart').toString();
        counts[type] = (counts[type] || 0) + 1;
        assert.ok(date >= '2026-01-03' && date <= '2027-12-31');
        if (knownIds.has(uid)) assert.equal(knownIds.get(uid), date);
        knownIds.set(uid, date);
        assert.equal(event.getAllSubcomponents('valarm').length, type === 'WANPHRA' ? 2 : 1);
      }
      assert.equal(new Set(events.map(e => e.getFirstPropertyValue('uid'))).size, events.length);
      for (const [index, type] of ['WANPHRA', 'WANKON', 'IMPORTANT'].entries()) assert.equal(counts[type] || 0, mask & (1 << index) ? categoryCounts[type] : 0);
      const changed = await fetch(buildSubscriptionUrl(base, { ...settings, daysBefore: 0, time: '23:59' }), { headers: { 'If-None-Match': response.headers.get('etag') } });
      assert.equal(changed.status, 200, 'another profile must not reuse cached alarms');
      const changedEvents = new ICAL.Component(ICAL.parse(await changed.text())).getAllSubcomponents('vevent');
      assert.deepEqual(changedEvents.map(e => e.getFirstPropertyValue('uid')), events.map(e => e.getFirstPropertyValue('uid')));
    }
  } finally { await new Promise(resolve => server.close(resolve)); }
});

test('same-day morning reminder is emitted once and boundary alarms preserve Bangkok time', async () => {
  const server = http.createServer(feed);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = `http://127.0.0.1:${server.address().port}/calendar.ics`;
  const settings = { includeWanPhra: true, includeWanKon: false, includeImportant: false, extraMorning: true };
  try {
    const response = await fetch(buildSubscriptionUrl(base, { ...settings, daysBefore: 0, time: '06:00' }));
    const events = new ICAL.Component(ICAL.parse(await response.text())).getAllSubcomponents('vevent');
    assert.ok(events.every(e => e.getAllSubcomponents('valarm').length === 1));
    assert.equal(events[0].getFirstSubcomponent('valarm').getFirstPropertyValue('trigger').toString(), '2026-01-02T23:00:00Z');
    const midnight = await (await fetch(buildSubscriptionUrl(base, { ...settings, daysBefore: 30, time: '00:00' }))).text();
    assert.ok(midnight.includes('TRIGGER;VALUE=DATE-TIME:20251203T170000Z'));
    const late = await (await fetch(buildSubscriptionUrl(base, { ...settings, daysBefore: 0, time: '23:59' }))).text();
    assert.ok(late.includes('TRIGGER;VALUE=DATE-TIME:20260103T165900Z'));
    for (const validator of [`W/${response.headers.get('etag')}`, `"unrelated", ${response.headers.get('etag')}`, '*']) {
      const cached = await fetch(buildSubscriptionUrl(base, { ...settings, daysBefore: 0, time: '06:00' }), { headers: { 'If-None-Match': validator } });
      assert.equal(cached.status, 304); assert.equal(await cached.text(), '');
    }
    const invalid = await fetch(base+'?time=%0D%0ABEGIN%3AVEVENT', { method: 'HEAD' });
    assert.equal(invalid.status, 400); assert.equal(await invalid.text(), ''); assert.equal(invalid.headers.get('cache-control'), 'no-store');
    const post = await fetch(base, { method: 'POST' });
    assert.equal(post.headers.get('allow'), 'GET, HEAD'); assert.equal(post.headers.get('cache-control'), 'no-store');
  } finally { await new Promise(resolve => server.close(resolve)); }
});
