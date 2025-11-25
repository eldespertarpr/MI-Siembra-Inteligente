// Service Worker para Mi Siembra Inteligente (v14)
const CACHE_NAME = 'mi-siembra-cache-v14';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './sw.js'
];

// Instalar: precargar lo básico
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

// Activar: limpiar versiones viejas
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
});

// Fetch: cache-first con actualización en segundo plano
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cacheRes) => {
      const fetchPromise = fetch(event.request)
        .then((networkRes) => {
          // Guardar en caché respuestas básicas OK (html, js, css, imágenes del mismo origen)
          if (
            networkRes &&
            networkRes.status === 200 &&
            networkRes.type === 'basic'
          ) {
            const resClone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) =>
              cache.put(event.request, resClone)
            );
          }
          return networkRes;
        })
        .catch(() => {
          // Si falla la red, usar lo que haya en caché
          if (cacheRes) return cacheRes;
          // Si es navegación y no hay nada, devolver index
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });

      // Respuesta rápida: lo que haya en caché o, si no, la red
      return cacheRes || fetchPromise;
    })
  );
});
