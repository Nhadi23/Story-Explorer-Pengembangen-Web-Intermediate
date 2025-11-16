import CONFIG from '../data/config.js';
import ApiService from '../data/api.js';

class SwRegister {
  static async register() {
    if (!('serviceWorker' in navigator)) {
      console.log('Service Worker not supported');
      return null;
    }

    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      console.log('✅ Service Worker registered:', registration.scope);

      // Check for updates
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        console.log('🔄 Service Worker updating...');

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('✅ New Service Worker installed, refresh to update');
            this.showUpdateNotification();
          }
        });
      });

      return registration;
    } catch (error) {
      console.error('❌ Service Worker registration failed:', error);
      return null;
    }
  }

  static showUpdateNotification() {
    const notification = document.createElement('div');
    notification.className = 'sw-update-notification';
    notification.innerHTML = `
      <div class="sw-update-content">
        <p>🎉 Versi baru tersedia!</p>
        <button id="sw-update-btn" class="btn btn-primary">Refresh</button>
        <button id="sw-dismiss-btn" class="btn btn-secondary">Nanti</button>
      </div>
    `;
    document.body.appendChild(notification);

    document.getElementById('sw-update-btn').addEventListener('click', () => {
      window.location.reload();
    });

    document.getElementById('sw-dismiss-btn').addEventListener('click', () => {
      notification.remove();
    });
  }

  static async requestNotificationPermission() {
    if (!('Notification' in window)) {
      console.log('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  static async subscribeToPush(registration) {
    try {
      // Request notification permission first
      const hasPermission = await this.requestNotificationPermission();
      if (!hasPermission) {
        throw new Error('Notification permission denied');
      }

      // Subscribe to push
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(CONFIG.VAPID_PUBLIC_KEY),
      });

      console.log('✅ Push subscription successful:', subscription);

      // Send subscription to API server
      await ApiService.subscribePushNotification(subscription);

      // Store subscription locally
      localStorage.setItem('pushSubscription', JSON.stringify(subscription));

      return subscription;
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      throw error;
    }
  }

  static async unsubscribeFromPush(registration) {
    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // Unsubscribe from server
        await ApiService.unsubscribePushNotification(subscription.endpoint);
        
        // Unsubscribe locally
        await subscription.unsubscribe();
        
        // Remove from localStorage
        localStorage.removeItem('pushSubscription');
        
        console.log('✅ Push unsubscribed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Push unsubscribe failed:', error);
      return false;
    }
  }

  static urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  static async checkPushSubscription(registration) {
    try {
      const subscription = await registration.pushManager.getSubscription();
      return subscription !== null;
    } catch (error) {
      console.error('Error checking subscription:', error);
      return false;
    }
  }

  // Test push notification (local only, tidak dari server)
  static async testPushNotification() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification('Test Notification 🧪', {
        body: 'Ini adalah test push notification lokal!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
          url: '/',
        },
        actions: [
          { action: 'open', title: 'Buka App' },
          { action: 'close', title: 'Tutup' },
        ],
      });
    }
  }
}

export default SwRegister;