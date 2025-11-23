const CACHE='siembra-v10';
const FILES=['./','./index.html','./manifest.json','./icons/icon-192.png','./icons/icon-512.png',
'./img/aji.jpg','./img/pimiento.jpg','./img/cilantrillo.jpg','./img/recao.jpg','./img/tomate.jpg',
'./img/lechuga.jpg','./img/cebolla.jpg','./img/menta.jpg','./img/zanahoria.jpg'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)));});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});