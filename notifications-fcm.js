/**
 * Firebase Cloud Messaging (FCM) Client Implementation
 * 
 * Handles:
 * - Requesting notification permissions
 * - Registering service worker
 * - Getting FCM device token
 * - Storing token in Firestore
 * - Handling foreground messages
 * - Updating token when it refreshes
 * 
 * Usage: Include this file in your HTML before other scripts that use FCM
 * Example: <script src="firebase-config.js"></script>
 *          <script src="notifications-fcm.js"></script>
 */

/**
 * Main FCM Manager Class
 * Handles all FCM operations
 */
class FCMManager {
  constructor() {
    this.messaging = null;
    this.userId = null;
    this.isSupported = this.checkFCMSupport();
    this.tokenSaveAttempts = 0;
    this.maxTokenSaveAttempts = 3;

    if (this.isSupported) {
      this.initialize();
    } else {
      console.warn('⚠ FCM is not supported in this browser');
    }
  }

  /**
   * Check if browser supports FCM
   * Requires service worker support and notification API
   */
  checkFCMSupport() {
    const isHttps = window.location.protocol === 'https:';
    const hasServiceWorkerSupport = 'serviceWorker' in navigator;
    const hasNotificationSupport = 'Notification' in window;

    if (!isHttps) {
      console.warn('⚠ FCM requires HTTPS. Current protocol:', window.location.protocol);
      return false;
    }

    if (!hasServiceWorkerSupport) {
      console.warn('⚠ Service Workers are not supported in this browser');
      return false;
    }

    if (!hasNotificationSupport) {
      console.warn('⚠ Notifications are not supported in this browser');
      return false;
    }

    return true;
  }

  /**
   * Initialize FCM manager
   * Called on construction if FCM is supported
   */
  async initialize() {
    try {
      // Get Firebase messaging instance
      this.messaging = firebase.messaging();

      // Register service worker for messaging
      await this.registerServiceWorker();

      // Get current user (if authenticated)
      await this.getCurrentUser();

      // Handle foreground messages
      this.handleForegroundMessages();

      // Handle token refresh
      this.handleTokenRefresh();

      console.log('✓ FCM Manager initialized');
    } catch (error) {
      console.error('❌ Error initializing FCM:', error);
    }
  }

  /**
   * Register Firebase Messaging Service Worker
   * This service worker handles background messages
   */
  async registerServiceWorker() {
    try {
      // Register the main service worker (for caching)
      await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });

