const CACHE_NAME = 'cool-cache-v1';

// Add whichever assets you want to precache here:
// Modified slightly from PWA Builder to work properly with Vite structure
const PRECACHE_ASSETS = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon-3.png'
];

// Listener for the install event - precaches our assets list on service worker install.
self.addEventListener('install', event => {
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE_NAME);
        try {
            await cache.addAll(PRECACHE_ASSETS);
        } catch (e) {
            console.error('Service Worker pre-cache error:', e);
        }
    })());
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  // Bypass cache for Socket.io or APIs to ensure real-time games aren't affected
  if (!event.request.url.startsWith('http') || event.request.url.includes('/socket.io/')) {
      return;
  }

  event.respondWith(async function() {
      const cache = await caches.open(CACHE_NAME);

      // match the request to our cache
      const cachedResponse = await cache.match(event.request);

      // check if we got a valid response
      if (cachedResponse !== undefined) {
          // Cache hit, return the resource
          return cachedResponse;
      } else {
        // Otherwise, go to the network
        return fetch(event.request).then((response) => {
            // Dynamically cache new GET valid responses (so downloaded assets get cached locally)
            if (event.request.method === 'GET' && response.status === 200) {
                cache.put(event.request, response.clone());
            }
            return response;
        }).catch(() => {
            // Offline fallback if needed
            return new Response('Network error handler', { status: 503, statusText: 'Offline' });
        });
      }
  }());
});
