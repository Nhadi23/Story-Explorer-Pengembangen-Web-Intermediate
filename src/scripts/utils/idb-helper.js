class IDBHelper {
  static DB_NAME = 'StoryExplorerDB';
  static DB_VERSION = 1;
  static STORES = {
    FAVORITES: 'favorites',
    PENDING: 'pendingStories',
    CACHE: 'storiesCache',
  };

  static async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = () => {
        console.error('❌ IndexedDB error:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        console.log('✅ IndexedDB opened');
        resolve(request.result);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        console.log('🔄 Upgrading IndexedDB...');

        // Create object stores
        if (!db.objectStoreNames.contains(this.STORES.FAVORITES)) {
          const favStore = db.createObjectStore(this.STORES.FAVORITES, { keyPath: 'id' });
          favStore.createIndex('createdAt', 'createdAt', { unique: false });
          console.log('Created favorites store');
        }

        if (!db.objectStoreNames.contains(this.STORES.PENDING)) {
          const pendingStore = db.createObjectStore(this.STORES.PENDING, { 
            keyPath: 'id', 
            autoIncrement: true 
          });
          pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Created pending stories store');
        }

        if (!db.objectStoreNames.contains(this.STORES.CACHE)) {
          const cacheStore = db.createObjectStore(this.STORES.CACHE, { keyPath: 'id' });
          cacheStore.createIndex('timestamp', 'timestamp', { unique: false });
          console.log('Created cache store');
        }
      };
    });
  }

  // ===== FAVORITES =====

  static async addFavorite(story) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.FAVORITES], 'readwrite');
      const store = transaction.objectStore(this.STORES.FAVORITES);

      const favoriteData = {
        ...story,
        createdAt: new Date().toISOString(),
      };

      const request = store.add(favoriteData);

      request.onsuccess = () => {
        console.log('✅ Added to favorites:', story.id);
        resolve(story.id);
      };

      request.onerror = () => {
        console.error('❌ Error adding favorite:', request.error);
        reject(request.error);
      };
    });
  }

  static async removeFavorite(storyId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.FAVORITES], 'readwrite');
      const store = transaction.objectStore(this.STORES.FAVORITES);
      const request = store.delete(storyId);

      request.onsuccess = () => {
        console.log('✅ Removed from favorites:', storyId);
        resolve(true);
      };

      request.onerror = () => {
        console.error('❌ Error removing favorite:', request.error);
        reject(request.error);
      };
    });
  }

  static async getAllFavorites() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.FAVORITES], 'readonly');
      const store = transaction.objectStore(this.STORES.FAVORITES);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log('✅ Got favorites:', request.result.length);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('❌ Error getting favorites:', request.error);
        reject(request.error);
      };
    });
  }

  static async isFavorite(storyId) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.FAVORITES], 'readonly');
      const store = transaction.objectStore(this.STORES.FAVORITES);
      const request = store.get(storyId);

      request.onsuccess = () => {
        resolve(request.result !== undefined);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  }

  // ===== PENDING STORIES (for offline sync) =====

  static async addPendingStory(storyData) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.PENDING], 'readwrite');
      const store = transaction.objectStore(this.STORES.PENDING);

      const pendingData = {
        ...storyData,
        timestamp: new Date().toISOString(),
        synced: false,
      };

      const request = store.add(pendingData);

      request.onsuccess = () => {
        console.log('✅ Added pending story:', request.result);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('❌ Error adding pending story:', request.error);
        reject(request.error);
      };
    });
  }

  static async getPendingStories() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.PENDING], 'readonly');
      const store = transaction.objectStore(this.STORES.PENDING);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log('✅ Got pending stories:', request.result.length);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('❌ Error getting pending stories:', request.error);
        reject(request.error);
      };
    });
  }

  static async removePendingStory(id) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.PENDING], 'readwrite');
      const store = transaction.objectStore(this.STORES.PENDING);
      const request = store.delete(id);

      request.onsuccess = () => {
        console.log('✅ Removed pending story:', id);
        resolve(true);
      };

      request.onerror = () => {
        console.error('❌ Error removing pending story:', request.error);
        reject(request.error);
      };
    });
  }

  static async clearPendingStories() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.PENDING], 'readwrite');
      const store = transaction.objectStore(this.STORES.PENDING);
      const request = store.clear();

      request.onsuccess = () => {
        console.log('✅ Cleared pending stories');
        resolve(true);
      };

      request.onerror = () => {
        console.error('❌ Error clearing pending stories:', request.error);
        reject(request.error);
      };
    });
  }

  // ===== CACHE STORIES =====

  static async cacheStories(stories) {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.CACHE], 'readwrite');
      const store = transaction.objectStore(this.STORES.CACHE);

      // Clear old cache
      store.clear();

      // Add new stories
      const promises = stories.map(story => {
        return new Promise((res, rej) => {
          const cacheData = {
            ...story,
            timestamp: new Date().toISOString(),
          };
          const request = store.add(cacheData);
          request.onsuccess = () => res();
          request.onerror = () => rej(request.error);
        });
      });

      Promise.all(promises)
        .then(() => {
          console.log('✅ Cached stories:', stories.length);
          resolve(true);
        })
        .catch(reject);
    });
  }

  static async getCachedStories() {
    const db = await this.openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.STORES.CACHE], 'readonly');
      const store = transaction.objectStore(this.STORES.CACHE);
      const request = store.getAll();

      request.onsuccess = () => {
        console.log('✅ Got cached stories:', request.result.length);
        resolve(request.result);
      };

      request.onerror = () => {
        console.error('❌ Error getting cached stories:', request.error);
        reject(request.error);
      };
    });
  }

  // ===== SYNC UTILITIES =====

  static async syncPendingStories() {
    const pendingStories = await this.getPendingStories();
    
    if (pendingStories.length === 0) {
      console.log('No pending stories to sync');
      return { success: 0, failed: 0 };
    }

    let success = 0;
    let failed = 0;

    for (const story of pendingStories) {
      try {
        // Try to send to API
        const formData = new FormData();
        formData.append('description', story.description);
        formData.append('photo', story.photo);
        formData.append('lat', story.lat);
        formData.append('lon', story.lon);

        const response = await fetch('https://story-api.dicoding.dev/v1/stories', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${story.token}`,
          },
          body: formData,
        });

        if (response.ok) {
          await this.removePendingStory(story.id);
          success++;
        } else {
          failed++;
        }
      } catch (error) {
        console.error('Sync failed for story:', story.id, error);
        failed++;
      }
    }

    console.log(`✅ Sync completed: ${success} success, ${failed} failed`);
    return { success, failed };
  }
}

export default IDBHelper;