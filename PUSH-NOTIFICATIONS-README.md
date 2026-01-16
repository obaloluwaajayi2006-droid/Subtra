# Subtra PWA - Push Notifications Implementation

Complete Firebase Cloud Messaging (FCM) setup for your Progressive Web App with push notifications for subscription reminders.

## 📋 Overview

This implementation provides:

- ✅ **Permission Management**: User-friendly notification permission requests
- ✅ **FCM Device Tokens**: Automatic token generation and storage in Firestore
- ✅ **Foreground Notifications**: In-app notifications when app is open
- ✅ **Background Notifications**: Notifications when app is closed or in background
- ✅ **Cloud Functions**: Serverless notification delivery via Firebase
- ✅ **Topic Subscriptions**: Broadcast notifications to user groups
- ✅ **Analytics Logging**: Track notification delivery and engagement
- ✅ **Offline Support**: Graceful degradation when offline

---

## 📁 Files Created

### Core Implementation

| File | Purpose |
|------|---------|
| `firebase-config.js` | Firebase app initialization and service configuration |
| `firebase-messaging-sw.js` | Service worker for background message handling |
| `notifications-fcm.js` | Main FCM client library and token management |
| `notifications-ui.js` | UI components for notification controls |
| `notifications-utils.js` | Utility functions for common FCM tasks |
| `dashboard-notifications.js` | Dashboard integration example |
| `functions/sendNotification.js` | Cloud Functions for sending notifications |

### Documentation

| File | Purpose |
|------|---------|
| `PUSH-NOTIFICATIONS-SETUP.md` | Complete setup guide (this file) |
| `NOTIFICATIONS-INTEGRATION-GUIDE.html` | Integration examples and code snippets |

---

## 🚀 Quick Start (5 minutes)

### 1. Get Firebase Configuration

```bash
# Go to Firebase Console
# https://console.firebase.google.com

# 1. Create a new project named "Subtra"
# 2. Go to Project Settings (gear icon)
# 3. Under "Your apps", select Web app
# 4. Copy the firebaseConfig object
```

### 2. Update Configuration Files

**File: `firebase-config.js`**
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",              // From Firebase Console
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "YOUR_MEASUREMENT_ID"
};
```

**File: `firebase-messaging-sw.js`**
```javascript
const firebaseConfig = {
  // Same config as above
  apiKey: "YOUR_API_KEY",
  // ... etc
};
```

### 3. Get VAPID Public Key

```
Firebase Console
  → Project Settings
  → Cloud Messaging tab
  → Web push certificates
  → Generate Key Pair
  → Copy Public Key (starts with "B...")
```

**Update in both files:**
- `notifications-fcm.js` - Line ~255
- `firebase-messaging-sw.js` - Line ~27

```javascript
getVAPIDKey() {
  return 'YOUR_VAPID_PUBLIC_KEY'; // Long string starting with B...
}
```

### 4. Deploy Cloud Functions

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Deploy
firebase deploy --only functions

# Verify
firebase functions:list
```

### 5. Add to HTML

Add before closing `</body>` tag:

```html
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"></script>

<script src="/firebase-config.js"></script>
<script src="/notifications-fcm.js"></script>
<script src="/notifications-ui.js"></script>
<script src="/notifications-utils.js"></script>
```

### 6. Add Notification Button

Add to any page (e.g., settings, dashboard):

```html
<button
  id="enable-notifications-btn"
  class="btn btn-primary"
  type="button"
>
  <i class="fas fa-bell"></i> Enable Notifications
</button>
```

### 7. Test

```javascript
// In browser console
await enableNotifications();
```

✅ That's it! You now have push notifications.

---

## 📖 Detailed Setup Guide

### Firebase Project Setup

#### Step 1: Create Firebase Project

1. Go to https://console.firebase.google.com
2. Click "Add Project"
3. Enter "Subtra" as project name
4. Choose Blaze plan (free tier covers push notifications)
5. Create project

#### Step 2: Create Web App

1. In Firebase Console, click "Add app"
2. Select Web app icon (</>)
3. Register app as "Subtra Web"
4. Copy the firebaseConfig object
5. You'll need these values:

