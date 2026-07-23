const CACHE_NAME = "nightcast-v1.0.0";

const ASSETS = [

  "/",
  "/index.html",

  "/assets/css/style.css",

  "/assets/js/app.js",
  "/assets/js/feed.js",

  "/manifest.json",

  "/assets/icons/logo.svg",
  "/assets/icons/menu.svg",
  "/assets/icons/search.svg",
  "/assets/icons/user.svg",

  "/assets/icons/youtube.svg",
  "/assets/icons/aparat.svg",
  "/assets/icons/telegram.svg",
  "/assets/icons/instagram.svg",

  "/assets/images/hero.webp",
  "/assets/images/placeholder.webp"

];


/* ========================= */

self.addEventListener("install",(event)=>{

event.waitUntil(

caches.open(CACHE_NAME)

.then(cache=>cache.addAll(ASSETS))

);

self.skipWaiting();

});


/* ========================= */

self.addEventListener("activate",(event)=>{

event.waitUntil(

caches.keys().then(keys=>{

return Promise.all(

keys

.filter(key=>key!==CACHE_NAME)

.map(key=>caches.delete(key))

);

})

);

self.clients.claim();

});


/* ========================= */

self.addEventListener("fetch",(event)=>{

event.respondWith(

caches.match(event.request)

.then(response=>{

return response || fetch(event.request);

})

);

});
