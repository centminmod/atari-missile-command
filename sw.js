// sw.js - Service Worker for Missile Command PWA

// Increment the cache version when you update assets
const CACHE_NAME = 'missile-command-cache-v2';
const urlsToCache = [
  '/', // Cache the root directory (often serves index.html)
  '/index.html', // Explicitly cache index.html
  '/manifest.json', // Cache the manifest file
  '/icons/android-launchericon-512-512.png',
  '/icons/android-launchericon-192-192.png',
  '/icons/android-launchericon-144-144.png',
  '/icons/android-launchericon-96-96.png',
  '/icons/android-launchericon-72-72.png',
  '/icons/android-launchericon-48-48.png',

  // Cache the Google Font CSS (using no-cors mode)
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
];

// --- Installation Event ---
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event - v2'); // Log version
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Opened cache:', CACHE_NAME);
        // Map URLs to Promises for caching
        const cachePromises = urlsToCache.map(urlToCache => {
            let request = new Request(urlToCache);
            // Use 'no-cors' for cross-origin requests like Google Fonts
            // This allows caching but treats the response as opaque
            if (urlToCache.startsWith('https://')) {
                request = new Request(urlToCache, { mode: 'no-cors' });
            }
            // Add the request to the cache
            return cache.add(request).catch(err => {
                // Log caching errors for individual files
                console.warn(`[Service Worker] Failed to cache ${urlToCache}:`, err);
            });
        });
        // Wait for all caching operations to complete
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[Service Worker] All specified URLs attempted to cache.');
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Caching failed during install:', error);
      })
  );
});

// --- Activation Event ---
// Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event - v2'); // Log version
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
// Cache-First strategy
self.addEventListener('fetch', (event) => {
  // console.log('[Service Worker] Fetching:', event.request.url);
  event.respondWith(
    caches.match(event.request) // Check cache first
      .then((response) => {
        // Return cached response if found
        if (response) {
          // console.log('[Service Worker] Found in cache:', event.request.url);
          return response;
        }
        // Fetch from network if not in cache
        // console.log('[Service Worker] Not in cache, fetching from network:', event.request.url);
        return fetch(event.request); // No dynamic caching in this version
      })
      .catch((error) => {
        console.error('[Service Worker] Fetch failed:', error);
        // Optional: return an offline fallback page here if desired
        // return caches.match('/offline.html');
      })
  );
});
