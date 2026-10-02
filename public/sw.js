// Service Worker para ESPOCH Pass PWA
const CACHE_NAME = 'espochpass-v5';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/avatar.png',
  '/carnet/1.svg',
  '/carnet/2.svg',
  '/carnet/3.svg',
  '/carnet/4.svg',
  '/carnet/5.svg',
  '/carnet/6.svg',
  '/icons/icon-192x192.svg',
  '/icons/icon-512x512.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Algunos recursos estáticos no pudieron precachearse:', err);
      });
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Ignorar peticiones que no sean GET o que sean a endpoints de autenticación CAS externa
  if (event.request.method !== 'GET' || event.request.url.includes('seguridad.espoch.edu.ec')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Devolver recurso de caché y actualizar en segundo plano
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        // Si no hay red y es una navegación HTML, devolver index.html de caché
        if (event.request.headers.get('accept')?.includes('text/html')) {
          return caches.match('/index.html');
        }
      });
    })
  );
});
