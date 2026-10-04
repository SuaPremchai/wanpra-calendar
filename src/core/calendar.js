import { addDays, assertIsoDate } from "./date.js";

export function validateDataset(dataset) {
  const errors = [];
  if (!dataset?.metadata || !Array.isArray(dataset?.events)) return ["Dataset must contain metadata and events[]"];
  const seen = new Set();
  let previous = "0000-00-00";
  for (const [i,event] of dataset.events.entries()) {
    try { assertIsoDate(event.date); } catch (error) { errors.push(`events[${i}]: ${error.message}`); continue; }
    if (!['wanphra','important'].includes(event.type)) errors.push(`events[${i}]: invalid type ${event.type}`);
    if (!event.id || typeof event.id!=='string') errors.push(`events[${i}]: missing stable id`);
    const key = event.id;
    if (seen.has(key)) errors.push(`events[${i}]: duplicate ${key}`);
    seen.add(key);
    if (event.date < previous) errors.push(`events[${i}]: dataset not sorted`);
    previous = event.date;
    if (event.type==='wanphra' && !event.lunarLabel) errors.push(`events[${i}]: wanphra missing lunarLabel`);
    if (event.type==='important' && !event.name) errors.push(`events[${i}]: important missing name`);
  }
  return errors;
}

export function buildCalendarEvents(dataset, options = {}) {
  const { includeWanPhra=true, includeWanKon=false, includeImportant=true, from, to } = options;
  const out = [];
  for (const row of dataset.events) {
    if (from && row.date < from) continue;
    if (to && row.date > to) continue;
    if (row.type==='wanphra') {
      if (includeWanPhra) out.push({ id:row.id, date:row.date, type:'wanphra', title:'วันพระ', description:row.lunarLabel, lunarLabel:row.lunarLabel });
      if (includeWanKon) {
        const date = addDays(row.date,-1);
        if ((!from || date>=from) && (!to || date<=to)) out.push({ id:`wankon-${row.id}`, date, type:'wankon', title:'วันโกน', description:`วันก่อนวันพระ • ${row.lunarLabel}`, relatedWanPhra:row.date });
      }
    }
    if (row.type==='important' && includeImportant) {
      out.push({ id:row.id, date:row.date, type:'important', title:row.name, description:'วันสำคัญทางพระพุทธศาสนา', status:row.status });
    }
  }
  const uniq = new Map(out.map(event => [`${event.id}|${event.date}`, event]));
  return [...uniq.values()].sort((a,b)=>a.date.localeCompare(b.date)||a.type.localeCompare(b.type));
}


export function nextEvents(events, isoToday, limit=3) {
  assertIsoDate(isoToday);
  return events.filter(event=>event.date>=isoToday).slice(0,limit);
}