```javascript
const firebaseConfig = {
  apiKey: "xxxxx",
  authDomain: "subtra-xxxxx.firebaseapp.com",
  projectId: "subtra-xxxxx",
  storageBucket: "subtra-xxxxx.appspot.com",
  messagingSenderId: "xxxxx",
  appId: "xxxxx",
  measurementId: "G-xxxxx"
};
```

#### Step 3: Enable Required Services

1. **Authentication**
   - Click "Authentication" in sidebar
   - Click "Get started"
   - Enable "Email/Password"

2. **Firestore Database**
   - Click "Firestore Database"
   - Click "Create database"
   - Start in production mode
   - Choose nearest region
   - Click "Enable"

3. **Cloud Functions**
   - Click "Functions"
   - Click "Get started"
   - Choose same region as Firestore

4. **Cloud Messaging**
   - Already enabled, no action needed

#### Step 4: Generate VAPID Key

1. Go to Project Settings → Cloud Messaging tab
2. Under "Web push certificates"
3. Click "Generate Key Pair"
4. Copy the **public key** (starts with "B...")
5. You'll use this in your client code

### Configuration Files Setup

#### firebase-config.js

This file initializes Firebase and exports service instances.

**What to update:**
- Replace all `YOUR_*` values with your Firebase config

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxx",
  authDomain: "subtra-xxxxx.firebaseapp.com",
  projectId: "subtra-xxxxx",
  storageBucket: "subtra-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:xxxxxxx",
  measurementId: "G-XXXXXXXXXX"
};
```

#### firebase-messaging-sw.js

This is the service worker that handles background messages.

**Important:** This file must be at the root level (/)

**What to update:**
- Same firebaseConfig as above
- Replace `YOUR_VAPID_PUBLIC_KEY` with your VAPID key

```javascript
getVAPIDKey() {
  return 'BCxxxxxxxxxxxxx_long_string_xxxxxxxxxxxxx';
}
```

#### notifications-fcm.js

Main client library for FCM operations.

**What to update:**
- Replace `YOUR_VAPID_PUBLIC_KEY` in the `getVAPIDKey()` method

### Firestore Security Rules

Set these rules in Firebase Console → Firestore → Rules tab:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // FCM Tokens - each user manages their own
    match /users/{userId}/fcmTokens/{token} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // FCM Token Index - for looking up tokens
    match /fcmTokenIndex/{token} {
      allow read: if request.auth != null;
      allow write: if false; // Cloud Functions only
    }
    
    // Notification logs
    match /notificationLogs/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Cloud Functions only
    }
    
    // User profiles
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

### Update manifest.json

Ensure your manifest has:

```json
{
  "name": "Subtra - Subscription Tracker",
  "short_name": "Subtra",
  "icons": [
    {
      "src": "/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any"
    },
    {
      "src": "/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any"
    }
  ],
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0f0f1e",
  "theme_color": "#8b5cf6",
  "orientation": "portrait-primary"
}
```

### Deploy Cloud Functions

```bash
# Step 1: Install Firebase CLI
npm install -g firebase-tools

# Step 2: Login to Firebase
firebase login

# Step 3: Initialize Firebase in your project (if not done)
firebase init functions

# Step 4: Deploy functions
firebase deploy --only functions

# Step 5: Check deployment
firebase functions:list
```

You should see:
- ✓ sendNotification
- ✓ sendNotificationToTopic
- ✓ subscribeToTopic
- ✓ unsubscribeFromTopic

### Update HTML Files

Add these scripts before closing `</body>` tag in every page:

```html
<!-- Firebase Libraries -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"></script>

<!-- Subtra Notification Scripts -->
<script src="/firebase-config.js"></script>
<script src="/notifications-fcm.js"></script>
<script src="/notifications-ui.js"></script>
<script src="/notifications-utils.js"></script>
```

### Add Notification Button

Add to dashboard, settings, or navigation:

```html
<button
  id="enable-notifications-btn"
  class="btn btn-primary"
  type="button"
>
  <i class="fas fa-bell"></i> Enable Notifications
