// Tech Freire Dragon Defense - Cache Purge Service Worker
// Automatically unregisters and deletes all legacy caches from older builds (e.g. rc63, rc113).
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k))))
      .then(() => self.registration.unregister())
      .then(() => self.clients.matchAll({ type: 'window' }))
      .then(clients => {
        clients.forEach(client => {
          if (client.url && 'navigate' in client) {
            client.navigate(client.url);
          }
        });
      })
  );
});

self.addEventListener('fetch', event => {
  // Direct bypass: always fetch from network with cache bypassed
  return;
});
