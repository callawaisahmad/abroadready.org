/* AbroadReady service worker — serves clean URLs (no .html) on GitHub Pages.
   Maps an extensionless path like /pages/scholarships to the real file
   /pages/results.html and returns it with a 200 status. Existing .html
   URLs keep working unchanged. */
self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;

  var url = new URL(req.url);
  if (url.origin !== location.origin) return;

  var last = url.pathname.split('/').pop();
  if (!last || last.indexOf('.') !== -1) return;

  var candidate = url.pathname.replace(/\/+$/, '') + '.html';
  e.respondWith(fetch(candidate + url.search, { credentials: 'same-origin' }));
});
