/* Pack Up! — offline support.
   After you edit index.html, change CACHE (e.g. v2, v3…) so tablets fetch the new version. */
const CACHE = 'pack-up-v2';
const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Serve from the cache straight away (works with no internet),
   and quietly refresh the cache in the background when online. */
self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (new URL(req.url).origin !== self.location.origin) return;

  const fresh = fetch(req).then(res => {
    if (!res || !res.ok || res.type === 'opaqueredirect') return res;
    const copy = res.clone();
    return caches.open(CACHE).then(c => c.put(req, copy)).then(() => res, () => res);
  });
  event.waitUntil(fresh.catch(() => {}));

  event.respondWith(
    caches.match(req, { ignoreSearch: true })
      .then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : null))
      .then(hit => hit || fresh)
  );
});
