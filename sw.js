const CACHE_PREFIX = `wanpra:${self.registration.scope}:`;
const VERSION = `${CACHE_PREFIX}2026.10.04.12`;
const cached = async request => (await caches.open(VERSION)).match(request);
const STATIC = [
  './', './index.html', './support.html', './support.css', './icons/kbank-logo.svg', './src/ui/support.js', './src/support-config.js', './styles.css', './manifest.webmanifest', './icons/favicon-32.png?v=2026.10.04.1',
  './icons/icon-192.png?v=2026.10.04.1', './icons/icon-512.png?v=2026.10.04.1', './icons/icon-maskable-512.png?v=2026.10.04.1', './icons/apple-touch-icon.png?v=2026.10.04.1',
  './src/ui/app.js', './src/core/date.js', './src/core/calendar.js',
  './src/exporters/ics.js', './src/data/repository.js',
  './src/core/subscription.js', './src/config.js',
];
self.addEventListener('install', event => event.waitUntil(
  caches.open(VERSION).then(cache => cache.addAll(STATIC.map(url => new Request(url, { cache: 'reload' })))).then(() => self.skipWaiting())
));
self.addEventListener('activate', event => event.waitUntil(
  caches.keys().then(keys => Promise.all(
    keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== VERSION).map(key => caches.delete(key))
  )).then(() => self.clients.claim())
));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.endsWith('/src/data/calendar-data.json') || url.pathname.includes('/feeds/')) {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) {
        const clone = response.clone();
        event.waitUntil(caches.open(VERSION).then(cache => cache.put(event.request, clone)));
      }
      return response;
    }).catch(() => cached(event.request)));
    return;
  }
  event.respondWith(cached(event.request).then(hit => hit || fetch(event.request).then(response => {
    if (response.ok) {
      const clone = response.clone();
      event.waitUntil(caches.open(VERSION).then(cache => cache.put(event.request, clone)));
    }
    return response;
  })));
});
