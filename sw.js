const CACHE_NAME = 'daily-weigh-buddy-v1.2';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// Instalar el Service Worker
self.addEventListener('install', function(event) {
  console.log('Service Worker instalando...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Cache abierto');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('Todos los recursos han sido cacheados');
        return self.skipWaiting();
      })
  );
});

// Activar el Service Worker
self.addEventListener('activate', function(event) {
  console.log('Service Worker activado');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Eliminando cache antigua:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Interceptar solicitudes
self.addEventListener('fetch', function(event) {
  if (!event.request.url.startsWith('http')) {
    return;
  }
  
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // Devuelve la respuesta en cache o busca en la red
        return response || fetch(event.request)
          .then(function(response) {
            // No cacheamos respuestas que no sean válidas
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clonamos la respuesta para guardarla en cache
            var responseToCache = response.clone();

            caches.open(CACHE_NAME)
              .then(function(cache) {
                cache.put(event.request, responseToCache);
              });

            return response;
          })
          .catch(function(error) {
            console.log('Error en fetch:', error);
            // Puedes devolver una página offline personalizada aquí
          });
      })
  );
});

// Manejar mensajes desde la aplicación
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
