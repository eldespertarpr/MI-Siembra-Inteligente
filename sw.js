// Versión de caché (cámbiala cuando hagas cambios grandes)
const CACHE = 'siembra-v16';

// Archivos base que se precargan al instalar
const FILES = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

// Instalar: precarga el “shell” de la app
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(FILES))
  );
  self.skipWaiting();
});

// Activar: borra cachés viejos
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first con guardado dinámico
self.addEventListener('fetch', e => {
  // Solo manejamos peticiones GET
  if (e.request.method !== 'GET') return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      // Si está en caché, lo devolvemos
      if (cached) return cached;

      // Si no, vamos a la red y guardamos una copia
      return fetch(e.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => {
            cache.put(e.request, copy);
          });
          return response;
        })
        .catch(() => {
          // Si falla la red, intentamos servir el shell
          return caches.match('./index.html');
        });
    })
  );
});
