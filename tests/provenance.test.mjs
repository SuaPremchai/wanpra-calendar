import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { validateDataset } from '../src/core/calendar.js';
const data = JSON.parse(fs.readFileSync(new URL('../src/data/calendar-data.json', import.meta.url)));
const evidence = JSON.parse(fs.readFileSync(new URL('./fixtures/source-verification-2026-10-04.json', import.meta.url)));

test('all Wan Phra dates and labels match retrieved MyHora tables, without omissions', () => {
  for (const source of evidence.myhora) {
    const expected = source.rows.filter(row => /^(ขึ้น|แรม) (๘|๑๔|๑๕) ค่ำ/.test(row.lunarLabel))
      .map(({ date, lunarLabel }) => ({ date, lunarLabel }));
    const actual = data.events.filter(row => row.type==='wanphra' && row.date.startsWith(String(source.year-543)))
      .map(({ date, lunarLabel }) => ({ date, lunarLabel }));
    assert.deepEqual(actual, expected);
  }
});

test('all observances match MyHora remarks; future status stays provisional', () => {
  for (const event of data.events.filter(row => row.type==='important')) {
    const reference = evidence.myhora.flatMap(source => source.rows).find(row => row.date===event.date);
    assert.ok(reference?.remark.includes(event.name), event.id);
    if (event.date.startsWith('2027')) assert.equal(event.status, 'provisional-source-verified');
  }
});

test('independent BOT evidence matches observance dates rather than substitution holidays', () => {
  const entries = [['makha-bucha-2026','Makha','2026-03-03'],['visakha-bucha-2026','Visakha','2026-05-31'],['asalha-bucha-2026','Asarnha','2026-07-29']];
  for (const [id, name, date] of entries) {
    const event = data.events.find(row => row.id===id);
    assert.equal(event.date, date);
    assert.equal(event.status, 'cross-checked');
    assert.deepEqual(event.crossCheckSources, ['thai-gov-2026']);
    const reference = evidence.bot.rows.find(row => row.holidayDescription.includes(name));
    if (name==='Visakha') assert.match(reference.holidayDescription, /Sunday 31st May 2026/);
    else assert.equal(reference.date.split(' ').at(-1), String(Number(date.slice(-2))));
  }
  assert.equal(data.events.find(row => row.id==='khao-phansa-2026').status,'source-verified');
});

test('quality gate rejects missing provenance, false cross-checks and unsupported coverage', () => {
  for (const mutate of [
    d => { delete d.events[0].status; },
    d => { d.events[0].source='unknown'; },
    d => { d.events[0].status='cross-checked'; },
    d => { d.events[0].date='2028-01-01'; },
    d => { d.metadata.wanPhraCounts['2026']=48; },
  ]) {
    const invalid = structuredClone(data); mutate(invalid);
    assert.ok(validateDataset(invalid).length>0);
  }
});

test('BOT advance 2027 schedule also agrees, without promoting future statuses', () => {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  for (const [id, name] of [['makha-bucha-2027','Makha'],['visakha-bucha-2027','Visakha'],['asalha-bucha-2027','Asarnha']]) {
    const reference = evidence.bot2027.rows.find(row => row.holidayDescription.includes(name));
    const substitution = reference.holidayDescription.match(/Sunday (\d+)(?:st|nd|rd|th) (\w+) (\d{4})/);
    const [day, month, year] = substitution ? substitution.slice(1) : [reference.date.split(' ').at(-1),reference.month,reference.year];
    const date = `${year}-${String(months.indexOf(month)+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const event = data.events.find(row => row.id===id);
    assert.equal(event.date,date);
    assert.equal(event.status,'provisional-source-verified');
  }
});
