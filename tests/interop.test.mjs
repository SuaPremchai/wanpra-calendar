import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import ICAL from 'ical.js';
import { generateIcs } from '../src/exporters/ics.js';
import { buildCalendarEvents } from '../src/core/calendar.js';
import { addDays, assertIsoDate } from '../src/core/date.js';
const data = JSON.parse(fs.readFileSync(new URL('../src/data/calendar-data.json', import.meta.url)));

test('static feeds parse independently, have unique UIDs, all-day dates and UTC alarms', () => {
  for (const name of ['wanpra-default','wanpra-only']) {
    const text = fs.readFileSync(new URL(`../feeds/${name}.ics`, import.meta.url),'utf8');
    assert.ok(text.endsWith('\r\n'));
    assert.ok(!/[\r\n]/.test(text.replaceAll('\r\n','')));
    for (const line of text.split('\r\n')) assert.ok(Buffer.byteLength(line)<=75);
    const calendar = new ICAL.Component(ICAL.parse(text));
    const events = calendar.getAllSubcomponents('vevent');
    assert.equal(events.length,name==='wanpra-only'?99:111);
    const ids = new Set();
    for (const component of events) {
      const event = new ICAL.Event(component);
      assert.ok(!ids.has(event.uid)); ids.add(event.uid);
      assert.ok(event.startDate.isDate && event.endDate.isDate);
      assert.equal(event.endDate.toString(),addDays(event.startDate.toString(),1));
      assert.equal(component.getFirstPropertyValue('sequence'),data.metadata.revision);
      const alarm = component.getFirstSubcomponent('valarm');
      const trigger = alarm.getFirstPropertyValue('trigger');
      assert.equal(alarm.getFirstPropertyValue('action'),'DISPLAY');
      assert.equal(trigger.zone.tzid,'UTC');
      assert.equal(trigger.hour,10); assert.equal(trigger.minute,0);
      assert.equal(trigger.toString().slice(0,10),addDays(event.startDate.toString(),-1));
      assert.ok(event.summary.includes('วัน'));
    }
  }
});

test('published feeds reproduce byte-for-byte from versioned data', () => {
  for (const [name, calendarName, includeImportant] of [
    ['wanpra-default','WanPra — วันพระไทย',true],['wanpra-only','WanPra — วันพระ',false],
  ]) {
    const events = buildCalendarEvents(data,{includeWanPhra:true,includeImportant,includeWanKon:false});
    const actual = generateIcs(events,{calendarName,reminder:{daysBefore:1,time:'17:00'},generatedAt:data.metadata.publishedAt,datasetVersion:data.metadata.datasetVersion,sequence:data.metadata.revision});
    assert.equal(actual,fs.readFileSync(new URL(`../feeds/${name}.ics`,import.meta.url),'utf8'));
  }
});

test('TEXT escaping round-trips Thai, punctuation and mixed line endings without injecting properties', () => {
  const title = 'วันพระ, ทดสอบ; \\ข้อความ';
  const description = 'ไทย'.repeat(70)+'\r\nSUMMARY:Injected\rอีกบรรทัด\nสุดท้าย';
  const text = generateIcs([{id:'escaping-test',date:'2026-01-01',type:'wanphra',title,description}],{generatedAt:'2026-01-01T00:00:00Z'});
  const component = new ICAL.Component(ICAL.parse(text)).getFirstSubcomponent('vevent');
  assert.equal(component.getAllProperties('summary').length,1);
  assert.equal(component.getFirstPropertyValue('summary'),title);
  assert.equal(component.getFirstPropertyValue('description'),description.replace(/\r\n|\r/g,'\n'));
});

test('leap dates and reminder rollovers across year/month boundaries remain valid', () => {
  assert.equal(addDays('2024-02-28',1),'2024-02-29');
  assert.equal(addDays('2024-02-29',1),'2024-03-01');
  assert.throws(()=>assertIsoDate('2026-02-29'));
  for (const [date, reminder, expected] of [
    ['2026-01-01',{daysBefore:1,time:'17:00'},'2025-12-31T10:00:00Z'],
    ['2026-03-01',{daysBefore:1,time:'17:00'},'2026-02-28T10:00:00Z'],
    ['2026-01-01',{daysBefore:0,time:'06:00'},'2025-12-31T23:00:00Z'],
  ]) {
    const text = generateIcs([{id:'rollover',date,type:'wanphra',title:'วันพระ'}],{reminder,generatedAt:'2026-01-01T00:00:00Z'});
    const component = new ICAL.Component(ICAL.parse(text));
    assert.equal(component.getFirstSubcomponent('vevent').getFirstSubcomponent('valarm').getFirstPropertyValue('trigger').toString(),expected);
  }
});
