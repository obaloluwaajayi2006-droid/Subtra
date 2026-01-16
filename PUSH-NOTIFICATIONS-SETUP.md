/**
 * Complete Integration Guide: Firebase Cloud Messaging for Subtra PWA
 * 
 * This document provides a complete implementation guide for adding push 
 * notifications to your Subtra subscription tracking PWA.
 */

/* ============================================================================
   TABLE OF CONTENTS
   ============================================================================
   
   1. Files Created
   2. Setup Steps
   3. Firebase Configuration
   4. Integration Points
   5. Testing
   6. Troubleshooting
   7. Best Practices
   8. Security Considerations
*/

/* ============================================================================
   1. FILES CREATED
   ============================================================================
*/

/*
   firebase-config.js
   - Initializes Firebase app
   - Exports db, messaging, auth, analytics instances
   - Enables Firestore offline persistence
   - MUST: Update with your Firebase config values
   
   firebase-messaging-sw.js
   - Dedicated service worker for FCM
   - Handles background notifications (app closed)
   - Must be at root level (/)
   - MUST: Update with your Firebase config and VAPID key
   
   notifications-fcm.js
   - Main FCM client library
   - FCMManager class handles all messaging
   - Requests permissions, gets tokens, handles messages
   - Exports enableNotifications() helper function
   - MUST: Update VAPID key
   
   notifications-ui.js
   - UI components for notification controls
   - NotificationUI class manages button state
   - Shows alerts and manages user interactions
   
   functions/sendNotification.js
   - Cloud Functions for sending notifications
   - sendNotification() - send to individual user
   - sendNotificationToTopic() - broadcast to topic
   - subscribeToTopic() - subscribe user to topic
   - unsubscribeFromTopic() - unsubscribe from topic
   - MUST: Deploy these functions to Firebase
   
   Existing Files (To Update):
   - index.html
   - manifest.json
   - service-worker.js
   - functions/index.js (update imports)
   - functions/package.json (dependencies already exist)
*/

/* ============================================================================
   2. SETUP STEPS
   ============================================================================
*/

/*
   STEP 1: Firebase Project Setup
   ================================
   
   a) Create Firebase Project
      - Go to https://console.firebase.google.com
      - Click "Create Project"
      - Enter project name: "Subtra" (or similar)
      - Choose Blaze plan (pay-as-you-go, free tier available)
      - Click Create
   
   b) Get Web App Configuration
      - In Firebase Console, click Project Settings (gear icon)
      - Under "Your apps", click "<>" (web app icon)
      - Register app with name "Subtra Web"
      - Copy the config object
      - Paste into firebase-config.js (replace YOUR_* values)
      - Also update firebase-messaging-sw.js with same config
   
   c) Get VAPID Public Key
      - In Project Settings, click "Cloud Messaging" tab
      - Under "Web push certificates"
      - Click "Generate Key Pair"
      - Copy the public key (long string starting with B...)
      - Replace YOUR_VAPID_PUBLIC_KEY in notifications-fcm.js
      - Also update firebase-messaging-sw.js
*/

/*
   STEP 2: Enable Firebase Services
   =================================
   
   In Firebase Console, enable:
   
   ✓ Authentication
     - Click "Authentication" in left sidebar
     - Click "Get started"
     - Enable "Email/Password"
   
   ✓ Firestore Database
     - Click "Firestore Database" in left sidebar
     - Click "Create database"
     - Start in production mode (we'll set rules)
     - Choose nearest region
     - Click "Enable"
   
   ✓ Cloud Messaging
     - Click "Cloud Messaging" in left sidebar
     - Note: Already setup once you create project
   
   ✓ Cloud Functions
     - Click "Functions" in left sidebar
     - Click "Get started"
     - Choose same region as Firestore
*/

/*
   STEP 3: Set Firestore Security Rules
   =====================================
   
   In Firebase Console:
   - Go to Firestore Database
   - Click "Rules" tab
   - Replace entire content with:
*/

