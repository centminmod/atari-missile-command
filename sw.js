// sw.js - Service Worker for Missile Command PWA

// --- Configuration ---
// Increment this version number when you update any assets in urlsToCache
const APP_VERSION = 'v53';
const CACHE_NAME = `missile-command-cache-${APP_VERSION}`;

// List of assets to cache on installation
const urlsToCache = [
  '/', // Cache the root directory (often serves index.html)
  '/index.html', // Explicitly cache index.html
  '/manifest.json', // Cache the manifest file
  // Add other core assets like icons, main CSS, main JS if needed
  '/icons/android-launchericon-512-512.png',
  '/icons/android-launchericon-192-192.png',
  '/icons/android-launchericon-144-144.png',
  '/icons/android-launchericon-96-96.png',
  '/icons/android-launchericon-72-72.png',
  '/icons/android-launchericon-48-48.png',
  '/css/fonts.css',
  '/fonts/press-start-2p-v15-latin-regular.woff2',
  '/fonts/press-start-2p-v15-latin-regular.ttf'
];

// --- Installation Event ---
// Fired when the service worker is first installed or updated
self.addEventListener('install', (event) => {
  console.log(`[Service Worker] Install event - ${APP_VERSION}`);
  // Perform install steps: Caching core assets
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log(`[Service Worker] Opened cache: ${CACHE_NAME}`);
        // Map URLs to Promises for caching
        const cachePromises = urlsToCache.map(urlToCache => {
          let request = new Request(urlToCache);
          // Use 'no-cors' for cross-origin requests like Google Fonts
          // This allows caching but treats the response as opaque (cannot read content)
          if (urlToCache.startsWith('https://')) {
            request = new Request(urlToCache, { mode: 'no-cors' });
          }
          // Add the request to the cache
          return cache.add(request).catch(err => {
            // Log caching errors for individual files but don't fail the whole install
            console.warn(`[Service Worker] Failed to cache ${urlToCache}:`, err);
          });
        });
        // Wait for all caching operations to complete
        return Promise.all(cachePromises);
      })
      .then(() => {
        console.log('[Service Worker] All specified URLs attempted to cache.');
        // Force the waiting service worker to become the active service worker immediately.
        // This ensures updates are applied faster, but requires careful handling
        // if the page relies on specific resources from the *old* service worker.
        return self.skipWaiting();
      })
      .catch((error) => {
        // If any critical caching fails (Promise.all rejects), the install fails.
        console.error('[Service Worker] Caching failed during install:', error);
      })
  );
});

// --- Activation Event ---
// Fired after installation & when the service worker takes control.
// Used to clean up old caches.
self.addEventListener('activate', (event) => {
  console.log(`[Service Worker] Activate event - ${APP_VERSION}`);
  // Clean up old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Delete caches that belong to this app but are not the current version
          if (cacheName.startsWith('missile-command-cache-') && cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[Service Worker] Claiming clients');
      // Take control of any currently open pages that match the service worker's scope
      // This is necessary when using skipWaiting() to ensure the new worker controls existing tabs.
      return self.clients.claim();
    }).catch((error) => {
      console.error('[Service Worker] Cache cleanup or claiming clients failed during activate:', error);
    })
  );
});

// --- Fetch Event ---
// Fired whenever the app requests a resource (HTML, CSS, JS, images, API calls, etc.)
self.addEventListener('fetch', (event) => {
  // Using a Cache-First strategy:
  // 1. Check the cache for a matching request.
  // 2. If found, return the cached response.
  // 3. If not found, fetch from the network.
  // Note: This strategy doesn't automatically update cached files from the network
  // unless the service worker itself is updated (triggering install/activate).
  event.respondWith(
    caches.match(event.request) // Check the cache defined by CACHE_NAME
      .then((response) => {
        // Return cached response if found
        if (response) {
          // console.log('[Service Worker] Found in cache:', event.request.url);
          return response;
        }
        // Fetch from network if not in cache
        // console.log('[Service Worker] Not in cache, fetching from network:', event.request.url);
        // Important: This basic version doesn't dynamically cache network responses.
        // If you wanted to cache *new* resources encountered during runtime,
        // you would need to clone the fetch response and put it into the cache here.
        return fetch(event.request);
      })
      .catch((error) => {
        console.error('[Service Worker] Fetch failed:', error);
        // Optional: Provide a fallback page for navigation requests if offline
        // if (event.request.mode === 'navigate') {
        //   return caches.match('/offline.html'); // Make sure '/offline.html' is cached during install
        // }
        // For other types of requests, just let the error propagate
      })
  );
});