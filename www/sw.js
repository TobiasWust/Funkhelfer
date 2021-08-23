self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('sw-cache').then((cache) => cache.addAll([
      '/index.html',
      '/js/script.js',
      '/css/style.css'
    ]))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => response || fetch(event.request))
  );
});