</button>
```

The button is automatically wired by `notifications-ui.js`.

---

## 🧪 Testing Push Notifications

### Test 1: Request Permission

```javascript
// In browser console on your app
await enableNotifications()
```

Browser should prompt for notification permission. Click "Allow".

Expected outcome:
- ✓ Permission granted
- ✓ FCM token obtained
- ✓ Token saved to Firestore
- ✓ Console shows: "✓ FCM Token obtained: ..."

### Test 2: Send Notification via Console

```javascript
// In browser console (must be logged in)
await sendTestNotification()
```

Expected outcome:
- ✓ Test notification appears on screen
- ✓ Console shows: "Notification sent: ..."

### Test 3: Send via Firebase Console

1. Go to Firebase Console
2. Cloud Messaging tab
3. Click "Send your first message"
4. Fill in:
   - **Title:** "Test Notification"
   - **Body:** "This is a test"
   - **Target:** Choose "FCM registration token"
   - Paste your token (from browser console: `await getCurrentFCMToken()`)
5. Click "Send"

Expected outcome:
- ✓ Notification appears immediately

### Test 4: Background Notification

1. Enable notifications (if not done)
2. Go to Firebase Console → Cloud Messaging
3. Send notification (same as Test 3)
4. **Close the browser tab** (or minimize to background)
5. Notification should appear on desktop
6. Click notification to open app

Expected outcome:
- ✓ Desktop notification appears
- ✓ Clicking it opens your app

### Test 5: Foreground Notification

1. Enable notifications
2. Go to Firebase Console → Cloud Messaging
3. Send notification while app is open and focused
4. A notification should appear in-app (or browser notification)

Expected outcome:
- ✓ In-app notification appears
- ✓ Does not interrupt user

---

## 💻 Usage Examples

### Request Notification Permission

```javascript
// Simple one-liner
await enableNotifications()

// Or with response handling
const enabled = await enableNotifications();
if (enabled) {
  console.log('User enabled notifications');
} else {
  console.log('User denied notifications');
}
```

### Send Test Notification

```javascript
const success = await sendTestNotification();
if (success) {
  alert('Test notification sent!');
}
```

### Get Notification Status

```javascript
const status = getNotificationStatus();
console.log(status); // 'enabled', 'denied', or 'not-requested'

// Check if enabled
if (isNotificationsEnabled()) {
  console.log('Notifications are active');
}

// Check if can request
if (canRequestNotifications()) {
  console.log('User hasn\'t denied notifications yet');
}
```

### Subscribe to Topic (Broadcast)

```javascript
// Subscribe user to "announcements" topic
await subscribeToTopic('announcements');

// Now they'll receive notifications sent to this topic
```

### Listen for Notifications

```javascript
// Listen for real-time notifications in app
const unsubscribe = listenForNotifications((payload) => {
  console.log('Received notification:', payload);
  
  // You can react to the notification here
  if (payload.data?.subscriptionId) {
    refreshSubscriptionData(payload.data.subscriptionId);
  }
});

// When done listening (on page unload):
unsubscribe();
```

### Send Notification Programmatically

```javascript
// From your app (requires Cloud Function)
const sendFunc = firebase.functions().httpsCallable('sendNotification');

try {
  const result = await sendFunc({
    userId: 'target-user-id',
    title: 'Subscription Renewing',
    body: 'Your Netflix subscription renews tomorrow',
    icon: '/icon-192x192.png',
    clickAction: '/subscriptions',
    data: {
      subscriptionId: 'sub-123'
    }
  });

  console.log('Notification sent:', result.data);
} catch (error) {
  console.error('Error sending notification:', error);
}
```

### Debug Notification Setup

```javascript
// Check notification setup
debugNotificationStatus()

