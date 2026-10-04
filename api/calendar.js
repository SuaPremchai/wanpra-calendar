import fs from 'node:fs';
import { createHash } from 'node:crypto';
import { buildCalendarEvents, validateDataset } from '../src/core/calendar.js';
import { parseSubscriptionQuery } from '../src/core/subscription.js';
import { generateIcs } from '../src/exporters/ics.js';

const dataset = JSON.parse(fs.readFileSync(new URL('../src/data/calendar-data.json', import.meta.url), 'utf8'));
const errors = validateDataset(dataset);
if (errors.length) throw new Error(`Feed dataset failed validation: ${errors[0]}`);

export default function calendarFeed(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 405;
    res.end('Method not allowed');
    return;
  }
  let settings;
  try {
    settings = parseSubscriptionQuery(new URL(req.url, 'https://feed.invalid').searchParams);
  } catch {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.statusCode = 400;
    res.end(req.method === 'HEAD' ? undefined : 'Invalid calendar settings');
    return;
  }
  const events = buildCalendarEvents(dataset, {
    ...settings, from: dataset.metadata.coverage.from, to: dataset.metadata.coverage.to,
  });
  const body = generateIcs(events, {
    calendarName: 'WanPra — ปฏิทินของฉัน',
    reminder: { daysBefore: settings.daysBefore, time: settings.time },
    extraMorning: settings.extraMorning,
    generatedAt: dataset.metadata.publishedAt,
    datasetVersion: dataset.metadata.datasetVersion,
    sequence: dataset.metadata.revision,
  });
  const etag = `"${createHash('sha256').update(body).digest('hex')}"`;
  res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
  res.setHeader('Content-Disposition', 'inline; filename="wanpra-custom.ics"');
  res.setHeader('Cache-Control', 'public, max-age=0, s-maxage=21600, stale-while-revalidate=600');
  res.setHeader('ETag', etag);
  res.setHeader('Last-Modified', new Date(dataset.metadata.publishedAt).toUTCString());
  const validators = String(req.headers['if-none-match'] || '').split(',').map(value => value.trim().replace(/^W\//, ''));
  if (validators.includes(etag) || validators.includes('*')) {
    res.statusCode = 304;
    res.end();
    return;
  }
  res.statusCode = 200;
  res.end(req.method === 'HEAD' ? undefined : body);
}
