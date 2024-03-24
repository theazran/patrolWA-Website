const CACHE_NAME = "patrolwa-cache";
const urlsToCache = [
  "/manifest.json",
  "/icon-192x192.png",
  "/icon-512x512.png",
  "/serviceworker.js",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return (
        response ||
        fetch(event.request).catch(() => {
          return new Response("Anda sedang offline", {
            status: 503,
            statusText: "Offline",
          });
        })
      );
    })
  );
});
