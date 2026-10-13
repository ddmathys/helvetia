// Service worker minimal : l'app reste utilisable hors ligne (réseau d'abord, cache en secours).
// La page elle-même est toujours redemandée au serveur (cache: no-cache) pour que les mises à jour arrivent tout de suite.
const CACHE = 'helvetia-v3';
self.addEventListener('install', e => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/', '/icon.svg']))); });
self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()),
));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || (u.origin !== location.origin && !u.host.includes('fonts.g'))) return;
  const nav = e.request.mode === 'navigate';
  const req = nav ? fetch(e.request.url, { cache: 'no-cache' }) : fetch(e.request);
  e.respondWith(req.then(r => { const c = r.clone(); caches.open(CACHE).then(k => k.put(nav ? '/' : e.request, c)); return r; })
    .catch(() => caches.match(nav ? '/' : e.request).then(r => r || caches.match('/'))));
});
