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
            // Show update notification to user
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
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          // VAPID public key - ganti dengan key Anda
          'BCqY5XbimF2Rfs0gYQZLd29nU_G4O2Ct-EJTbwu8YxSYBK2IuzmuQ_HiGfE34ourA04pABcP56QeK-woHvED5_8'
        ),
      });

      console.log('✅ Push subscription successful:', subscription);

      // Send subscription to server
      await this.sendSubscriptionToServer(subscription);

      return subscription;
    } catch (error) {
      console.error('❌ Push subscription failed:', error);
      return null;
    }
  }

  static async unsubscribeFromPush(registration) {
    try {
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();
        console.log('✅ Push unsubscribed');
        return true;
      }
      return false;
    } catch (error) {
      console.error('❌ Push unsubscribe failed:', error);
      return false;
    }
  }

  static async sendSubscriptionToServer(subscription) {
    // Store subscription in localStorage for demo
    // In production, send to your backend server
    localStorage.setItem('pushSubscription', JSON.stringify(subscription));
    console.log('Subscription saved:', subscription.endpoint);
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

  // Test push notification
  static async testPushNotification() {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.ready;
      registration.showNotification('Test Notification', {
        body: 'This is a test push notification!',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/icon-72x72.png',
        vibrate: [200, 100, 200],
        data: {
          url: '/',
        },
        actions: [
          { action: 'open', title: 'Open App' },
          { action: 'close', title: 'Close' },
        ],
      });
    }
  }
}

export default SwRegister;