/*
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       
       // FCM Tokens - users can read/write their own tokens
       match /users/{userId}/fcmTokens/{token} {
         allow read, write: if request.auth.uid == userId;
       }
       
       // FCM Token Index - for looking up tokens by device
       match /fcmTokenIndex/{token} {
         allow read: if request.auth != null;
         allow write: if false; // Only Cloud Functions
       }
       
       // Notification logs - users can read, only functions write
       match /notificationLogs/{document=**} {
         allow read: if request.auth != null;
         allow write: if false;
       }
       
       // User profiles
       match /users/{userId} {
         allow read: if request.auth.uid == userId;
         allow write: if request.auth.uid == userId;
       }
     }
   }
*/

/*
   STEP 4: Update Manifest.json
   ============================
   
   In manifest.json, ensure you have:
   
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
   
   // Firebase automatically registers firebase-messaging-sw.js
   // No need to add it to manifest
*/

/*
   STEP 5: Update functions/index.js
   =================================
   
   At the top of functions/index.js, import the notification functions:
   
   const sendNotificationFunctions = require('./sendNotification');
   exports.sendNotification = sendNotificationFunctions.sendNotification;
   exports.sendNotificationToTopic = sendNotificationFunctions.sendNotificationToTopic;
   exports.subscribeToTopic = sendNotificationFunctions.subscribeToTopic;
   exports.unsubscribeFromTopic = sendNotificationFunctions.unsubscribeFromTopic;
*/

/*
   STEP 6: Deploy Cloud Functions
   ===============================
   
   a) Install Firebase CLI (if not already installed)
      npm install -g firebase-tools
   
   b) Login to Firebase
      firebase login
   
   c) Initialize Firebase in project (if not done)
      firebase init functions
   
   d) Deploy functions
      firebase deploy --only functions
   
   e) Verify deployment
      firebase functions:list
      
      You should see:
      ✓ sendNotification
      ✓ sendNotificationToTopic
      ✓ subscribeToTopic
      ✓ unsubscribeFromTopic
*/

/*
   STEP 7: Add Scripts to HTML Files
   ==================================
   
   In index.html (and any other pages), before closing </body> add:
   
   <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
   <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"></script>
   
   <script src="/firebase-config.js"></script>
   <script src="/notifications-fcm.js"></script>
   <script src="/notifications-ui.js"></script>
   
   NOTE: firebase-messaging-sw.js is NOT included here
         It's loaded automatically by the browser for the service worker
*/

/*
   STEP 8: Add Notification Button to Pages
   =========================================
   
   Option A: Dashboard (dashboard/index.html)
   Add button to show notification status:
   
   <button
     id="enable-notifications-btn"
     class="btn btn-primary"
     type="button"
   >
     <i class="fas fa-bell"></i> Enable Notifications
   </button>
   
   Option B: Settings Page (settings/index.html)
   Add to notification preferences section
   
   Option C: Navigation Bar
   Add dropdown with notification options
*/

/* ============================================================================
   3. INTEGRATION POINTS
   ============================================================================
*/

/*
   A. On User First Visit
   ======================
   
   After user installs app:
   - Show "Enable Notifications" prompt or button
   - Not immediately (don't be aggressive)
   - Show after 1-2 interactions
   - Example code:
   
   // After user completes signup
   setTimeout(() => {
     if (Notification.permission === 'default') {
       showNotificationPrompt();
     }
   }, 3000);
   
   function showNotificationPrompt() {
     const confirmed = confirm('Enable push notifications for subscription reminders?');
     if (confirmed) {
       enableNotifications();
     }
   }
*/

/*
   B. On Subscription Creation
   ===========================
   
   When user adds a new subscription:
   
   // In your subscription creation code
   async function createSubscription(subscriptionData) {
     // ... existing subscription creation code ...
     
     // After subscription is created
     if (Notification.permission === 'default') {
       const enable = await enableNotifications();
       if (enable) {
         // Show success message
         console.log('User enabled notifications for renewal reminders');
       }
     }
   }
*/

