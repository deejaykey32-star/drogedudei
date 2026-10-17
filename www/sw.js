// Service worker DrogEduDei: najpierw sieć, w razie braku – pamięć podręczna (działa offline).
const CACHE = 'drogedudei-v1';
self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['./', 'index.html', 'css/app.css', 'js/app.js', 'data/katowice.json', 'vendor/leaflet/leaflet.js', 'vendor/leaflet/leaflet.css', 'icons/icon.svg'])));
});
self.addEventListener('activate', (e) => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', (e) => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (u.origin !== location.origin) {
    // kafelki mapy: cache-first
    if (u.hostname.endsWith('tile.openstreetmap.org')) e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return res; })));
    return;
  }
  e.respondWith(fetch(e.request).then((res) => { const cp = res.clone(); caches.open(CACHE).then((c) => c.put(e.request, cp)); return res; }).catch(() => caches.match(e.request)));
});