      // The firebase-messaging-sw.js should be at root for Firebase to find it
      // Firebase will automatically look for it
      console.log('✓ Service Worker registered for messaging');
    } catch (error) {
      console.error('❌ Service Worker registration error:', error);
      throw error;
    }
  }

  /**
   * Get current authenticated user
   * Sets this.userId for token storage
   */
  async getCurrentUser() {
    return new Promise((resolve) => {
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          this.userId = user.uid;
          console.log('✓ Current user ID:', this.userId);
        } else {
          // Allow notification for anonymous users too
          this.userId = 'anonymous-' + this.generateAnonymousId();
          console.log('→ Anonymous user ID:', this.userId);
        }
        resolve();
      });
    });
  }

  /**
   * Generate anonymous user ID
   * Used for tracking notifications for non-authenticated users
   */
  generateAnonymousId() {
    let anonymousId = localStorage.getItem('anonymousUserId');
    if (!anonymousId) {
      anonymousId = 'anon_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('anonymousUserId', anonymousId);
    }
    return anonymousId;
  }

  /**
   * Request notification permission from user
   * Shows browser permission prompt
   */
  async requestNotificationPermission() {
    if (Notification.permission === 'granted') {
      console.log('✓ Notification permission already granted');
      return true;
    }

    if (Notification.permission === 'denied') {
      console.warn('⚠ Notification permission denied by user');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        console.log('✓ Notification permission granted');
        await this.getAndSaveToken();
        return true;
      } else {
        console.warn('⚠ Notification permission denied');
        return false;
      }
    } catch (error) {
      console.error('❌ Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Get FCM device token
   * This token is used to send notifications to this specific device
   */
  async getAndSaveToken() {
    if (!this.messaging) {
      console.warn('⚠ Messaging not initialized');
      return null;
    }

    try {
      // Get the token
      const token = await this.messaging.getToken({
        vapidKey: this.getVAPIDKey()
      });

      if (token) {
        console.log('✓ FCM Token obtained:', token.substring(0, 20) + '...');
        await this.saveTokenToFirestore(token);
        return token;
      } else {
        console.warn('⚠ No FCM token obtained');
        return null;
      }
    } catch (error) {
      console.error('❌ Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Get VAPID Public Key
   * This is a Firebase-specific public key for push notifications
   * Generate in Firebase Console: Project Settings -> Cloud Messaging -> Web push certificates
   */
  getVAPIDKey() {
    // Your VAPID public key from Firebase Console
    return 'BLR4SwYr4-ddATR3y_wc6PvJyBsy3u7yfPasvlR80O4nirrPe7zObdTxa5d4ygPkdgJ7mqzBmesEBKTgWsLjY7Y';
  }

  /**
   * Save FCM token to Firestore
   * Stores the token associated with the user for later targeting
   */
  async saveTokenToFirestore(token) {
    try {
      if (!this.userId) {
        console.warn('⚠ User ID not available, cannot save token');
        return;
      }

      const db = firebase.firestore();
      const tokenData = {
        token: token,
        platform: this.getPlatform(),
        userAgent: navigator.userAgent,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        isActive: true
      };

      // Save token to user's tokens subcollection
      await db.collection('users')
        .doc(this.userId)
        .collection('fcmTokens')
        .doc(token)
        .set(tokenData, { merge: true });

      // Also save to a global index for easier querying
      await db.collection('fcmTokenIndex')
        .doc(token)
        .set({
          userId: this.userId,
          ...tokenData
        }, { merge: true });

      console.log('✓ Token saved to Firestore');
      this.tokenSaveAttempts = 0; // Reset attempts on success
    } catch (error) {
      console.error('❌ Error saving token to Firestore:', error);

      // Retry up to maxTokenSaveAttempts times
      if (this.tokenSaveAttempts < this.maxTokenSaveAttempts) {
        this.tokenSaveAttempts++;
        const retryDelay = Math.pow(2, this.tokenSaveAttempts) * 1000; // Exponential backoff
        console.log(`Retrying token save in ${retryDelay}ms (attempt ${this.tokenSaveAttempts}/${this.maxTokenSaveAttempts})`);
        setTimeout(() => this.saveTokenToFirestore(token), retryDelay);
      }
    }
  }

  /**
   * Get device platform for analytics
   */
  getPlatform() {
    const ua = navigator.userAgent;
    if (/Windows/.test(ua)) return 'Windows';
    if (/Mac/.test(ua)) return 'macOS';
    if (/iPhone|iPad/.test(ua)) return 'iOS';
    if (/Android/.test(ua)) return 'Android';
    if (/Linux/.test(ua)) return 'Linux';
    return 'Unknown';
  }

  /**
   * Handle foreground messages
   * Messages received while the app is open/focused
   */
  handleForegroundMessages() {
    if (!this.messaging) return;

    this.messaging.onMessage((payload) => {
      console.log('[Foreground Message received]', payload);

      // Show notification even when app is open
      this.showForegroundNotification(
        payload.notification?.title,
        payload.notification?.body,
        payload.notification?.icon,
        payload.data
      );

      // You can also emit an event for your app to react to
      window.dispatchEvent(new CustomEvent('fcm-message', {
        detail: payload
      }));
    });
  }

  /**
   * Show notification when app is in foreground
   * Uses Notification API or custom UI
   */
  showForegroundNotification(title, body, icon, data = {}) {
    try {
      // Try to show browser notification first
      if (Notification.permission === 'granted') {
        new Notification(title || 'Subtra', {
          body: body || 'You have a new notification',
          icon: icon || '/icon-192x192.png',
          badge: '/badge-72x72.png',
          tag: 'foreground-notification',
          data: data
        });
      } else {
        // Fallback to custom UI notification
        this.showCustomNotificationUI(title, body, icon, data);
      }
    } catch (error) {
      console.error('Error showing foreground notification:', error);
      this.showCustomNotificationUI(title, body, icon, data);
    }
  }

  /**
   * Show custom notification UI (fallback)
   * You can customize this to match your app's design
   */
  showCustomNotificationUI(title, body, icon, data) {
    // Create a custom notification element
    const notification = document.createElement('div');
    notification.className = 'custom-notification';
    notification.innerHTML = `
      <div class="notification-content">
        ${icon ? `<img src="${icon}" alt="icon" class="notification-icon">` : ''}
        <div class="notification-text">
          <h4>${title || 'Notification'}</h4>
          <p>${body || ''}</p>
        </div>
        <button class="notification-close">&times;</button>
      </div>
    `;

    // Style the notification
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      backgroundColor: '#fff',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
      maxWidth: '400px',
      zIndex: '10000',
      animation: 'slideIn 0.3s ease-out'
    });

    // Add close functionality
    notification.querySelector('.notification-close').addEventListener('click', () => {
      notification.remove();
    });

    // Auto-remove after 5 seconds
    setTimeout(() => notification.remove(), 5000);

    document.body.appendChild(notification);

    // Add animation style if not exists
    if (!document.querySelector('style[data-notification-animation]')) {
      const style = document.createElement('style');
      style.setAttribute('data-notification-animation', 'true');
      style.innerHTML = `
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
  }

  /**
   * Handle token refresh
   * FCM tokens can expire and be refreshed
   */
  handleTokenRefresh() {
    if (!this.messaging) return;

    this.messaging.onTokenRefresh(() => {
      console.log('Token refreshed, getting new token...');
      this.getAndSaveToken();
    });
  }

  /**
   * Delete FCM token (called on logout)
   */
  async deleteToken(token) {
    try {
      if (!this.userId || !token) return;

      const db = firebase.firestore();

      // Remove from user's tokens
      await db.collection('users')
        .doc(this.userId)
        .collection('fcmTokens')
        .doc(token)
        .delete();

      // Remove from global index
      await db.collection('fcmTokenIndex')
        .doc(token)
        .delete();

      console.log('✓ Token deleted from Firestore');
    } catch (error) {
      console.error('❌ Error deleting token:', error);
    }
  }
}

// Initialize FCM Manager when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.fcmManager = new FCMManager();
  });
} else {
  window.fcmManager = new FCMManager();
}

/**
 * Helper function to request notification permission
 * Can be called from buttons or other UI elements
 * 
 * Usage: await enableNotifications()
 */
async function enableNotifications() {
  if (!window.fcmManager) {
    console.error('❌ FCM Manager not initialized');
    return false;
  }

  return await window.fcmManager.requestNotificationPermission();
}

console.log('✓ Notifications FCM module loaded');
