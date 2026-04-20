// Service Worker DÉSACTIVÉ - Ne cache rien pour éviter les problèmes de version obsolète
// Si tu réactives le cache, pense à incrémenter la version des assets (?v=...)

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Supprimer tous les anciens caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
    }).then(() => self.clients.claim())
  );
});

// NE RIEN CACHER - Laisser passer toutes les requêtes au réseau
self.addEventListener('fetch', (event) => {
  // Pas d'interception : fetch natif du navigateur
});
