// Import MapTiler SDK CSS first
import '@maptiler/sdk/dist/maptiler-sdk.css';

// Import custom CSS
import '../styles/styles.css';

// Import app
import App from './pages/app.js';
import SwRegister from './utils/sw-register.js';
import IDBHelper from './utils/idb-helper.js';
import ApiService from './data/api.js';

// Suppress ResizeObserver loop error (harmless error from MapTiler SDK)
const resizeObserverError = window.console.error;
window.console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('ResizeObserver loop')
  ) {
    return; // Ignore this specific error
  }
  resizeObserverError(...args);
};

// Initialize app
const app = new App({
  content: document.getElementById('page-container'),
});

window.addEventListener('hashchange', () => {
  app.renderPage();
});

window.addEventListener('load', async () => {
  app.renderPage();

  // Register Service Worker
  const registration = await SwRegister.register();

  // Initialize IndexedDB
  await IDBHelper.openDB();

  // Setup PWA install prompt
  setupInstallPrompt();

  // Setup notification toggle
  setupNotificationToggle(registration);

  // Auto-subscribe untuk push notification jika user sudah login
  await autoSubscribePushNotification(registration);

  // Setup online/offline detection
  setupOnlineOfflineDetection();

  // Check for pending stories to sync
  if (navigator.onLine) {
    syncPendingStories();
  }
});

// PWA Install Prompt
let deferredPrompt;

function setupInstallPrompt() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;

    // Show install banner
    const banner = document.getElementById('install-banner');
    if (banner) {
      banner.style.display = 'block';
    }
  });

  const installBtn = document.getElementById('install-btn');
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (deferredPrompt) {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response: ${outcome}`);

        deferredPrompt = null;
        document.getElementById('install-banner').style.display = 'none';
      }
    });
  }

  const dismissBtn = document.getElementById('install-dismiss');
  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      document.getElementById('install-banner').style.display = 'none';
    });
  }

  // Hide banner when installed
  window.addEventListener('appinstalled', () => {
    console.log('✅ PWA installed');
    document.getElementById('install-banner').style.display = 'none';
  });
}

// Auto-subscribe Push Notification untuk user yang sudah login
async function autoSubscribePushNotification(registration) {
  if (!registration) return;
  
  // Cek apakah user sudah login
  if (!ApiService.isAuthenticated()) {
    console.log('User not logged in, skipping auto-subscribe');
    return;
  }

  try {
    // Cek apakah sudah subscribe
    const isSubscribed = await SwRegister.checkPushSubscription(registration);
    
    if (!isSubscribed) {
      // Check permission
      if (Notification.permission === 'default') {
        console.log('Notification permission not asked yet');
        return; // Tunggu user klik toggle manual
      }
      
      if (Notification.permission === 'granted') {
        // Auto-subscribe
        await SwRegister.subscribeToPush(registration);
        console.log('✅ Auto-subscribed to push notifications');
      }
    } else {
      console.log('Already subscribed to push notifications');
    }
  } catch (error) {
    console.error('Auto-subscribe failed:', error);
  }
}

// Notification Toggle
function setupNotificationToggle(registration) {
  const toggleBtn = document.getElementById('notification-toggle');
  const testBtn = document.getElementById('test-notification-btn');

  if (!toggleBtn) return;

  // Check current subscription status
  updateNotificationButton(registration);

  toggleBtn.addEventListener('click', async () => {
    // Cek login
    if (!ApiService.isAuthenticated()) {
      alert('⚠️ Silakan login terlebih dahulu untuk mengaktifkan notifikasi');
      return;
    }

    const isSubscribed = await SwRegister.checkPushSubscription(registration);

    if (isSubscribed) {
      // Unsubscribe
      await SwRegister.unsubscribeFromPush(registration);
      alert('🔕 Notifikasi dinonaktifkan');
      updateNotificationButton(registration);
    } else {
      // Subscribe
      const permission = await SwRegister.requestNotificationPermission();
      if (permission) {
        try {
          await SwRegister.subscribeToPush(registration);
          alert('🔔 Notifikasi diaktifkan! Anda akan menerima notifikasi saat ada story baru.');
          updateNotificationButton(registration);
        } catch (error) {
          alert('❌ Gagal mengaktifkan notifikasi: ' + error.message);
        }
      } else {
        alert('❌ Permission ditolak. Aktifkan dari pengaturan browser.');
      }
    }
  });

  if (testBtn) {
    testBtn.addEventListener('click', () => {
      SwRegister.testPushNotification();
    });
  }
}

async function updateNotificationButton(registration) {
  const toggleBtn = document.getElementById('notification-toggle');
  const testBtn = document.getElementById('test-notification-btn');
  const icon = document.getElementById('notification-icon');
  const text = document.getElementById('notification-text');

  if (!toggleBtn) return;

  const isSubscribed = await SwRegister.checkPushSubscription(registration);

  if (isSubscribed) {
    icon.textContent = '🔔';
    text.textContent = 'Disable Notifications';
    if (testBtn) testBtn.style.display = 'inline-block';
  } else {
    icon.textContent = '🔕';
    text.textContent = 'Enable Notifications';
    if (testBtn) testBtn.style.display = 'none';
  }
}

// Online/Offline Detection
function setupOnlineOfflineDetection() {
  const indicator = document.getElementById('offline-indicator');

  window.addEventListener('online', () => {
    console.log('✅ Online');
    if (indicator) indicator.style.display = 'none';
    
    // Sync pending stories
    syncPendingStories();
  });

  window.addEventListener('offline', () => {
    console.log('📡 Offline');
    if (indicator) indicator.style.display = 'block';
  });

  // Initial check
  if (!navigator.onLine && indicator) {
    indicator.style.display = 'block';
  }
}

// Sync pending stories
async function syncPendingStories() {
  try {
    const result = await IDBHelper.syncPendingStories();
    
    if (result.success > 0) {
      showSyncStatus(`✅ ${result.success} cerita berhasil disinkronkan`);
    }

    if (result.failed > 0) {
      showSyncStatus(`⚠️ ${result.failed} cerita gagal disinkronkan`);
    }
  } catch (error) {
    console.error('Sync error:', error);
  }
}

function showSyncStatus(message) {
  const statusEl = document.getElementById('sync-status');
  const messageEl = document.getElementById('sync-message');

  if (statusEl && messageEl) {
    messageEl.textContent = message;
    statusEl.style.display = 'block';

    setTimeout(() => {
      statusEl.style.display = 'none';
    }, 5000);
  }
}