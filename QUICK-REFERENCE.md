# Firebase Cloud Messaging - Quick Reference Card

## 🎯 One-Minute Setup

### 1. Get Configuration
```
Go to: https://console.firebase.google.com
Create Project → Copy Web App Config → Copy VAPID Key
```

### 2. Update Files
```
firebase-config.js              (Line 5-13)     ← Firebase config
firebase-messaging-sw.js        (Line 7-15)     ← Firebase config
notifications-fcm.js            (Line 255)      ← VAPID key
```

### 3. Deploy Cloud Functions
```bash
firebase login
firebase deploy --only functions
```

### 4. Add to HTML
```html
<!-- Before </body> -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"></script>

<script src="/firebase-config.js"></script>
<script src="/notifications-fcm.js"></script>
<script src="/notifications-ui.js"></script>
<script src="/notifications-utils.js"></script>
```

### 5. Add Button
```html
<button id="enable-notifications-btn" class="btn btn-primary">
  <i class="fas fa-bell"></i> Enable Notifications
</button>
```

## 📚 Common Functions

```javascript
// Request permission
await enableNotifications()

// Check if enabled
isNotificationsEnabled()                    // true/false
getNotificationStatus()                     // 'enabled'|'denied'|'not-requested'

// Send test
await sendTestNotification()

// Subscribe to topic
await subscribeToTopic('announcements')

// Listen for messages
listenForNotifications((payload) => {
  console.log('Message:', payload);
})

// Debug
debugNotificationStatus()
```

## 🔧 Cloud Functions

### Send to User
```javascript
firebase.functions().httpsCallable('sendNotification')({
  userId: 'user-id',
  title: 'Title',
  body: 'Body',
  icon: '/icon-192x192.png',
  clickAction: '/subscriptions'
})
```

### Send to Topic
```javascript
firebase.functions().httpsCallable('sendNotificationToTopic')({
  topic: 'announcements',
  title: 'Title',
  body: 'Body'
})
```

### Subscribe to Topic
```javascript
firebase.functions().httpsCallable('subscribeToTopic')({
  topic: 'announcements'
})
```

## 📍 File Locations

```
Root (/)
├── firebase-config.js              (Config)
├── firebase-messaging-sw.js         (Service Worker for FCM)
├── notifications-fcm.js             (Main library)
├── notifications-ui.js              (UI components)
├── notifications-utils.js           (Helper functions)
├── dashboard-notifications.js       (Dashboard integration)
├── PUSH-NOTIFICATIONS-README.md     (Full guide)
├── PUSH-NOTIFICATIONS-SETUP.md      (Setup details)
└── functions/
    └── sendNotification.js          (Cloud Functions)
```

## 🧪 Testing

```javascript
// In browser console
await enableNotifications()                 // Request permission
await sendTestNotification()                // Send test
debugNotificationStatus()                   // Check setup
```

## ⚠️ Common Issues

| Problem | Solution |
|---------|----------|
| "HTTPS required" | Use localhost or deploy to HTTPS hosting |
| No permission prompt | Check Notification.permission in console |
| Token not saving | Verify Firestore rules and user auth |
| No background notifications | Check service worker at Application → Service Workers |
| Function errors | Run: firebase functions:log |

## 🔐 Firestore Rules (Required)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId}/fcmTokens/{token} {
      allow read, write: if request.auth.uid == userId;
    }
    match /fcmTokenIndex/{token} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /notificationLogs/{document=**} {
      allow read: if request.auth != null;
      allow write: if false;
    }
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## 📊 Collection Structure

```
Firestore Database
├── users/{userId}
│   ├── fcmTokens/{token}           ← Device tokens
│   │   ├── token: string           ← FCM token
│   │   ├── platform: string        ← OS type
│   │   ├── timestamp: datetime     ← Created
│   │   └── isActive: boolean       ← Still valid
│   └── notificationPreferences
│       ├── subscriptions: boolean
│       └── announcements: boolean
│
├── fcmTokenIndex/{token}           ← For fast lookup
│   └── userId: string
│
└── notificationLogs/{docId}        ← Delivery logs
    ├── userId: string
    ├── title: string
    ├── body: string
    └── sentAt: datetime
```

## 🎯 Integration Checklist

- [ ] Configure firebase-config.js
- [ ] Configure firebase-messaging-sw.js
- [ ] Configure notifications-fcm.js
- [ ] Set Firestore security rules
- [ ] Deploy Cloud Functions
- [ ] Add Firebase scripts to HTML
- [ ] Add notification button to pages
- [ ] Test permission request
- [ ] Test notification delivery
- [ ] Test background notifications

## 📞 Support

**Full Documentation**: See `PUSH-NOTIFICATIONS-README.md`

**Integration Examples**: See `NOTIFICATIONS-INTEGRATION-GUIDE.html`

**HTML Code Samples**: See `NOTIFICATIONS-HTML-EXAMPLES.js`

**API Reference**: See `notifications-utils.js` comments

---

**Version**: 1.0
**Last Updated**: January 2026
**Status**: Production Ready ✓
