const CACHE_NAME = 'marrions-pharmacy-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/logo.jpg', '/icons/icon-192.png', '/icons/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Keep navigation usable when the internet is unavailable.
  if (req.mode === 'navigate') {
    event.respondWith(fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE_NAME).then(c => c.put('/index.html', copy));
      return res;
    }).catch(() => caches.match('/index.html')));
    return;
  }

  // Cache same-origin application assets using stale-while-revalidate.
  if (url.origin === self.location.origin) {
    event.respondWith(caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res.ok) caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
        return res;
      }).catch(() => cached);
      return cached || network;
    }));
    return;
  }

  // Read-only Supabase requests can fall back to the last cached response.
  if (url.hostname.endsWith('.supabase.co')) {
    event.respondWith(fetch(req).then(res => {
      if (res.ok) caches.open(CACHE_NAME).then(c => c.put(req, res.clone()));
      return res;
    }).catch(() => caches.match(req)));
  }
});
