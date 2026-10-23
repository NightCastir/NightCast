/* NightCast PWA service worker — public shell only; never cache API, auth, or audio. */
'use strict';

const CACHE_PREFIX = 'nightcast-pwa-shell-';
const CACHE_NAME = CACHE_PREFIX + 'v2';
const PRECACHE_URLS = [
  '/',
  '/assets/icons/icon-512.png',
  '/assets/icons/icon-512.png',
  '/favicon.ico'
];

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(PRECACHE_URLS.map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'reload' });
        if (response.ok && response.type === 'basic') await cache.put(url, response);
      } catch (_) {
        // An individual optional asset must not prevent installation.
      }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

function isSensitiveOrDynamic(url) {
  return url.origin !== self.location.origin ||
    /^\/(?:api|auth|users|login|downloadrelease)(?:\/|$)/i.test(url.pathname) ||
    /\.(?:mp3|m4a|aac|wav|ogg|flac|mp4|webm)$/i.test(url.pathname) ||
    /\.json$/i.test(url.pathname) && url.pathname !== '/manifest.json';
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (isSensitiveOrDynamic(url)) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      try {
        const response = await fetch(request);
        if (response.ok && response.headers.get('content-type')?.includes('text/html') &&
            !/^\/(?:login|users|auth)(?:\/|$)/i.test(url.pathname)) {
          await cache.put(url.pathname === '/' ? '/' : request, response.clone());
        }
        return response;
      } catch (_) {
        const cached = await cache.match(request) || await cache.match('/');
        if (cached) return cached;
        return new Response(
          '<!doctype html><html lang="fa" dir="rtl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NightCast</title><body style="font-family:system-ui;max-width:36rem;margin:12vh auto;padding:1.5rem;line-height:2;text-align:center"><h1>اتصال اینترنت برقرار نیست</h1><p>برای استفاده از NightCast دوباره به اینترنت متصل شوید و صفحه را تازه‌سازی کنید.</p></body></html>',
          { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
        );
      }
    })());
    return;
  }

  const pathname = url.pathname;
  const cacheableAsset = /\.(?:css|js|png|jpe?g|webp|svg|ico|woff2?|ttf)$/i.test(pathname) ||
    pathname === '/manifest.json';
  if (!cacheableAsset) return;

  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    const networkPromise = fetch(request).then((response) => {
      if (response.ok && response.type === 'basic') cache.put(request, response.clone()).catch(() => {});
      return response;
    });
    if (cached) {
      event.waitUntil(networkPromise.catch(() => {}));
      return cached;
    }
    try { return await networkPromise; }
    catch (_) { return new Response('', { status: 504, statusText: 'Offline asset unavailable' }); }
  })());
});


// Push messages are sent by the configured Club notification dispatcher.
self.addEventListener('push', (event) => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch (_) {
    try { payload = { body: event.data.text() }; } catch (_) {}
  }
  const title = String(payload.title || 'NightCast · صدای تازه');
  const options = {
    body: String(payload.body || 'یک خبر تازه از رادیوی NightCast برایت داریم.'),
    icon: '/assets/icons/icon-512.png',
    badge: '/assets/icons/icon-512.png',
    data: { url: String(payload.url || '/') },
    tag: String(payload.tag || 'nightcast-update'),
    renotify: false
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = new URL(String(event.notification.data && event.notification.data.url || '/'), self.location.origin);
  if (target.origin !== self.location.origin) target.href = '/';
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
    for (const client of clients) {
      if ('focus' in client) {
        client.navigate(target.href);
        return client.focus();
      }
    }
    return self.clients.openWindow(target.href);
  }));
});
