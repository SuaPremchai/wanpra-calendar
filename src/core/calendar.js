import { addDays, assertIsoDate } from "./date.js";

export function validateDataset(dataset) {
  const errors = [];
  if (!dataset?.metadata || !Array.isArray(dataset?.events)) return ["Dataset must contain metadata and events[]"];
  const metadata = dataset.metadata;
  const sources = new Set((metadata.sources || []).map(source => source.id));
  if (!metadata.datasetVersion || !Number.isInteger(metadata.revision) || metadata.revision < 0) errors.push('Missing dataset version/revision');
  try { assertIsoDate(metadata.coverage?.from); assertIsoDate(metadata.coverage?.to); }
  catch { errors.push('Invalid coverage dates'); }
  if (metadata.coverage?.from > metadata.coverage?.to) errors.push('Coverage is reversed');
  const counts = {};
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
    if (!sources.has(event.source)) errors.push(`events[${i}]: unknown source`);
    if (!['source-verified','cross-checked','provisional-source-verified'].includes(event.status)) errors.push(`events[${i}]: missing/invalid verification status`);
    if (event.status==='cross-checked' && (!event.crossCheckSources?.length || event.crossCheckSources.some(source => !sources.has(source) || source===event.source))) errors.push(`events[${i}]: missing independent cross-check source`);
    if (event.date < metadata.coverage?.from || event.date > metadata.coverage?.to) errors.push(`events[${i}]: outside coverage`);
    const year = Number(event.date.slice(0,4));
    if (!metadata.coverage?.beYears?.includes(year+543)) errors.push(`events[${i}]: unsupported year`);
    if (event.type==='wanphra') counts[year]=(counts[year]||0)+1;
  }
  if (JSON.stringify(Object.entries(counts).sort())!==JSON.stringify(Object.entries(metadata.wanPhraCounts||{}).sort())) errors.push('Wan Phra counts do not match metadata');
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
