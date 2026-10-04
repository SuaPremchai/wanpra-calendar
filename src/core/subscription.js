const DEFAULTS = Object.freeze({ includeWanPhra: true, includeWanKon: false, includeImportant: true, daysBefore: 1, time: '17:00', extraMorning: false });
const FLAGS = { wanphra: 'includeWanPhra', wankon: 'includeWanKon', important: 'includeImportant', morning: 'extraMorning' };
const KEYS = new Set(['v', ...Object.keys(FLAGS), 'days', 'time']);

export function normalizeSubscriptionSettings(settings = {}) {
  const result = { ...DEFAULTS, ...settings };
  for (const key of Object.values(FLAGS)) {
    if (typeof result[key] !== 'boolean') throw new TypeError('Category and morning settings must be booleans');
  }
  if (!result.includeWanPhra && !result.includeWanKon && !result.includeImportant) throw new TypeError('Select at least one category');
  if (!Number.isInteger(result.daysBefore) || result.daysBefore < 0 || result.daysBefore > 30) throw new TypeError('Reminder days must be 0..30');
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(result.time)) throw new TypeError('Reminder time must be HH:MM');
  return Object.fromEntries(Object.keys(DEFAULTS).map(key => [key, result[key]]));
}

export function parseSubscriptionQuery(params) {
  if (params.toString().length > 2048) throw new TypeError('Query too long');
  for (const key of params.keys()) {
    if (!KEYS.has(key) || params.getAll(key).length !== 1) throw new TypeError('Unknown or duplicate setting');
  }
  if (params.has('v') && params.get('v') !== '1') throw new TypeError('Unsupported feed version');
  const settings = {};
  for (const [parameter, key] of Object.entries(FLAGS)) {
    if (!params.has(parameter)) continue;
    const value = params.get(parameter);
    if (value !== '0' && value !== '1') throw new TypeError('Flags must be 0 or 1');
    settings[key] = value === '1';
  }
  if (params.has('days')) {
    if (!/^(0|[1-9]\d?)$/.test(params.get('days'))) throw new TypeError('Invalid reminder days');
    settings.daysBefore = Number(params.get('days'));
  }
  if (params.has('time')) settings.time = params.get('time');
  return normalizeSubscriptionSettings(settings);
}

export function subscriptionParams(settings) {
  const normalized = normalizeSubscriptionSettings(settings);
  const params = new URLSearchParams({ v: '1' });
  for (const [parameter, key] of Object.entries(FLAGS)) params.set(parameter, normalized[key] ? '1' : '0');
  params.set('days', String(normalized.daysBefore));
  params.set('time', normalized.time);
  return params;
}

export function buildSubscriptionUrl(endpoint, settings) {
  const url = new URL(endpoint);
  if (url.protocol !== 'https:' && !(url.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(url.hostname))) throw new TypeError('Feed requires HTTPS');
  if (url.username || url.password || url.hash) throw new TypeError('Invalid feed endpoint');
  url.search = subscriptionParams(settings).toString();
  return url.href;
}