/*
   C. On Subscription Renewal
   ==========================
   
   In your Cloud Function that checks for renewals:
   
   exports.checkExpiringSubscriptions = onSchedule(..., async (context) => {
     // ... existing renewal check code ...
     
     // When subscription is about to expire
     if (daysUntilRenewal === 7) {
       const sendNotificationFunc = functions.httpsCallable('sendNotification');
       
       await sendNotificationFunc({
         userId: user.uid,
         title: 'Subscription Renewing Soon',
         body: `Your ${subscription.name} subscription renews in 7 days`,
         icon: '/icon-192x192.png',
         clickAction: '/subscriptions',
         data: {
           subscriptionId: subscription.id,
           renewalDate: subscription.renewalDate
         }
       });
     }
   });
*/

/*
   D. On Profile Update
   ====================
   
   In settings page, allow users to control notifications:
   
   <div class="form-check">
     <input 
       type="checkbox" 
       id="notifications-enabled"
       class="form-check-input"
     >
     <label class="form-check-label" for="notifications-enabled">
       Enable push notifications
     </label>
   </div>
   
   <script>
   const checkbox = document.getElementById('notifications-enabled');
   
   checkbox.addEventListener('change', async (e) => {
     if (e.target.checked) {
       await enableNotifications();
     } else {
       // Optionally unsubscribe from all topics
     }
   });
   </script>
*/

/* ============================================================================
   4. TESTING
   ============================================================================
*/

/*
   A. Test Notification Permission Request
   ========================================
   
   1. Open DevTools (F12)
   2. In console, run: await enableNotifications()
   3. Browser should prompt for notification permission
   4. Click "Allow"
   5. Check console for "✓ FCM Token obtained: ..."
   6. Token should be saved to Firestore
*/

/*
   B. Test Notification Delivery
   =============================
   
   Method 1: Using Firebase Console
   - Go to Cloud Messaging tab
   - Click "Send your first message"
   - Enter:
     * Title: "Test Notification"
     * Body: "This is a test"
     * Target by User ID or Token
   - Click Send
   
   Method 2: Call Cloud Function
   - In browser console:
   
   firebase.functions().httpsCallable('sendNotification')({
     userId: firebase.auth().currentUser.uid,
     title: 'Test Notification',
     body: 'This is a test from Cloud Function'
   }).then(result => {
     console.log('Notification sent:', result.data);
   });
   
   Method 3: Using Admin CLI
   firebase functions:shell
   > sendNotification({userId: 'xxx', title: 'Test', body: 'Body'})
*/

/*
   C. Test Background Notifications
   =================================
   
   1. Enable notifications
   2. Close the browser tab (or minimize)
   3. Send notification from Firebase Console
   4. Notification should appear on desktop
   5. Click notification to open app
*/

/*
   D. Test Foreground Notifications
   =================================
   
   1. Enable notifications
   2. Keep the app open and focused
   3. Send notification from Firebase Console
   4. Custom notification should appear in-app
   5. Or use Notification API if permitted
*/

/* ============================================================================
   5. TROUBLESHOOTING
   ============================================================================
*/

/*
   Issue: "HTTPS required" error
   Solution: 
   - FCM requires HTTPS
   - Use localhost for development (automatically secure)
   - Deploy to HTTPS hosting (Firebase Hosting, Vercel, etc.)
   
   Issue: "No FCM Token obtained"
   Solution:
   - Check Notification.permission status
   - Ensure Notification permission is 'granted'
   - Check browser console for specific errors
   - Try requesting permission again
   
   Issue: Background notifications not appearing
   Solution:
   - Ensure firebase-messaging-sw.js is at root (/)
   - Check service worker is registered
   - In DevTools, check Application > Service Workers
   - Verify config and VAPID key are correct
   
   Issue: "messaging/invalid-registration-token"
   Solution:
   - Token may have expired
   - Delete old token and get new one
   - The code automatically handles this
   
   Issue: Tokens not being saved to Firestore
   Solution:
   - Check Firestore security rules
   - Verify user is authenticated
   - Check browser console for permission errors
   - Check network tab in DevTools for failed requests
   
   Issue: Cloud Functions deployment fails
   Solution:
   - Run: firebase deploy --only functions --debug
   - Check function syntax and imports
   - Ensure Node.js version is 18 or higher
   - Check for missing dependencies in package.json
*/

