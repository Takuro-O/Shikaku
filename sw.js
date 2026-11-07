// 合格ナビ Service Worker
// - アプリ本体(HTML等)は「ネット優先・失敗時にキャッシュ」：更新は常に最新を取り、オフライン時だけ保存済みを使う
// - フォント／Firebase SDK(CDN)は「キャッシュ優先＋裏で更新」：2回目以降はオフラインでも動く
// - Firestore／認証のAPI通信には一切介入しない（同期の整合性を壊さないため）
const VERSION = 'v2';
const APP_CACHE = 'shikaku-app-' + VERSION;
const CDN_CACHE = 'shikaku-cdn-' + VERSION;
const APP_SHELL = ['./', './index.html', './cert-db.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png'];
const CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'www.gstatic.com'];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(APP_CACHE).then(c => c.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => ![APP_CACHE, CDN_CACHE].includes(k)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.origin === self.location.origin) {
    event.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) { const copy = res.clone(); caches.open(APP_CACHE).then(c => c.put(req, copy)); }
          return res;
        })
        .catch(() => caches.match(req).then(hit => hit || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
    );
    return;
  }

  if (CDN_HOSTS.includes(url.hostname)) {
    event.respondWith(
      caches.open(CDN_CACHE).then(cache =>
        cache.match(req).then(hit => {
          const net = fetch(req)
            .then(res => { if (res.ok || res.type === 'opaque') cache.put(req, res.clone()); return res; })
            .catch(() => hit);
          return hit || net;
        })
      )
    );
  }
});
