import { addDays, bangkokLocalToUtcStamp, compactDate } from "../core/date.js";

const encoder = new TextEncoder();
export function escapeIcsText(value='') {
  return String(value).replaceAll('\\','\\\\').replace(/\r\n|\r|\n/g,'\\n').replaceAll(';','\\;').replaceAll(',','\\,');
}

export function foldIcsLine(line) {
  const parts=[]; let current='';
  for (const char of String(line)) {
    const candidate=current+char;
    const limit=parts.length===0?75:74; // continuation line has one leading space
    if (encoder.encode(candidate).length>limit && current) { parts.push(current); current=char; } else current=candidate;
  }
  if (current || !parts.length) parts.push(current);
  return parts.map((p,i)=>i===0?p:` ${p}`).join('\r\n');
}

function validateReminder(reminder) {
  if (!Number.isInteger(reminder.daysBefore) || reminder.daysBefore<0 || reminder.daysBefore>30) throw new TypeError('daysBefore must be 0..30');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(reminder.time)) throw new TypeError('time must be HH:MM');
}

export function generateIcs(events, options={}) {
  const calendarName = options.calendarName || 'WanPra — วันพระไทย';
  const reminder = options.reminder || {daysBefore:1,time:'17:00'};
  validateReminder(reminder);
  const generatedAt = options.generatedAt || new Date().toISOString();
  const dtstamp = generatedAt.replace(/[-:]/g,'').replace(/\.\d{3}Z$/,'Z');
  const extraMorning = Boolean(options.extraMorning);
  const sequence = Number.isInteger(options.sequence) && options.sequence >= 0 ? options.sequence : 0;
  const datasetVersion = options.datasetVersion ? String(options.datasetVersion) : '';
  const lines = ['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//WanPra//Thai Buddhist Calendar//TH','CALSCALE:GREGORIAN','METHOD:PUBLISH',`X-WR-CALNAME:${escapeIcsText(calendarName)}`,'X-WR-TIMEZONE:Asia/Bangkok',...(datasetVersion?[`X-WANPRA-DATASET-VERSION:${escapeIcsText(datasetVersion)}`]:[]),'X-PUBLISHED-TTL:PT12H','REFRESH-INTERVAL;VALUE=DURATION:PT12H'];
  for (const event of events) {
    const nextDay=addDays(event.date,1);
    const alarmDate=addDays(event.date,-reminder.daysBefore);
    lines.push('BEGIN:VEVENT',`UID:${escapeIcsText(event.id)}@wanpra-calendar`,`DTSTAMP:${dtstamp}`,`LAST-MODIFIED:${dtstamp}`,`SEQUENCE:${sequence}`,`DTSTART;VALUE=DATE:${compactDate(event.date)}`,`DTEND;VALUE=DATE:${compactDate(nextDay)}`,`SUMMARY:${escapeIcsText(event.title)}`,`DESCRIPTION:${escapeIcsText(event.description||'')}`,`CATEGORIES:${event.type.toUpperCase()}`,'TRANSP:TRANSPARENT');
    lines.push('BEGIN:VALARM',`TRIGGER;VALUE=DATE-TIME:${bangkokLocalToUtcStamp(alarmDate,reminder.time)}`,'ACTION:DISPLAY',`DESCRIPTION:${escapeIcsText(`เตือน: ${event.title}${event.description?` • ${event.description}`:''}`)}`,'END:VALARM');
    if (extraMorning && event.type==='wanphra' && !(reminder.daysBefore===0 && reminder.time==='06:00')) lines.push('BEGIN:VALARM',`TRIGGER;VALUE=DATE-TIME:${bangkokLocalToUtcStamp(event.date,'06:00')}`,'ACTION:DISPLAY',`DESCRIPTION:${escapeIcsText(`วันนี้วันพระ • ${event.description||''}`)}`,'END:VALARM');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join('\r\n')+'\r\n';
}
