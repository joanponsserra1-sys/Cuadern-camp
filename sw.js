// Service Worker — Cuaderno de Camp
const CACHE = 'cuaderno-camp-v1';
const ASSETS = [
  '/Cuadern-camp/cuaderno_finca.html',
  '/Cuadern-camp/manifest.json',
];

// Install: cache assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: cache first, then network
self.addEventListener('fetch', e => {
  // Always fetch API calls from network
  if(e.request.url.includes('api.open-meteo') ||
     e.request.url.includes('script.google.com') ||
     e.request.url.includes('api.sencrop.com')) {
    e.respondWith(fetch(e.request).catch(() => new Response('', {status: 503})));
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if(cached) return cached;
      return fetch(e.request).then(resp => {
        if(resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('/Cuadern-camp/cuaderno_finca.html'));
    })
  );
});
