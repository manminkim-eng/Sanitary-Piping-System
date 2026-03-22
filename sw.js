// 위생배관 관경 산정 시스템 — Service Worker
// MANMIN-Ver2.0 · WAP 세트

const CACHE = 'sanitary-pipe-wap-v1';
const FILES = [
  './',
  './start.html',
  './index.html',
  './pages/tablet.html',
  './pages/mobile.html',
  './css/style.css',
  './js/engine.js',
  './js/ui.js',
  './manifest.json',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});
self.addEventListener('fetch', e => {
  if(e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(c => c || fetch(e.request).then(r => {
      if(r && r.status===200 && r.type==='basic'){
        const clone = r.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
      }
      return r;
    })).catch(() => caches.match('./index.html'))
  );
});
