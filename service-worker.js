const CACHE_NAME = "nightcast-v2";

const APP_SHELL = [
  "/",
  "/index.html",
  "/manifest.json",
  "/assets/icons/icon-192.png",
  "/assets/icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Audio is streamed directly and never cached by this service worker.
  if (/\.(mp3|m4a|aac|ogg|wav)(?:$|\?)/i.test(url.pathname)) return;

  // Do not intercept cross-origin requests such as the API or CDN.
  if (url.origin !== self.location.origin) return;

  const isDocument = request.mode === "navigate" || request.destination === "document";
  const isCodeOrData = /\.(html?|js|mjs|css|json|xml)(?:$|\?)/i.test(url.pathname);

  // Always try the network first for HTML, JavaScript, CSS and data files.
  // This prevents old cached code/data from surviving a deployment.
  if (isDocument || isCodeOrData) {
    event.respondWith(
      fetch(request, { cache: "no-store" }).then((response) => {
        if (response && response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      }).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        if (isDocument) {
          const shell = await caches.match("/index.html");
          if (shell) return shell;
        }
        return new Response("Offline: resource unavailable", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" }
        });
      })
    );
    return;
  }

  // Cache-first for versioned/static images and other non-code assets.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response && response.status === 200 && response.type !== "opaque") {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
