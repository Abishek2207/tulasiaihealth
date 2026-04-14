/**
 * Service Worker for TulsiHealth PWA
 * Provides offline functionality and background sync
 */

const CACHE_NAME = 'TulsiHealth-v1.0.0';
const STATIC_CACHE = 'TulsiHealth-static-v1.0.0';
const DYNAMIC_CACHE = 'TulsiHealth-dynamic-v1.0.0';
const API_CACHE = 'TulsiHealth-api-v1.0.0';

// Static assets to cache immediately
const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/_next/static/css/app/layout.css',
  '/_next/static/chunks/webpack.js',
  '/_next/static/chunks/main-app.js',
  '/_next/static/chunks/app/_not-found.js'
];

// API endpoints to cache for offline use
const API_ENDPOINTS = [
  '/api/auth/user',
  '/api/terminology/search',
  '/api/rag/session',
  '/api/dashboard/stats'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Static assets cached');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && 
                cacheName !== DYNAMIC_CACHE && 
                cacheName !== API_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker: Activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - handle network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Handle API requests
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleApiRequest(request));
    return;
  }
  
  // Handle static assets
  if (STATIC_ASSETS.some(asset => url.pathname === asset || url.pathname.startsWith(asset))) {
    event.respondWith(handleStaticRequest(request));
    return;
  }
  
  // Handle navigation requests
  if (request.mode === 'navigate') {
    event.respondWith(handleNavigationRequest(request));
    return;
  }
  
  // Handle other requests with network-first strategy
  event.respondWith(handleDynamicRequest(request));
});

// Handle API requests with network-first, cache fallback
async function handleApiRequest(request) {
  const url = new URL(request.url);
  
  try {
    // Try network first for API requests
    const networkResponse = await fetch(request);
    
    // Cache successful GET requests
    if (networkResponse.ok && request.method === 'GET') {
      const cache = await caches.open(API_CACHE);
      // Clone response before caching
      const responseClone = networkResponse.clone();
      cache.put(request, responseClone);
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for API request, trying cache:', request.url);
    
    // Try cache for GET requests
    if (request.method === 'GET') {
      const cachedResponse = await caches.match(request);
      if (cachedResponse) {
        return cachedResponse;
      }
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({
        error: 'Offline',
        message: 'No network connection and no cached data available',
        timestamp: new Date().toISOString()
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
  }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Try network
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Failed to load static asset:', request.url);
    
    // Return offline fallback for images
    if (request.destination === 'image') {
      return new Response('', { status: 404 });
    }
    
    throw error;
  }
}

// Handle navigation requests
async function handleNavigationRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful HTML responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for navigation, trying cache');
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page
    const offlineResponse = await caches.match('/offline');
    if (offlineResponse) {
      return offlineResponse;
    }
    
    // Fallback offline response
    return new Response(
      `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Offline - TulsiHealth</title>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #000;
              color: #fff;
              margin: 0;
              padding: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
            }
            .offline-container {
              text-align: center;
              max-width: 400px;
            }
            .icon {
              width: 80px;
              height: 80px;
              background: linear-gradient(45deg, #2e9a2e, #14532d);
              border-radius: 20px;
              display: flex;
              align-items: center;
              justify-content: center;
              margin: 0 auto 20px;
              font-size: 32px;
              font-weight: bold;
            }
            h1 { margin: 0 0 10px; }
            p { color: #999; line-height: 1.6; }
            .retry-btn {
              background: #2e9a2e;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 8px;
              font-size: 16px;
              cursor: pointer;
              margin-top: 20px;
            }
            .retry-btn:hover { background: #268326; }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="icon">TH</div>
            <h1>You're Offline</h1>
            <p>TulsiHealth is currently unavailable. Please check your internet connection and try again.</p>
            <button class="retry-btn" onclick="window.location.reload()">Retry</button>
          </div>
        </body>
      </html>
      `,
      {
        status: 200,
        statusText: 'OK',
        headers: {
          'Content-Type': 'text/html'
        }
      }
    );
  }
}

// Handle dynamic requests with network-first strategy
async function handleDynamicRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Network failed for dynamic request, trying cache');
    
    // Try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    throw error;
  }
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync-patients') {
    event.waitUntil(syncPatientData());
  } else if (event.tag === 'background-sync-audit') {
    event.waitUntil(syncAuditLogs());
  }
});

// Sync patient data when back online
async function syncPatientData() {
  try {
    // Get offline patient data from IndexedDB
    const offlineData = await getOfflinePatientData();
    
    for (const data of offlineData) {
      try {
        const response = await fetch('/api/patients', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${data.token}`
          },
          body: JSON.stringify(data.patient)
        });
        
        if (response.ok) {
          // Remove from offline storage
          await removeOfflinePatientData(data.id);
          console.log('Service Worker: Synced patient data:', data.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync patient data:', data.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error);
  }
}

// Sync audit logs when back online
async function syncAuditLogs() {
  try {
    const offlineLogs = await getOfflineAuditLogs();
    
    for (const log of offlineLogs) {
      try {
        const response = await fetch('/api/audit/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${log.token}`
          },
          body: JSON.stringify(log.auditLog)
        });
        
        if (response.ok) {
          await removeOfflineAuditLog(log.id);
          console.log('Service Worker: Synced audit log:', log.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to sync audit log:', log.id, error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Audit sync failed:', error);
  }
}

// Push notification handler
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from TulsiHealth',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('TulsiHealth', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received');
  
  event.notification.close();
  
  if (event.action === 'explore') {
    // Open the app to relevant page
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    event.notification.close();
  } else {
    // Default action - open app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// IndexedDB helpers (simplified - in production, use Dexie.js)
async function getOfflinePatientData() {
  // This would interact with IndexedDB
  return [];
}

async function removeOfflinePatientData(id) {
  // This would remove from IndexedDB
  return Promise.resolve();
}

async function getOfflineAuditLogs() {
  // This would interact with IndexedDB
  return [];
}

async function removeOfflineAuditLog(id) {
  // This would remove from IndexedDB
  return Promise.resolve();
}

// Periodic background sync (if supported)
if ('periodicSync' in self.registration) {
  self.addEventListener('periodicsync', (event) => {
    console.log('Service Worker: Periodic sync triggered');
    
    if (event.tag === 'periodic-sync-data') {
      event.waitUntil(
        // Refresh cached data periodically
        caches.keys().then((cacheNames) => {
          return Promise.all(
            cacheNames.map((cacheName) => {
              if (cacheName.startsWith('TulsiHealth-')) {
                return caches.delete(cacheName);
              }
            })
          );
        })
      );
    }
  });
}

// Message handler for communication with app
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  } else if (event.data && event.data.type === 'FORCE_REFRESH') {
    // Force refresh of all caches
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        // Notify all clients
        return self.clients.matchAll();
      }).then((clients) => {
        clients.forEach((client) => {
          client.postMessage({ type: 'CACHE_CLEARED' });
        });
      })
    );
  }
});

console.log('Service Worker: Loaded successfully');
