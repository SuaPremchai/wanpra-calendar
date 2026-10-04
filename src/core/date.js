export const TIMEZONE = "Asia/Bangkok";
const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function assertIsoDate(value) {
  if (!ISO_DATE_RE.test(value)) throw new TypeError(`Invalid ISO date: ${value}`);
  const [y,m,d] = value.split("-").map(Number);
  const dt = new Date(Date.UTC(y,m-1,d));
  if (dt.getUTCFullYear()!==y || dt.getUTCMonth()!==m-1 || dt.getUTCDate()!==d) throw new TypeError(`Invalid calendar date: ${value}`);
  return value;
}

export function addDays(isoDate, delta) {
  assertIsoDate(isoDate);
  if (!Number.isInteger(delta)) throw new TypeError("delta must be an integer");
  const [y,m,d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y,m-1,d));
  dt.setUTCDate(dt.getUTCDate()+delta);
  return `${dt.getUTCFullYear()}-${String(dt.getUTCMonth()+1).padStart(2,"0")}-${String(dt.getUTCDate()).padStart(2,"0")}`;
}

export function compactDate(isoDate) { return assertIsoDate(isoDate).replaceAll("-",""); }
export function toBuddhistYear(gregorianYear) { return gregorianYear + 543; }

export function bangkokLocalToUtcStamp(isoDate, hhmm) {
  assertIsoDate(isoDate);
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(hhmm)) throw new TypeError(`Invalid time: ${hhmm}`);
  const [y,m,d] = isoDate.split("-").map(Number);
  const [hh,mm] = hhmm.split(":").map(Number);
  // Asia/Bangkok is UTC+07:00 year-round (no DST).
  const utc = new Date(Date.UTC(y,m-1,d,hh-7,mm,0));
  return `${utc.getUTCFullYear()}${String(utc.getUTCMonth()+1).padStart(2,"0")}${String(utc.getUTCDate()).padStart(2,"0")}T${String(utc.getUTCHours()).padStart(2,"0")}${String(utc.getUTCMinutes()).padStart(2,"0")}00Z`;
}

export function formatThaiDate(isoDate) {
  assertIsoDate(isoDate);
  return new Intl.DateTimeFormat("th-TH", {day:"numeric",month:"short",year:"numeric",timeZone:"UTC"}).format(new Date(`${isoDate}T00:00:00Z`));
}
