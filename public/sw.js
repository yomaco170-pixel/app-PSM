// Service Worker DÉSACTIVÉ temporairement pour debug
// Le SW causait des erreurs avec les requêtes POST

self.addEventListener('install', (event) => {
  console.log('SW: Installation (désactivé)');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('SW: Activation (désactivé)');
  
  // Supprimer tous les caches existants
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('SW: Suppression cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// NE RIEN CACHER - Laisser passer toutes les requêtes
self.addEventListener('fetch', (event) => {
  // Ne rien faire - laisser le navigateur gérer
});
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
