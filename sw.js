/* ══════════════════════════════════════════════════════════
   위생배관 관경 산정 시스템 — Service Worker Ver-5.0
   MANMIN Engineering · 기계설비 기술기준 2021-851
   ㈜대성건축사사무소 · 건축사 김만민
   v5.0 : 전 39종 버전 체계를 manmin-v5.0.0 으로 통일하고
          로컬 폴백 폰트(assets/fonts)를 사전 캐시에 편입한다.
   ══════════════════════════════════════════════════════════ */

/* §17-1 — 도구 고유 접두어. 종전 'manmin-v5.0.1' 은 필터 'sanpipe-' 와 어긋나 자기 구캐시를 못 지웠다 */
const PREFIX      = 'sanpipe-';
const SW_VER      = 'sanpipe-v5.0.2';
/* 종전 접두어 잔재 — 한 번 지우고 나면 무해하다 */
const ORPHAN      = ['manmin-v5.0.1-core','manmin-v5.0.1-fonts','manmin-v5.0.1-cdn','manmin-v5.0.1-dynamic','manmin-v5.0.0-core','manmin-v5.0.0-fonts','manmin-v5.0.0-cdn','manmin-v5.0.0-dynamic'];
const CACHE_CORE  = `${SW_VER}-core`;
const CACHE_FONTS = `${SW_VER}-fonts`;
const CACHE_CDN   = `${SW_VER}-cdn`;
const CACHE_DYN   = `${SW_VER}-dynamic`;

/* ── 사전 캐시 목록 ── */
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './offline.html',
  './icons/icon-192x192.png',
  './icons/icon-512x512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/icon-144x144.png',
  './icons/icon-152x152.png',
  './icons/brand-icon.jpg',
  /* v5.0 : 로컬 폴백 폰트 — 오프라인·차단망에서 한글 유지 */
  './assets/fonts/manmin-fonts.css',
  './assets/fonts/NotoSansKR-var.woff2'
];

const FONT_HOSTS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
  'https://cdn.jsdelivr.net'
];

const CDN_HOSTS = [
  'https://cdnjs.cloudflare.com'
];

/* ════ INSTALL ════ */
self.addEventListener('install', e => {
  console.log(`[SW] ${SW_VER} installing`);
  e.waitUntil(
    caches.open(CACHE_CORE).then(cache =>
      Promise.allSettled(
        PRECACHE.map(url =>
          cache.add(url).catch(err => console.warn('[SW] precache skip:', url, err))
        )
      )
    ).then(() => self.skipWaiting())
  );
});

/* ════ ACTIVATE ════ */
self.addEventListener('activate', e => {
  console.log(`[SW] ${SW_VER} activating`);
  const keep = [CACHE_CORE, CACHE_FONTS, CACHE_CDN, CACHE_DYN];
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => (k.startsWith(PREFIX) || ORPHAN.includes(k)) && !keep.includes(k))
            .map(k => { console.log('[SW] delete old cache:', k); return caches.delete(k); })
      ))
      .then(() => self.clients.claim())
  );
});

/* ════ FETCH ════ */
self.addEventListener('fetch', e => {
  const { request: req } = e;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith('http')) return;

  const url = new URL(req.url);

  if (FONT_HOSTS.some(h => req.url.startsWith(h))) {
    e.respondWith(staleWhileRevalidate(req, CACHE_FONTS));
  } else if (CDN_HOSTS.some(h => req.url.startsWith(h))) {
    e.respondWith(cacheFirst(req, CACHE_CDN, 7 * 86400));
  } else if (req.mode === 'navigate') {
    e.respondWith(networkFirstNav(req));
  } else if (/\.(png|jpg|jpeg|gif|webp|svg|ico|woff2?|ttf|otf|css|js|json)$/i.test(url.pathname)) {
    e.respondWith(cacheFirst(req, CACHE_CORE, 86400));
  } else {
    e.respondWith(networkFirst(req));
  }
});

/* ── Cache First ── */
async function cacheFirst(req, name, maxAge) {
  const cache  = await caches.open(name);
  const cached = await cache.match(req);
  if (cached) {
    const date = cached.headers.get('date');
    if (!date || !maxAge || (Date.now() - new Date(date).getTime()) / 1000 < maxAge)
      return cached;
  }
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch { return cached || fallback(req); }
}

/* ── Network First ── */
async function networkFirst(req) {
  try {
    const res = await fetch(req);
    if (res.ok) { const c = await caches.open(CACHE_DYN); c.put(req, res.clone()); }
    return res;
  } catch {
    const c = await caches.open(CACHE_DYN);
    return (await c.match(req)) || fallback(req);
  }
}

/* ── Network First (Navigation) ── */
async function networkFirstNav(req) {
  try {
    const res = await fetch(req);
    if (res.ok) { const c = await caches.open(CACHE_CORE); c.put(req, res.clone()); }
    return res;
  } catch {
    const c = await caches.open(CACHE_CORE);
    return (await c.match(req))
        || (await c.match('./index.html'))
        || (await c.match('./offline.html'))
        || new Response('<h1>오프라인</h1>', { headers: { 'Content-Type': 'text/html;charset=utf-8' } });
  }
}

/* ── Stale-While-Revalidate ── */
async function staleWhileRevalidate(req, name) {
  const cache  = await caches.open(name);
  const cached = await cache.match(req);
  const fresh  = fetch(req).then(r => { if (r.ok) cache.put(req, r.clone()); return r; }).catch(() => cached);
  return cached || fresh;
}

/* ── Fallback ── */
function fallback(req) {
  if (/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i.test(req.url))
    return new Response('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1"/>', { headers: { 'Content-Type': 'image/svg+xml' } });
  return new Response('', { status: 503 });
}

/* ════ MESSAGE ════ */
self.addEventListener('message', e => {
  if (e.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data?.type === 'GET_VERSION')  e.ports[0]?.postMessage({ version: SW_VER });
  if (e.data?.type === 'CLEAR_CACHE')
    caches.keys().then(ks => Promise.all(ks.map(k => caches.delete(k))))
          .then(() => e.ports[0]?.postMessage({ ok: true }));
});

/* ════ PUSH ════ */
self.addEventListener('push', e => {
  if (!e.data) return;
  const d = e.data.json();
  e.waitUntil(self.registration.showNotification(d.title || '급배수관경', {
    body: d.body || '업데이트가 있습니다.',
    icon: './icons/icon-192x192.png',
    badge: './icons/icon-96x96.png',
    tag: 'sanpipe-update',
    renotify: true
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      if (list.length) return list[0].focus();
      return clients.openWindow('./index.html');
    })
  );
});

console.log(`[SW] ${SW_VER} loaded`);
