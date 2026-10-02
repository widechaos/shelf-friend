const CACHE = "shelf-friend-v3";
const SHELL = [
  "./",
  "./index.html",
  "./style.css",
  "./app.js",
  "./math.js",
  "./guides.json",
  "./retrieval-worker.js",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith("shelf-friend-") && key !== CACHE)
          await caches.delete(key);
      await self.clients.claim();
    })(),
  ),
);
self.addEventListener("fetch", (e) => {
  const u = new URL(e.request.url);
  if (
    e.request.method !== "GET" ||
    (!["cdn.jsdelivr.net", "huggingface.co", "cdn-lfs.huggingface.co"].includes(
      u.hostname,
    ) &&
      u.origin !== self.location.origin)
  )
    return;
  e.respondWith(
    (async () => {
      const c = await caches.open(CACHE);
      const hit = await c.match(e.request);
      if (hit) return hit;
      const r = await fetch(e.request);
      if (r.ok) {
        try {
          await c.put(e.request, r.clone());
        } catch {}
      }
      return r;
    })(),
  );
});
