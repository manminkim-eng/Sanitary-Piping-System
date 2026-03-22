/* ══════════════════════════════════════════════════
   Service Worker — 위생배관 PWA
   MANMIN-Ver2.0 | Architect KIM MANMIN
   ══════════════════════════════════════════════════ */

const CACHE = '위생배관-v2.0';
const OFFLINE = './offline.html';

const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './offline.html',
  './favicon.ico',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
];

/* INSTALL */
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

/* ACTIVATE */
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* FETCH */
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isCDN = ['cdn.jsdelivr.net','fonts.googleapis.com','fonts.gstatic.com','cdnjs.cloudflare.com']
                .some(d => url.hostname.includes(d));

  /* HTML 네비게이션 → Network First */
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(OFFLINE)));
    return;
  }

  /* CDN → Network First + 캐시 저장 */
  if (isCDN) {
    e.respondWith(networkFirst(req));
    return;
  }

  /* 로컬 자산 → Stale While Revalidate */
  e.respondWith(staleWhileRevalidate(req));
});

/* SKIP_WAITING 메시지 */
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
});

async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res?.status === 200) {
      const c = await caches.open(CACHE);
      c.put(req, res.clone());
    }
    return res;
  } catch { return caches.match(req); }
}

async function staleWhileRevalidate(req) {
  const c = await caches.open(CACHE);
  const cached = await c.match(req);
  const fresh = fetch(req).then(res => {
    if (res?.status === 200 && res.type !== 'opaque') c.put(req, res.clone());
    return res;
  }).catch(() => cached);
  return cached || fresh;
}