// Output shows:
// Permission: granted
// Status: ✓ Notifications enabled
// Service Workers Supported: true
// Notifications API Supported: true
// HTTPS/Localhost: true
// FCM Manager: ✓ Initialized
// Messaging Instance: ✓ Available
```

---

## 🔒 Security Best Practices

### Firestore Rules
- Users can only access their own tokens
- Only Cloud Functions can write to shared collections
- All endpoints validate user authentication

### Notification Content
- Don't include sensitive data in notification body
- Use notification ID to fetch details from backend
- All data is encrypted in transit (HTTPS)

### Token Management
- Tokens are automatically refreshed
- Expired tokens marked as inactive
- Tokens deleted on user logout

### Authorization
- Consider requiring authentication for notifications
- Uncomment auth checks in Cloud Functions if needed
- Validate user permissions before sending

---

## 🐛 Troubleshooting

### "HTTPS Required" Error

**Problem:** FCM requires HTTPS
```
Error: Messaging: Only Secure URLs are allowed for Messaging
```

**Solution:**
- Use localhost for development (automatically secure)
- Deploy to HTTPS hosting:
  - Firebase Hosting
  - Vercel
  - Netlify
  - Any HTTPS server

### No Notification Permission Prompt

**Problem:** Browser doesn't show permission dialog

**Solution:**
- Check if permission was already denied
- Run: `Notification.permission` in console
- If "denied", enable in browser settings
- Clear site permissions and try again

### Token Not Obtained

**Problem:** FCM token is null or empty

**Solution:**
```javascript
// Check permission first
console.log(Notification.permission); // Must be 'granted'

// Check if messaging is initialized
console.log(window.fcmManager?.messaging); // Should exist

// Request permission again
await enableNotifications();
```

### Notifications Not Appearing

**Problem:** Sent notification but nothing shows

**Foreground check:**
- App is open and focused
- Check browser notifications permission
- Look for in-app notification

**Background check:**
- Check service worker is registered
- In DevTools: Application → Service Workers
- Verify firebase-messaging-sw.js is at root (/)
- Check browser notification settings

### Service Worker Not Registering

**Problem:** Service worker fails to register

**Solution:**
```javascript
// Check in console
navigator.serviceWorker.getRegistrations()
  .then(regs => console.log('Service Workers:', regs))

// If empty, check for errors in console
// Common issues:
// - File not at correct path
// - HTTPS required
// - Syntax errors in service worker
```

### Tokens Failing to Save

**Problem:** Tokens not saved to Firestore

**Check:**
```javascript
// 1. User is authenticated
firebase.auth().currentUser // Should not be null

// 2. Firestore rules allow it
// See security rules section above

// 3. Network is working
// Open DevTools Network tab and check requests

// 4. Retry with debugging
await window.fcmManager.getAndSaveToken()
```

---

## 📊 Monitoring

### Check Notification Logs

In Firestore, see `/notificationLogs` collection:
- Who received notifications
- When they were sent
- Success rate

```javascript
// Query logs
db.collection('notificationLogs')
  .where('userId', '==', userId)
  .orderBy('sentAt', 'desc')
  .limit(10)
  .get()
```

### Monitor Cloud Functions

```bash
# View function logs
firebase functions:log

# Or in Firebase Console
# Functions → sendNotification → Logs tab
```

### Check User Tokens

In Firestore, user tokens stored at:
- `/users/{userId}/fcmTokens/{token}`

Each token has:
- `token`: The FCM device token
- `platform`: OS (Windows, macOS, iOS, Android, Linux)
- `userAgent`: Browser and device info
- `timestamp`: When token was created
- `isActive`: Whether token is still valid

---

## 🚀 Integration Examples

### Example 1: Subscription Created

```javascript
// In your subscription creation code
async function createSubscription(subscriptionData) {
  // ... create subscription ...

  // Prompt for notifications
  if (Notification.permission === 'default') {
    const enabled = await enableNotifications();
    if (enabled) {
      // Maybe show a success message
    }
  }
}
```

### Example 2: Subscription Renewal Reminder

In `functions/index.js`, update the renewal check:

```javascript
// When checking for renewals
if (daysUntilRenewal === 7) {
  const sendFunc = firebase.functions().httpsCallable('sendNotification');

  await sendFunc({
    userId: user.uid,
    title: 'Subscription Renewing Soon',
    body: `${subscription.name} renews in 7 days for ${subscription.currency}${subscription.amount}`,
    icon: '/icon-192x192.png',
    clickAction: '/subscriptions',
    data: {
      subscriptionId: subscription.id,
      renewalDate: daysUntilRenewal
    }
  });
}
```

### Example 3: Settings Page

```html
<!-- In settings/index.html -->
<div class="notification-preferences">
  <h4><i class="fas fa-bell"></i> Notifications</h4>

  <div class="form-check">
    <input
      type="checkbox"
      id="pref-renewals"
      class="form-check-input"
      checked
    >
    <label class="form-check-label" for="pref-renewals">
      Renewal reminders (7 days before)
    </label>
  </div>

  <div class="form-check">
    <input
      type="checkbox"
      id="pref-announcements"
      class="form-check-input"
    >
    <label class="form-check-label" for="pref-announcements">
      Product announcements
    </label>
  </div>

  <button
    id="enable-notifications-btn"
    class="btn btn-primary mt-3"
  >
    Enable Notifications
  </button>
