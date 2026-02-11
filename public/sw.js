// Service Worker pour KARL CRM PWA
const CACHE_NAME = 'karl-crm-v1';
const urlsToCache = [
  '/',
  '/static/karl-app.js',
  '/static/styles.css',
  '/manifest.json'
  // NE PAS CACHER LES CDN EXTERNES (CORS)
];

// Installation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
});

// Activation
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Suppression ancien cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch - Ignorer les requêtes externes (CDN, etc.)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Ignorer les requêtes externes (CDN, Google, etc.)
  if (url.origin !== self.location.origin) {
    return; // Laisser le navigateur gérer
  }
  
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Clone la réponse
        const responseClone = response.clone();
        
        // Met en cache la réponse
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        // Si réseau échoue, utilise le cache
        return caches.match(event.request);
      })
  );
});
