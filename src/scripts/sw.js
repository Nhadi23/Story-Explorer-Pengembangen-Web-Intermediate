const CACHE_NAME = 'story-explorer-v1';
const urlsToCache = [
  '/',
  '/app.bundle.js',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching app shell');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Strategy: Network First, fallback to Cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome extension requests
  if (url.protocol === 'chrome-extension:') return;

  // API requests: Network First
  if (url.origin === 'https://story-api.dicoding.dev') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response and cache it
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fallback to cache
          return caches.match(request);
        })
    );
    return;
  }

  // MapTiler requests: Cache First
  if (url.origin.includes('maptiler.com')) {
    event.respondWith(
      caches.match(request).then((cached) => {
        return cached || fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Other requests: Cache First, fallback to Network
  event.respondWith(
    caches.match(request).then((cached) => {
      return cached || fetch(request).then((response) => {
        // Don't cache non-successful responses
        if (!response || response.status !== 200) {
          return response;
        }

        const responseClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseClone);
        });

        return response;
      }).catch(() => {
        // Return offline page if available
        return caches.match('/');
      });
    })
  );
});

// Push Notification
self.addEventListener('push', (event) => {
  console.log('[SW] Push received:', event);

  let notificationData = {
    title: 'Notifikasi Baru',
    body: 'Ada data baru ditambahkan.',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    data: {
      url: '/',
    },
  };

  // Parse push data from server
  if (event.data) {
    try {
      const pushData = event.data.json();
      console.log('[SW] Push data:', pushData);

      // Format dari API: { title, options: { body } }
      notificationData = {
        title: pushData.title || 'Notifikasi Baru',
        body: pushData.options?.body || 'Ada data baru ditambahkan.',
        icon: pushData.options?.icon || '/icons/icon-192x192.png',
        badge: pushData.options?.badge || '/icons/icon-72x72.png',
        data: {
          url: pushData.options?.data?.url || '/',
        },
      };
    } catch (e) {
      console.log('[SW] Push data is not JSON:', event.data.text());
      notificationData.body = event.data.text();
    }
  }

  const options = {
    body: notificationData.body,
    icon: notificationData.icon,
    badge: notificationData.badge,
    vibrate: [200, 100, 200],
    data: notificationData.data,
    actions: [
      {
        action: 'open',
        title: 'Lihat',
        icon: '/icons/icon-72x72.png',
      },
      {
        action: 'close',
        title: 'Tutup',
        icon: '/icons/icon-72x72.png',
      },
    ],
    requireInteraction: false,
    tag: 'story-notification',
  };

  event.waitUntil(
    self.registration.showNotification(notificationData.title, options)
  );
});

// Notification Click
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // Open or focus the app
  const urlToOpen = event.notification.data.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if window is already open
        for (let client of clientList) {
          if (client.url === urlToOpen && 'focus' in client) {
            return client.focus();
          }
        }
        // Open new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background Sync
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);

  if (event.tag === 'sync-stories') {
    event.waitUntil(syncStories());
  }
});

async function syncStories() {
  console.log('[SW] Syncing stories...');

  try {
    // Get pending stories from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pendingStories', 'readonly');
    const store = tx.objectStore('pendingStories');
    const pendingStories = await store.getAll();

    if (pendingStories.length === 0) {
      console.log('[SW] No pending stories to sync');
      return;
    }

    // Sync each story
    for (const story of pendingStories) {
      try {
        const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${story.token}`,
          },
          body: story.formData,
        });

        if (response.ok) {
          // Remove from pending
          const txDelete = db.transaction('pendingStories', 'readwrite');
          const storeDelete = txDelete.objectStore('pendingStories');
          await storeDelete.delete(story.id);
          console.log('[SW] Story synced:', story.id);
        }
      } catch (error) {
        console.error('[SW] Failed to sync story:', error);
      }
    }
  } catch (error) {
    console.error('[SW] Sync failed:', error);
  }
}

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('StoryExplorerDB', 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pendingStories')) {
        db.createObjectStore('pendingStories', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('favorites')) {
        db.createObjectStore('favorites', { keyPath: 'id' });
      }
    };
  });
}