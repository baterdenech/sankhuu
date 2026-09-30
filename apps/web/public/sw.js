/* Sankhuu service worker: хуудсууд network-first (offline бол кэш, дараа нь /offline),
   _next/static ба дүрсүүд cache-first, зургууд stale-while-revalidate (150 хүртэл). */
const VERSION = "v1";
const SHELL = `sankhuu-shell-${VERSION}`;
const STATIC = `sankhuu-static-${VERSION}`;
const IMAGES = `sankhuu-images-${VERSION}`;
const OFFLINE_URL = "/offline";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll([OFFLINE_URL, "/icons/icon-192.png", "/icons/icon-512.png"])).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith("sankhuu-") && ![SHELL, STATIC, IMAGES].includes(k)).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) await Promise.all(keys.slice(0, keys.length - max).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  // Хуудас: network-first
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok && url.origin === self.location.origin) caches.open(SHELL).then((c) => c.put(req, res.clone()));
          return res;
        })
        .catch(async () => (await caches.match(req)) || (await caches.match(OFFLINE_URL))),
    );
    return;
  }

  // Next-ийн hash-тай static файлууд: cache-first
  if (url.origin === self.location.origin && (url.pathname.startsWith("/_next/static/") || url.pathname.startsWith("/icons/"))) {
    event.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((res) => (caches.open(STATIC).then((c) => c.put(req, res.clone())), res))));
    return;
  }

  // Зураг (бараа, лого, Unsplash, Supabase Storage): stale-while-revalidate
  if (req.destination === "image") {
    event.respondWith(
      caches.open(IMAGES).then(async (cache) => {
        const hit = await cache.match(req);
        const fresh = fetch(req)
          .then((res) => {
            if (res.ok || res.type === "opaque") cache.put(req, res.clone()).then(() => trimCache(IMAGES, 150));
            return res;
          })
          .catch(() => hit);
        return hit || fresh;
      }),
    );
  }
});