</div>
```

---

## 📝 API Reference

### FCMManager Class

**Main class handling all FCM operations**

```javascript
// Methods
fcmManager.requestNotificationPermission()     // Request from user
fcmManager.getAndSaveToken()                   // Get FCM token
fcmManager.handleForegroundMessages()          // Setup foreground handling
fcmManager.handleTokenRefresh()                // Setup token refresh
fcmManager.deleteToken(token)                  // Delete a token
fcmManager.getPlatform()                       // Get device platform
```

### Utility Functions

```javascript
// Check status
isNotificationsEnabled()                 // boolean
canRequestNotifications()                // boolean
getNotificationStatus()                  // 'enabled' | 'denied' | 'not-requested'
getNotificationStatusText()              // Human-readable string

// Tokens
getCurrentFCMToken()                     // Get current token
getUserFCMTokens(userId)                 // Get all user tokens

// Actions
enableNotifications()                    // Request permission
sendTestNotification()                   // Send test
subscribeToTopic(topic)                  // Subscribe to topic
unsubscribeFromTopic(topic)              // Unsubscribe
clearFCMTokens()                         // Clear all tokens

// Notifications
sendNotificationToUser(userId, title, body, options)  // Send
listenForNotifications(callback)         // Listen for messages
showForegroundNotification(title, body)  // Show in-app

// Debugging
debugNotificationStatus()                // Show debug info
```

### Cloud Functions

```javascript
// Send to individual user
firebase.functions().httpsCallable('sendNotification')({
  userId: 'user-id',
  title: 'Title',
  body: 'Body',
  icon: 'url',
  clickAction: 'url',
  data: { ... }
})

// Send to topic
firebase.functions().httpsCallable('sendNotificationToTopic')({
  topic: 'announcements',
  title: 'Title',
  body: 'Body'
})

// Subscribe to topic
firebase.functions().httpsCallable('subscribeToTopic')({
  topic: 'announcements'
})

// Unsubscribe from topic
firebase.functions().httpsCallable('unsubscribeFromTopic')({
  topic: 'announcements'
})
```

---

## 📚 Additional Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Firebase Console](https://console.firebase.google.com)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Firebase Functions Guide](https://firebase.google.com/docs/functions)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

---

## ✅ Checklist

- [ ] Created Firebase project
- [ ] Got web config and VAPID key
- [ ] Updated firebase-config.js
- [ ] Updated firebase-messaging-sw.js
- [ ] Updated notifications-fcm.js
- [ ] Set Firestore security rules
- [ ] Deployed Cloud Functions
- [ ] Added Firebase scripts to HTML
- [ ] Added notification button to page
- [ ] Tested permission request
- [ ] Tested notification delivery
- [ ] Tested background notifications
- [ ] Updated manifest.json
- [ ] Set up monitoring
- [ ] Documented in team wiki/docs

---

## 🎉 You're All Set!

Your Subtra PWA now has fully functional push notifications. Users will receive timely reminders about upcoming subscription renewals.

**Next steps:**
1. Test with real users
2. Monitor notification delivery
3. Collect user feedback
4. Optimize notification timing and content
5. Add more notification triggers as needed

**Questions?** Check the troubleshooting section or Firebase documentation.

Happy notifying! 🚀
