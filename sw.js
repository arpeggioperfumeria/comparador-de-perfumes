// Comparador Arpeggio — service worker: guarda la página para abrirla sin internet.
// crear_comparador.py cambia VERSION cada vez que cambia la página, así el celular baja lo nuevo.
const VERSION = '76402e6324';
const BASE = 'comparador-' + VERSION;
const FUENTES = 'comparador-fuentes';

const ARCHIVOS = [
  './', 'index.html', 'manifest.webmanifest',
  'iconos/icono-192.png', 'iconos/icono-512.png', 'iconos/icono-maskable-512.png',
  'iconos/apple-touch-icon.png', 'iconos/favicon-32.png',
];

self.addEventListener('install', e => {
  // cache: 'reload' evita que se guarde una copia vieja que el navegador tenía en memoria.
  e.waitUntil(caches.open(BASE)
    .then(c => c.addAll(ARCHIVOS.map(u => new Request(u, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== BASE && k !== FUENTES) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Letras de Google: se guardan la primera vez que se usan.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(caches.open(FUENTES).then(async c => {
      const hit = await c.match(req);
      const red = fetch(req).then(r => { c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || red;
    }));
    return;
  }
  if (url.origin !== location.origin) return;

  // Primero lo guardado (la página pesa ~8 MB, así abre al instante);
  // la versión nueva llega cuando cambia VERSION en este archivo.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req)));
});
