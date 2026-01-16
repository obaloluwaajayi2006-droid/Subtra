/**
 * Cloud Function: Send Push Notifications
 * 
 * This function handles sending push notifications to users via Firebase Cloud Messaging
 * 
 * Can be called:
 * 1. From the Firebase Console (manually testing)
 * 2. From other Cloud Functions
 * 3. From your backend using Firebase Admin SDK
 * 
 * Usage example:
 * firebase.functions().httpsCallable('sendNotification')({
 *   userId: 'user-id',
 *   title: 'Subscription Expiring',
 *   body: 'Your Disney+ subscription expires in 3 days',
 *   icon: '/icon-192x192.png',
 *   clickAction: '/subscriptions'
 * })
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');
const logger = require('firebase-functions/logger');

/**
 * HTTP Callable Cloud Function: sendNotification
 * 
 * Request body parameters:
 * - userId (string): The user ID to send notification to
 * - title (string): Notification title
 * - body (string): Notification body text
 * - icon (string, optional): URL to notification icon
 * - clickAction (string, optional): URL to open when notification is clicked
 * - data (object, optional): Custom data to include with notification
 * 
 * Returns: { success: boolean, messageId: string, error?: string }
 */
exports.sendNotification = functions.https.onCall(async (data, context) => {
  // Authenticate user making the request (optional but recommended)
  // Uncomment the following lines if you want to require authentication
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 
  //     'Authentication required to send notifications');
  // }

  const { userId, title, body, icon, clickAction, data: customData } = data;

  // Validate required fields
  if (!userId) {
    throw new functions.https.HttpsError('invalid-argument', 'userId is required');
  }
  if (!title) {
    throw new functions.https.HttpsError('invalid-argument', 'title is required');
  }
  if (!body) {
    throw new functions.https.HttpsError('invalid-argument', 'body is required');
  }

  try {
    const db = admin.firestore();
    const messaging = admin.messaging();

    // Get all tokens for the user
    const tokensSnapshot = await db.collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .where('isActive', '==', true)
      .get();

    if (tokensSnapshot.empty) {
      logger.warn(`No active tokens found for user ${userId}`);
      return {
        success: false,
        error: 'No active notification tokens for this user'
      };
    }

    // Prepare notification payload
    const notificationPayload = {
      notification: {
        title: title,
        body: body,
        icon: icon || 'https://yourapp.com/icon-192x192.png',
        clickAction: clickAction || 'https://yourapp.com'
      },
      data: {
        url: clickAction || '/',
        timestamp: new Date().toISOString(),
        userId: userId,
        ...customData
      },
      webpush: {
        headers: {
          TTL: '86400' // 24 hours
        },
        data: {
          url: clickAction || '/',
          timestamp: new Date().toISOString(),
          userId: userId,
          ...customData
        },
        notification: {
          title: title,
          body: body,
          icon: icon || 'https://yourapp.com/icon-192x192.png',
          badge: 'https://yourapp.com/badge-72x72.png',
          tag: 'notification-' + Date.now(),
          requireInteraction: false,
          vibrate: [200, 100, 200],
          // Optional: add action buttons
          // actions: [
          //   { action: 'open', title: 'Open' },
          //   { action: 'close', title: 'Close' }
          // ]
        }
      }
    };

    // Send notification to all user tokens
    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);
    const results = [];

    // Send to multiple tokens (max 500 per request)
    for (let i = 0; i < tokens.length; i += 500) {
      const batchTokens = tokens.slice(i, i + 500);

      try {
        const response = await messaging.sendMulticast({
          ...notificationPayload,
          tokens: batchTokens
        });

        results.push(response);
        logger.info(`Sent to batch of ${batchTokens.length} tokens`);

        // Handle failed tokens
        if (response.failureCount > 0) {
          const failedTokens = [];

          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              failedTokens.push(batchTokens[idx]);

              // If token is invalid, mark it as inactive
              if (resp.error.code === 'messaging/invalid-registration-token' ||
                resp.error.code === 'messaging/registration-token-not-registered') {
                db.collection('users')
                  .doc(userId)
                  .collection('fcmTokens')
                  .doc(batchTokens[idx])
                  .update({ isActive: false })
                  .catch(err => logger.error('Error updating token:', err));
              }
            }
          });

          logger.warn(`Failed tokens in batch: ${failedTokens.length}`);
        }
      } catch (error) {
        logger.error('Error sending batch:', error);
        results.push({ error: error.message });
      }
    }

    // Log the notification for analytics
    await db.collection('notificationLogs').add({
      userId: userId,
      title: title,
      body: body,
      sentAt: admin.firestore.FieldValue.serverTimestamp(),
      tokenCount: tokens.length,
      successCount: results.reduce((sum, r) => sum + (r.successCount || 0), 0)
    });

    logger.info(`Notification sent to user ${userId} with ${tokens.length} tokens`);

    return {
      success: true,
      messagesSent: tokens.length,
      successCount: results.reduce((sum, r) => sum + (r.successCount || 0), 0),
      failureCount: results.reduce((sum, r) => sum + (r.failureCount || 0), 0)
    };
  } catch (error) {
    logger.error('Error in sendNotification function:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function: Send Notification to Topic
 * 
 * Sends a notification to all users subscribed to a topic
 * Useful for broadcast notifications
 * 
 * Usage:
 * firebase.functions().httpsCallable('sendNotificationToTopic')({
 *   topic: 'announcements',
 *   title: 'New Feature Released',
 *   body: 'Check out our new subscription tracker feature'
 * })
 */
exports.sendNotificationToTopic = functions.https.onCall(async (data, context) => {
  const { topic, title, body, icon, clickAction, data: customData } = data;

  if (!topic) {
    throw new functions.https.HttpsError('invalid-argument', 'topic is required');
  }
  if (!title || !body) {
    throw new functions.https.HttpsError('invalid-argument', 'title and body are required');
  }

  try {
    const messaging = admin.messaging();

    const message = {
      notification: {
        title: title,
        body: body,
        icon: icon || 'https://yourapp.com/icon-192x192.png'
      },
      data: {
        url: clickAction || '/',
        timestamp: new Date().toISOString(),
        ...customData
      },
      webpush: {
        headers: { TTL: '86400' },
        notification: {
          title: title,
          body: body,
          icon: icon || 'https://yourapp.com/icon-192x192.png',
          badge: 'https://yourapp.com/badge-72x72.png',
          tag: topic + '-' + Date.now(),
          requireInteraction: false,
          vibrate: [200, 100, 200]
        }
      },
      topic: topic
    };

    const response = await messaging.send(message);
    logger.info(`Notification sent to topic '${topic}': ${response}`);

    return {
      success: true,
      messageId: response,
      topic: topic
    };
  } catch (error) {
    logger.error('Error in sendNotificationToTopic:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function: Subscribe User to Topic
 * 
 * Subscribes a user's tokens to a topic for broadcast notifications
 * 
 * Usage:
 * firebase.functions().httpsCallable('subscribeToTopic')({
 *   topic: 'announcements'
 * })
 */
exports.subscribeToTopic = functions.https.onCall(async (data, context) => {
  const { topic } = data;

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  if (!topic) {
    throw new functions.https.HttpsError('invalid-argument', 'topic is required');
  }

  try {
    const db = admin.firestore();
    const messaging = admin.messaging();
    const userId = context.auth.uid;

    // Get all user tokens
    const tokensSnapshot = await db.collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .where('isActive', '==', true)
      .get();

    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

    if (tokens.length === 0) {
      throw new functions.https.HttpsError('failed-precondition', 'No active tokens found');
    }

    // Subscribe tokens to topic
    const response = await messaging.subscribeToTopic(tokens, topic);
    logger.info(`Subscribed ${tokens.length} tokens to topic '${topic}'`);

    // Update user document
    await db.collection('users').doc(userId).update({
      subscribedTopics: admin.firestore.FieldValue.arrayUnion(topic),
      lastTopicSubscription: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      success: true,
      topic: topic,
      tokensSubscribed: tokens.length
    };
  } catch (error) {
    logger.error('Error subscribing to topic:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Cloud Function: Unsubscribe User from Topic
 * 
 * Usage:
 * firebase.functions().httpsCallable('unsubscribeFromTopic')({
 *   topic: 'announcements'
 * })
 */
exports.unsubscribeFromTopic = functions.https.onCall(async (data, context) => {
  const { topic } = data;

  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
  }

  if (!topic) {
    throw new functions.https.HttpsError('invalid-argument', 'topic is required');
  }

  try {
    const db = admin.firestore();
    const messaging = admin.messaging();
    const userId = context.auth.uid;

    // Get all user tokens
    const tokensSnapshot = await db.collection('users')
      .doc(userId)
      .collection('fcmTokens')
      .where('isActive', '==', true)
      .get();

    const tokens = tokensSnapshot.docs.map(doc => doc.data().token);

    if (tokens.length > 0) {
      // Unsubscribe from topic
      await messaging.unsubscribeFromTopic(tokens, topic);
      logger.info(`Unsubscribed ${tokens.length} tokens from topic '${topic}'`);
    }

    // Update user document
    await db.collection('users').doc(userId).update({
      subscribedTopics: admin.firestore.FieldValue.arrayRemove(topic)
    });

    return {
      success: true,
      topic: topic,
      tokensUnsubscribed: tokens.length
    };
  } catch (error) {
    logger.error('Error unsubscribing from topic:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});