/* ============================================================================
   6. BEST PRACTICES
   ============================================================================
*/

/*
   ✓ Always ask for permission
     - Don't enable notifications without user consent
     - Use opt-in approach, not opt-out
     - Ask at the right moment (after positive interaction)
   
   ✓ Provide value
     - Only send notifications when truly important
     - Subscription renewals, price changes, security alerts
     - Don't spam or overload users
   
   ✓ Segment users
     - Send targeted notifications
     - Use topics for broadcast messages
     - Let users control notification preferences
   
   ✓ Handle failures gracefully
     - App should work without notifications
     - Provide fallback UI notifications
     - Log errors for debugging
   
   ✓ Keep tokens updated
     - Refresh tokens periodically
     - Remove inactive tokens
     - Update user's token list on login/logout
   
   ✓ Respect privacy
     - Never collect more data than needed
     - Explain what notifications user will receive
     - Allow easy opt-out
     - Delete tokens on user request
   
   ✓ Test thoroughly
     - Test in different browsers
     - Test on different devices (mobile, desktop)
     - Test background and foreground scenarios
     - Test on slow/offline connections
*/

/* ============================================================================
   7. SECURITY CONSIDERATIONS
   ============================================================================
*/

/*
   A. Firestore Security Rules
      - Users can only access their own tokens
      - Cloud Functions are only writer to shared indexes
      - Logs are read-only to authenticated users
      - See complete rules in Step 3 above
   
   B. VAPID Key
      - Keep public key secure but it's meant to be public
      - Never expose private key to client
      - Private key used only by FCM servers
   
   C. Token Management
      - Tokens can expire and be refreshed
      - Automatically handled by library
      - Old tokens marked as inactive
      - Periodic cleanup recommended
   
   D. Authentication
      - Consider requiring auth for notifications
      - Uncomment auth checks in Cloud Functions if desired
      - Use Firebase rules to restrict access
   
   E. Data Privacy
      - Custom notification data is encrypted in transit
      - Don't send sensitive data in notification payload
      - Use notification ID to fetch data from app backend
      - Example: Send notification ID, app fetches details from Firestore
*/

/* ============================================================================
   8. MONITORING & ANALYTICS
   ============================================================================
*/

/*
   A. Cloud Function Logs
      firebase functions:log
   
   B. Firestore Monitoring
      - Check /notificationLogs collection
      - Analyze notification delivery rates
      - Track user engagement
   
   C. Browser DevTools
      - Check Application > Service Workers
      - Check console for FCM debug messages
      - Monitor Network tab for messaging requests
   
   D. Firebase Console
      - Cloud Messaging tab shows usage stats
      - Monitor function performance
      - Check error rates
*/

/* ============================================================================
   QUICK START CHECKLIST
   ============================================================================
*/

/*
   [ ] Create Firebase project
   [ ] Get web config and update firebase-config.js
   [ ] Get VAPID key and update both config files
   [ ] Set Firestore security rules
   [ ] Deploy Cloud Functions (firebase deploy --only functions)
   [ ] Add Firebase scripts to HTML files
   [ ] Add notification button to at least one page
   [ ] Test permission request
   [ ] Test token generation and storage
   [ ] Test notification delivery (foreground)
   [ ] Test notification delivery (background)
   [ ] Test on different browsers/devices
   [ ] Add to subscription renewal logic
   [ ] Set up monitoring/logging
   [ ] Train customer support on notification features
*/

console.log('✓ Subtra Push Notifications Implementation Guide Loaded');
