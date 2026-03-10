// Service Worker for Lets Do It PWA
// Optimized for fast loading - v9.0 (Dark Mode Support)
const CACHE_NAME = 'letsdoit-v9.0';
const RUNTIME_CACHE = 'letsdoit-runtime-v9.0';

// Install event - skip waiting immediately
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing v9.0 (Dark Mode Support)...');
  self.skipWaiting();
  
  // Notify clients about the new version
  event.waitUntil(
    self.clients.matchAll().then((clients) => {
      clients.forEach((client) => {
        client.postMessage({
          type: 'SW_UPDATED',
          version: '9.0'
        });
      });
    })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating v9.0 (Dark Mode Support)...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
            console.log('Service Worker: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: v9.0 activated with dark mode support');
      return self.clients.claim();
    }).then(() => {
      // Notify all clients that SW is ready
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          client.postMessage({
            type: 'SW_READY',
            version: '9.0'
          });
        });
      });
    })
  );
});

// Fetch event - OPTIMIZED for speed
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;
  
  // Skip non-http requests
  if (!event.request.url.startsWith('http')) return;

  // Skip Firebase API calls - always get fresh
  if (event.request.url.includes('firestore.googleapis.com') || 
      event.request.url.includes('firebase')) {
    return;
  }

  event.respondWith(
    // Try cache first for static assets
    caches.match(event.request).then((cachedResponse) => {
      // Return cached response immediately if found
      if (cachedResponse) {
        // Update cache in background
        fetch(event.request).then((response) => {
          if (response && response.status === 200) {
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, response);
            });
          }
        }).catch(() => {});
        
        return cachedResponse;
      }

      // Not in cache, fetch from network
      return fetch(event.request).then((response) => {
        if (!response || response.status !== 200) {
          return response;
        }

        // Cache the response
        const responseToCache = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return response;
      }).catch(() => {
        // Network failed, return offline page for navigation
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
      });
    })
  );
});

// Listen for messages
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});