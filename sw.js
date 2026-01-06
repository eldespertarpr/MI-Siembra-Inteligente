/* sw.js */
const CACHE_NAME = "msi-v17-04"; // <-- SUBE ESTO cuando hagas cambios
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./img/placeholder.jpg"
];

// Instala y cachea lo básico
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      // addAll puede fallar si 1 asset no existe; esto te deja ver mejor el error
      await cache.addAll(CORE_ASSETS);
    })()
  );
});

// Activa y borra caches viejos
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => (k !== CACHE_NAME ? caches.delete(k) : null)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Solo mismo origen
  if (url.origin !== self.location.origin) return;

  // Solo GET (evita problemas con POST/PUT/etc)
  if (req.method !== "GET") return;

  // NO cachear /sw.js (evita que se quede “pegado”)
  if (url.pathname.endsWith("/sw.js")) return;

  // HTML / navegación -> Network first + fallback
  const accept = req.headers.get("accept") || "";
  const isHTML = req.mode === "navigate" || accept.includes("text/html");

  if (isHTML) {
    event.respondWith((async () => {
      try {
        // Importante: esto evita “caches viejos” cuando Github sirve algo raro
        const fresh = await fetch(req, { cache: "no-store" });

        // Cachea como index.html (clave estable) para que el fallback funcione
        const cache = await caches.open(CACHE_NAME);
        cache.put("./index.html", fresh.clone());

        return fresh;
      } catch (err) {
        // Fallback offline
        const cachedIndex = await caches.match("./index.html");
        return cachedIndex || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      }
    })());
    return;
  }

  // Assets (css/js/img/font) -> Cache first + rellena cache
  event.respondWith((async () => {
    const cached = await caches.match(req);
    if (cached) return cached;

    const fresh = await fetch(req);
    // Cachea solo si fue exitoso
    if (fresh && fresh.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(req, fresh.clone());
    }
    return fresh;
  })());
});
