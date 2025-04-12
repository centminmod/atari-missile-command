// sw.js - Service Worker for Missile Command PWA

// --- Configuration ---
// Increment this version number when you update assets or caching logic
const APP_VERSION = 'v27'; // Incremented version
const CACHE_NAME = `missile-command-cache-${APP_VERSION}`;
const DATA_CACHE_NAME = `missile-command-data-cache-${APP_VERSION}`; // Separate cache for dynamic data

// List of core static assets to cache on installation
const CORE_ASSETS_TO_CACHE = [
  '/', // Cache the root directory
  '/index.html', // Explicitly cache index.html
  '/manifest.json', // Cache the manifest file
  // Icons
  '/icons/android-launchericon-512-512.png',
  '/icons/android-launchericon-192-192.png',
  '/icons/android-launchericon-144-144.png',
  '/icons/android-launchericon-96-96.png',
  '/icons/android-launchericon-72-72.png',
  '/icons/android-launchericon-48-48.png',
  // CSS & Fonts
  '/css/fonts.css',
  '/fonts/press-start-2p-v15-latin-regular.woff2',
  '/fonts/press-start-2p-v15-latin-regular.ttf',
  // Audio
  '/audio/explosion.mp3',
  '/audio/launch.mp3',
  '/audio/music-lowest.mp3',
  // Add any other static assets here
  '/favicon.ico'
];

// --- Installation Event ---
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Install event - ${APP_VERSION}`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log(`[Service Worker] Caching core assets in: ${CACHE_NAME}`);
        // Use addAll for simpler bulk caching of core assets
        return cache.addAll(CORE_ASSETS_TO_CACHE);
      })
      .then(() => {
        console.log('[Service Worker] Core assets cached successfully.');
        // Force the waiting service worker to become the active service worker
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Core asset caching failed during install:', error);
        // Optional: Decide if install should fail if core assets don't cache
      })
  );
});

// --- Activation Event ---
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] Activate event - ${APP_VERSION}`);
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete caches that are not the current static or data cache
          if (cacheName !== CACHE_NAME && cacheName !== DATA_CACHE_NAME && cacheName.startsWith('missile-command-')) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      // Take control of any currently open pages
      return self.clients.claim();
    }).catch((error) => {
      console.error('[Service Worker] Cache cleanup or claiming clients failed during activate:', error);
    })
  );
});

// --- Fetch Event ---
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // Strategy for API calls (e.g., leaderboard) - Network First, fallback to Cache
  if (requestUrl.pathname.startsWith('/scores') || requestUrl.pathname.startsWith('/game-secret')|| requestUrl.pathname.startsWith('/api')) {
    event.respondWith(
      caches.open(DATA_CACHE_NAME).then((cache) => {
        return fetch(event.request)
          .then((networkResponse) => {
            // Only cache GET requests, not POST requests
            if (event.request.method === 'GET') {
              // Need to clone the response stream as it can only be consumed once
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          })
          .catch((error) => {
            // If network fetch fails (e.g., offline), try to get from cache
            console.warn('[Service Worker] Network fetch failed for API, trying cache:', event.request.url, error);
            return cache.match(event.request).then(response => {
              if (response) {
                // console.log('[Service Worker] Serving API from cache:', event.request.url);
                return response;
              }
              // Optional: Return a custom offline response for the API if not in cache
              console.error('[Service Worker] API not in cache and network failed:', event.request.url);
              // For now, just let the fetch error propagate if not in cache
              return undefined; // Or throw error
            });
          });
      })
    );
  }
  // Strategy for Static Assets (Core assets cached during install) - Cache First
  else {
    // console.log('[Service Worker] Handling static asset request (Cache First):', event.request.url);
    event.respondWith(
      caches.match(event.request, { cacheName: CACHE_NAME }) // Look only in the static asset cache
        .then((response) => {
          // Return cached response if found
          if (response) {
            // console.log('[Service Worker] Found static asset in cache:', event.request.url);
            return response;
          }

          // Fetch from network if not in cache (e.g., for assets not listed in CORE_ASSETS_TO_CACHE)
          // console.log('[Service Worker] Static asset not in cache, fetching from network:', event.request.url);
          // Note: This part doesn't dynamically cache *new* static assets found.
          // If you add new images/css/js later, you need to update APP_VERSION
          // and add them to CORE_ASSETS_TO_CACHE for them to be cached reliably.
          return fetch(event.request);
        })
        .catch((error) => {
          console.error('[Service Worker] Fetch failed for static asset:', error, event.request.url);
          // Optional: Provide a fallback for core assets if needed
        })
    );
  }
});
