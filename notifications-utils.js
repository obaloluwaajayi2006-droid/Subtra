/**
 * Helper Utilities for FCM
 * Useful functions for common FCM tasks throughout the app
 */

/**
 * Check if notifications are enabled
 * @returns {boolean} True if notifications are granted
 */
function isNotificationsEnabled() {
  return Notification.permission === 'granted';
}

/**
 * Check if notifications can be requested
 * @returns {boolean} True if user hasn't denied notifications yet
 */
function canRequestNotifications() {
  return Notification.permission !== 'denied';
}

/**
 * Get notification permission status as readable string
 * @returns {string} 'enabled', 'denied', or 'not-requested'
 */
function getNotificationStatus() {
  const permission = Notification.permission;
  if (permission === 'granted') return 'enabled';
  if (permission === 'denied') return 'denied';
  return 'not-requested';
}

/**
 * Get current FCM token (if available)
 * @returns {Promise<string|null>} The current FCM token or null
 */
async function getCurrentFCMToken() {
  try {
    if (!window.fcmManager || !window.fcmManager.messaging) {
      return null;
    }
    const token = await window.fcmManager.messaging.getToken({
      vapidKey: window.fcmManager.getVAPIDKey()
    });
    return token || null;
  } catch (error) {
    console.error('Error getting FCM token:', error);
    return null;
  }
}

/**
 * Send a test notification to current user
 * Useful for testing in development
 * @returns {Promise<boolean>} True if sent successfully
 */
async function sendTestNotification() {
  try {
    if (!firebase.auth().currentUser) {
      console.warn('User not authenticated');
      return false;
    }

    const sendFunc = firebase.functions().httpsCallable('sendNotification');
    const result = await sendFunc({
      userId: firebase.auth().currentUser.uid,
      title: 'Test Notification',
      body: 'This is a test notification from Subtra PWA',
      icon: '/icon-192x192.png',
      clickAction: '/'
    });

    console.log('Test notification sent:', result.data);
    return result.data.success;
  } catch (error) {
    console.error('Error sending test notification:', error);
    return false;
  }
}

/**
 * Subscribe user to a notification topic
 * Topics are useful for sending broadcast notifications
 * @param {string} topic - Topic name
 * @returns {Promise<boolean>} True if successful
 */
async function subscribeToTopic(topic) {
  try {
    if (!firebase.auth().currentUser) {
      console.warn('User not authenticated');
      return false;
    }

    const subscribeFunc = firebase.functions().httpsCallable('subscribeToTopic');
    const result = await subscribeFunc({ topic });

    console.log(`Subscribed to topic '${topic}':`, result.data);
    return result.data.success;
  } catch (error) {
    console.error(`Error subscribing to topic '${topic}':`, error);
    return false;
  }
}

/**
 * Unsubscribe user from a notification topic
 * @param {string} topic - Topic name
 * @returns {Promise<boolean>} True if successful
 */
async function unsubscribeFromTopic(topic) {
  try {
    if (!firebase.auth().currentUser) {
      console.warn('User not authenticated');
      return false;
    }

    const unsubscribeFunc = firebase.functions().httpsCallable('unsubscribeFromTopic');
    const result = await unsubscribeFunc({ topic });

    console.log(`Unsubscribed from topic '${topic}':`, result.data);
    return result.data.success;
  } catch (error) {
    console.error(`Error unsubscribing from topic '${topic}':`, error);
    return false;
  }
}

/**
 * Send a notification to a user (for admin/backend use)
 * @param {string} userId - Target user ID
 * @param {string} title - Notification title
 * @param {string} body - Notification body
 * @param {object} options - Additional options
 * @returns {Promise<boolean>} True if successful
 */
async function sendNotificationToUser(userId, title, body, options = {}) {
  try {
    const sendFunc = firebase.functions().httpsCallable('sendNotification');
    const result = await sendFunc({
      userId,
      title,
      body,
      icon: options.icon || '/icon-192x192.png',
      clickAction: options.clickAction || '/',
      data: options.data || {}
    });

    console.log('Notification sent:', result.data);
    return result.data.success;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}

/**
 * Clear all FCM tokens for current user
 * Call this on logout to ensure tokens are cleaned up
 * @returns {Promise<boolean>} True if successful
 */
async function clearFCMTokens() {
  try {
    const db = firebase.firestore();
    const userId = firebase.auth().currentUser?.uid;

    if (!userId) {
      return false;
    }

    // Get all tokens
    const tokensSnapshot = await db.collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .get();

    // Delete each token
    const batch = db.batch();
    tokensSnapshot.docs.forEach(doc => {
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log('✓ All FCM tokens cleared');
    return true;
  } catch (error) {
    console.error('Error clearing FCM tokens:', error);
    return false;
  }
}

/**
 * Get all active FCM tokens for a user (admin function)
 * @param {string} userId - Target user ID
 * @returns {Promise<string[]>} Array of active tokens
 */
async function getUserFCMTokens(userId) {
  try {
    const db = firebase.firestore();
    const tokensSnapshot = await db.collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .where('isActive', '==', true)
      .get();

    return tokensSnapshot.docs.map(doc => doc.data().token);
  } catch (error) {
    console.error('Error getting user tokens:', error);
    return [];
  }
}

/**
 * Listen for FCM messages in real-time
 * @param {function} callback - Function called when message received
 * @returns {function} Unsubscribe function
 */
function listenForNotifications(callback) {
  const handleMessage = (event) => {
    callback(event.detail);
  };

  window.addEventListener('fcm-message', handleMessage);

  // Return unsubscribe function
  return () => {
    window.removeEventListener('fcm-message', handleMessage);
  };
}

/**
 * Format notification status for display
 * @returns {string} Human-readable status
 */
function getNotificationStatusText() {
  const permission = Notification.permission;
  const supportedBrowsers = ['Chrome', 'Firefox', 'Safari', 'Edge'];
  const isSupported = 'serviceWorker' in navigator && 'Notification' in window;

  if (!isSupported) {
    return '❌ Notifications not supported in this browser';
  }

  if (!window.location.protocol === 'https:' && window.location.hostname !== 'localhost') {
    return '❌ HTTPS required for notifications';
  }

  switch (permission) {
    case 'granted':
      return '✓ Notifications enabled';
    case 'denied':
      return '✗ Notifications permission denied';
    default:
      return '→ Click to enable notifications';
  }
}

/**
 * Show notification status in console (for debugging)
 */
function debugNotificationStatus() {
  console.group('📢 Notification Debug Info');
  console.log('Permission:', Notification.permission);
  console.log('Status:', getNotificationStatusText());
  console.log('Service Workers Supported:', 'serviceWorker' in navigator);
  console.log('Notifications API Supported:', 'Notification' in window);
  console.log('HTTPS/Localhost:', window.location.protocol === 'https:' || window.location.hostname === 'localhost');
  console.log('FCM Manager:', window.fcmManager ? '✓ Initialized' : '✗ Not initialized');
  console.log('Messaging Instance:', window.fcmManager?.messaging ? '✓ Available' : '✗ Not available');
  console.groupEnd();
}

// Auto-log debug info if in development
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
  console.log('💡 Run debugNotificationStatus() to check notification setup');
}

console.log('✓ FCM Utilities loaded');
