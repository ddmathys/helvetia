// Service worker minimal : l'app reste utilisable hors ligne (réseau d'abord, cache en secours).
const CACHE = 'helvetia-v2';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/index.html', '/icon.svg']))); });
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || (u.origin !== location.origin && !u.host.includes('fonts.g'))) return;
  e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(e.request, c)); return r; })
    .catch(() => caches.match(e.request).then(r => r || caches.match('/index.html'))));
});
