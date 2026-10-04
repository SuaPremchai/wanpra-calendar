let cache;
export async function loadCalendarDataset() {
  if (cache) return cache;
  const response = await fetch('./src/data/calendar-data.json', {cache:'no-cache'});
  if (!response.ok) throw new Error(`Unable to load calendar data (${response.status})`);
  cache = await response.json();
  return cache;
}
