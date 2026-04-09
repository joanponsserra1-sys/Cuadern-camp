// Service Worker — Cuaderno de Camp v20260409-0516
const CACHE = 'cuaderno-camp-20260409-0516';
const ASSETS = [
  '/Cuadern-camp/manifest.json',
  '/Cuadern-camp/icon-192.png',
  '/Cuadern-camp/icon-512.png',
];

// Install: cache only static assets (NOT the HTML)
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS).catch(() => {}))
  );
  self.skipWaiting();
});

// Activate: delete ALL old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch strategy:
// - HTML: network first, cache fallback (sempre versió fresca)
// - APIs: network only
// - Assets: cache first
self.addEventListener('fetch', e => {
  const url = e.request.url;

  // APIs: sempre xarxa
  if(url.includes('api.open-meteo') ||
     url.includes('archive-api.open-meteo') ||
     url.includes('script.google.com') ||
     url.includes('api.sencrop.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }

  // HTML: network first (sempre versió fresca)
  if(url.includes('.html')) {
    e.respondWith(
      fetch(e.request).then(resp => {
        if(resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match(e.request))
    );
    return;
  }

  // Assets (icones, manifest): cache first
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(resp => {
        if(resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      });
    })
  );
});
