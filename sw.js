const CACHE = 'cloud-director-cockpit-v2-20261105';
const FILES = ['./','./index.html','./styles.css','./app.js','./data.js','./config.js','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/apple-touch-icon.png','./icons/favicon.svg'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('cloud-director-cockpit-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // La navegación y la app buscan red primero para no esconder despliegues nuevos tras la caché.
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const clone = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, clone)).catch(() => {});
    }
    return response;
  }).catch(() => caches.match(event.request)));
});
