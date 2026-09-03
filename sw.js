// Service worker de Click Shooter. Sirve para dos cosas: 1) sin esto el
// navegador no ofrece "Instalar" (es uno de los requisitos), y 2) de paso
// deja el juego guardado para poder abrirlo sin conexion.
const CACHE = 'click-shooter-v11';
const ARCHIVOS = ['click-shooter.html', 'manifest.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  // Al subir una version nueva (CACHE cambia de nombre), se borran las
  // cachés viejas para no dejar basura acumulandose.
  e.waitUntil(
    caches.keys().then(claves =>
      Promise.all(claves.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // El HTML del juego va "red primero": asi un arreglo pequeño llega sin tener
  // que subir tambien el numero de version de esta caché. Si no hay red, se
  // sirve la copia guardada. Todo lo demas (iconos, manifest) va "caché primero".
  const esHtml = e.request.mode === 'navigate'
    || url.pathname.endsWith('/') || url.pathname.endsWith('click-shooter.html');
  if (esHtml) {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          const copia = resp.clone();
          caches.open(CACHE).then(c => c.put('click-shooter.html', copia)).catch(() => {});
          return resp;
        })
        .catch(() => caches.match('click-shooter.html').then(r => r || caches.match(e.request)))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(guardado => guardado || fetch(e.request))
  );
});
