// sw.js - Service Worker for Missile Command PWA

const CACHE_NAME = 'missile-command-cache-v1'; // Change version to force update cache
const urlsToCache = [
  '/', // Cache the root directory (often serves index.html)
  '/index.html', // Explicitly cache index.html
  '/manifest.json', // Cache the manifest file
  // Add any other essential assets here if they were external
  // e.g., '/css/style.css', '/js/game-logic.js', '/images/logo.png'
  // Since your game seems self-contained in index.html, we mainly need the core files.
  // We also need to cache the Google Font request if possible, but cross-origin requests can be tricky.
  // A simple approach is to let the browser handle font caching, or download the font and serve it locally.
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap', // Cache the font CSS
  // Note: Caching the actual font file (woff2) loaded by the above CSS might require more complex handling
  // due to cross-origin restrictions. Often, letting the browser cache it is sufficient.
];

// --- Installation Event ---
// This runs when the service worker is first installed.
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  // Perform install steps: open cache and add files
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Opened cache:', CACHE_NAME);
        // Use addAll for atomic operation (if one fails, none are added)
        // Use { mode: 'no-cors' } for opaque responses like the Google Font CSS,
        // but be aware this means you can't check if the caching was successful.
        const cachePromises = urlsToCache.map(urlToCache => {
            // Special handling for cross-origin requests like Google Fonts
            if (urlToCache.startsWith('https://')) {
                return cache.add(new Request(urlToCache, { mode: 'no-cors' }));
            }
            // Standard caching for same-origin requests
            return cache.add(urlToCache);
        });
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[Service Worker] All specified URLs cached successfully.');
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Caching failed during install:', error);
      })
  );
});

// --- Activation Event ---
// This runs after install, when the service worker becomes active.
// It's a good place to clean up old caches.
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete caches that are not the current one
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      // Take control of currently open pages immediately.
      return self.clients.claim();
    })
  );
});

// --- Fetch Event ---
// This runs every time the browser tries to fetch a resource (HTML, CSS, JS, images, etc.).
// We intercept the request and check the cache first.
self.addEventListener('fetch', (event) => {
  // console.log('[Service Worker] Fetching:', event.request.url);

  // Use a Cache-First strategy
  event.respondWith(
    caches.match(event.request) // Check if the request is in the cache
      .then((response) => {
        // If found in cache, return the cached response
        if (response) {
          // console.log('[Service Worker] Found in cache:', event.request.url);
          return response;
        }

        // If not in cache, fetch from the network
        // console.log('[Service Worker] Not in cache, fetching from network:', event.request.url);
        return fetch(event.request)
          .then((networkResponse) => {
            // Optional: Cache the newly fetched resource for future offline use.
            // Be careful caching everything, especially dynamic content or large files.
            // We only cache our core assets during install, so we won't cache dynamically here
            // unless we specifically want to (e.g., caching game progress data if stored via fetch).

            // Check if we received a valid response before cloning
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' && networkResponse.type !== 'cors') {
                 // Don't cache opaque responses fetched dynamically unless necessary
                 // console.log('[Service Worker] Not caching non-basic/non-cors/error response:', event.request.url, networkResponse.type);
                 return networkResponse;
            }

            // Example: If you wanted to cache *everything* fetched (use with caution)
            /*
            const responseToCache = networkResponse.clone(); // Clone response because it can only be consumed once
            caches.open(CACHE_NAME)
              .then((cache) => {
                console.log('[Service Worker] Caching new resource:', event.request.url);
                cache.put(event.request, responseToCache);
              });
            */

            return networkResponse; // Return the network response
          })
          .catch((error) => {
            console.error('[Service Worker] Fetch failed; returning offline page or error:', error);
            // Optional: Return a custom offline fallback page if the network fails
            // return caches.match('/offline.html');
            // Or just let the browser handle the fetch error
          });
      })
  );
});
