// Bei jeder Änderung an den Dateien die Version hochzählen, dann bekommen alle das Update.
const CACHE = 'funkhelfer-v2.3.1';
const ASSETS = [
  './',
  'index.html',
  'css/style.css',
  'js/app.js',
  'js/data.js',
  'fonts/VarelaRound-Regular.ttf',
  'site.webmanifest',
  'favicon.ico',
  'img/phoenix-logo.png',
  'img/gleitschirmfunk.webp',
  'img/icons/logo-96.png',
  'img/icons/logo-192.png',
  'img/icons/logo-512.png',
  'img/icons/maskable-192.png',
  'img/icons/maskable-512.png',
  'img/icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)));
  // Beim allerersten Besuch sofort aktiv werden; Updates warten auf „Neu laden“.
  if (!self.registration.active) self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // Seitenaufrufe (auch mit ?k=…) bekommen die gecachte App-Seite.
  if (req.mode === 'navigate') {
    event.respondWith(caches.match('index.html').then((r) => r || fetch(req)));
    return;
  }
  event.respondWith(caches.match(req, { ignoreSearch: true }).then((r) => r || fetch(req)));
});
