#!/usr/bin/env bash
# ============================================================================
# SUBTRA PWA - PUSH NOTIFICATIONS SETUP CHECKLIST
# ============================================================================
# 
# This file contains the exact steps needed to complete the setup
# Copy-paste each section as you complete it
#
# ============================================================================

# STEP 1: CREATE FIREBASE PROJECT
# ============================================================================
# 1. Go to: https://console.firebase.google.com
# 2. Click: "+ Create Project"
# 3. Enter: "Subtra" as project name
# 4. Choose: Blaze plan (free tier includes notifications)
# 5. Click: Create Project
# 6. Wait for project to initialize...
#
# EXPECTED OUTCOME: Firebase console opens with your new project
# ============================================================================

# STEP 2: GET FIREBASE CONFIG VALUES
# ============================================================================
# 1. In Firebase Console, click: ⚙️ Project Settings (gear icon)
# 2. Click: "Add app" → Web app (</>)
# 3. Register app as: "Subtra Web"
# 4. Click: Register app
# 5. You'll see a config object like this:
#
# const firebaseConfig = {
#   apiKey: "AIzaSyDxxxxxxxxxxxxxxxxxxxxxxxx",
#   authDomain: "subtra-xxxxx.firebaseapp.com",
#   projectId: "subtra-xxxxx",
#   storageBucket: "subtra-xxxxx.appspot.com",
#   messagingSenderId: "123456789",
#   appId: "1:123456789:web:xxxxxxx",
#   measurementId: "G-XXXXXXXXXX"
# };
#
# 6. COPY these values (you'll need them next)
# ============================================================================

# STEP 3: GET VAPID KEY
# ============================================================================
# 1. In Firebase Console, go to: Project Settings → Cloud Messaging tab
# 2. Under "Web push certificates", click: "Generate Key Pair"
# 3. Copy the PUBLIC KEY (starts with "B...")
# 4. This is your VAPID public key
#
# EXAMPLE: Your key will look like:
# BCxxxxxxxxxxxxx_long_string_of_characters_xxxxxxxxxxxxx
# ============================================================================

# STEP 4: UPDATE firebase-config.js
# ============================================================================
# File: firebase-config.js
# Lines: 5-13
#
# Replace YOUR_* values with your Firebase config:
#
# const firebaseConfig = {
#   apiKey: "YOUR_API_KEY",                          ← Paste from Firebase
#   authDomain: "your-project.firebaseapp.com",      ← Paste from Firebase
#   projectId: "your-project-id",                    ← Paste from Firebase
#   storageBucket: "your-project.appspot.com",       ← Paste from Firebase
#   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",   ← Paste from Firebase
#   appId: "YOUR_APP_ID",                            ← Paste from Firebase
#   measurementId: "YOUR_MEASUREMENT_ID"             ← Paste from Firebase
# };
#
# ACTION: Edit file and update all values
# ============================================================================

# STEP 5: UPDATE firebase-messaging-sw.js
# ============================================================================
# File: firebase-messaging-sw.js
#
# PART A - Lines 7-15:
# const firebaseConfig = {
#   apiKey: "YOUR_API_KEY",                          ← Same as step 4
#   authDomain: "your-project.firebaseapp.com",      ← Same as step 4
#   projectId: "your-project-id",                    ← Same as step 4
#   storageBucket: "your-project.appspot.com",       ← Same as step 4
#   messagingSenderId: "YOUR_MESSAGING_SENDER_ID",   ← Same as step 4
#   appId: "YOUR_APP_ID",                            ← Same as step 4
#   measurementId: "YOUR_MEASUREMENT_ID"             ← Same as step 4
# };
#
# PART B - Line 27:
# getVAPIDKey() {
#   return 'YOUR_VAPID_PUBLIC_KEY';  ← Paste your VAPID key from step 3
# }
#
# ACTION: Edit file and update both parts
# ============================================================================

# STEP 6: UPDATE notifications-fcm.js
# ============================================================================
# File: notifications-fcm.js
# Line: 255
#
# Find this method:
# getVAPIDKey() {
#   return 'YOUR_VAPID_PUBLIC_KEY';  ← Paste your VAPID key from step 3
# }
#
# ACTION: Edit file and update VAPID key (same as step 5, part B)
# ============================================================================

# STEP 7: SET FIRESTORE SECURITY RULES
# ============================================================================
# 1. In Firebase Console, go to: Firestore Database → Rules tab
# 2. Delete existing rules
# 3. Paste these rules:
#
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // FCM Tokens - users can only read/write their own
    match /users/{userId}/fcmTokens/{token} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // FCM Token Index - for looking up tokens
    match /fcmTokenIndex/{token} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions
    }
    
    // Notification logs - users can read, functions write
    match /notificationLogs/{document=**} {
      allow read: if request.auth != null;
      allow write: if false; // Only Cloud Functions
    }
    
    // User data
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
  }
}
#
# 4. Click: "Publish"
#
# ACTION: Copy and paste these rules into Firebase Console
# ============================================================================

# STEP 8: UPDATE functions/index.js
# ============================================================================
# File: functions/index.js
# Location: Top of file, after existing imports
#
# Add these lines:
#
# // Import notification functions
# const notificationFunctions = require("./sendNotification");
#
# // Export notification functions
# exports.sendNotification = notificationFunctions.sendNotification;
# exports.sendNotificationToTopic = notificationFunctions.sendNotificationToTopic;
# exports.subscribeToTopic = notificationFunctions.subscribeToTopic;
# exports.unsubscribeFromTopic = notificationFunctions.unsubscribeFromTopic;
#
# ACTION: Add these lines to functions/index.js
# ============================================================================

# STEP 9: DEPLOY CLOUD FUNCTIONS
# ============================================================================
# In terminal/command prompt:
#
cd /path/to/your/project
firebase login                    # Login to Firebase
firebase deploy --only functions  # Deploy functions
firebase functions:list           # Verify deployment
#
# Expected output should show:
# ✓ sendNotification
# ✓ sendNotificationToTopic
# ✓ subscribeToTopic
# ✓ unsubscribeFromTopic
#
# ACTION: Run these commands in terminal
# ============================================================================

# STEP 10: ADD FIREBASE SCRIPTS TO HTML
# ============================================================================
# File: index.html (and any other pages that need notifications)
# Location: Before closing </body> tag
#
# Add these lines:
#
# <!-- Firebase SDK Scripts -->
# <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
# <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
# <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
# <script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"></script>
#
# <!-- Subtra Notification Scripts -->
# <script src="/firebase-config.js"></script>
# <script src="/notifications-fcm.js"></script>
# <script src="/notifications-ui.js"></script>
# <script src="/notifications-utils.js"></script>
#
# ACTION: Add these script tags to your HTML files
# ============================================================================

# STEP 11: ADD NOTIFICATION BUTTON
# ============================================================================
# File: Any page where you want the button (e.g., dashboard, settings)
# Location: Wherever you want the button to appear
#
# Add this HTML:
#
# <button
#   id="enable-notifications-btn"
#   class="btn btn-primary"
#   type="button"
# >
#   <i class="fas fa-bell"></i> Enable Notifications
# </button>
#
# The button is automatically wired by notifications-ui.js
#
# ACTION: Add this button to your pages
# ============================================================================

# STEP 12: TEST IN BROWSER
# ============================================================================
# 1. Open your app in a browser (must be HTTPS or localhost)
# 2. Open browser DevTools (F12)
# 3. Go to Console tab
# 4. Run this command:
#
await enableNotifications()
#
# 5. Browser should show permission dialog
# 6. Click "Allow"
# 7. In console you should see:
#    "✓ FCM Token obtained: ..."
#
# 8. Go to Firestore and check:
#    users/{your-user-id}/fcmTokens/{token}
#    You should see your token there
#
# ACTION: Test in browser, verify all steps work
# ============================================================================

# STEP 13: SEND TEST NOTIFICATION
# ============================================================================
# 1. In browser console, run:
#
await sendTestNotification()
#
# 2. You should see a notification appear on your screen
# 3. In console, you should see:
#    "Notification sent: ..."
#
# 4. If you see this, everything is working!
#
# ACTION: Send test notification and verify
# ============================================================================

# STEP 14: TEST BACKGROUND NOTIFICATIONS
# ============================================================================
# 1. Close the browser tab (or minimize to background)
# 2. Go to Firebase Console → Cloud Messaging tab
# 3. Click: "Send your first message"
# 4. Fill in:
#    - Title: "Test"
#    - Body: "Test notification"
#    - Target: Choose "FCM registration token"
#    - Get your token from: console.log(await getCurrentFCMToken())
# 5. Click: "Send"
# 6. A notification should appear on your desktop
# 7. Click it to open the app
#
# ACTION: Test background notifications
# ============================================================================

# COMPLETION CHECKLIST
# ============================================================================
# 
# ☐ Firebase project created
# ☐ Firebase config values obtained
# ☐ VAPID key obtained
# ☐ firebase-config.js updated
# ☐ firebase-messaging-sw.js updated (config + VAPID)
# ☐ notifications-fcm.js updated (VAPID)
# ☐ Firestore security rules set
# ☐ functions/index.js updated with exports
# ☐ Cloud Functions deployed
# ☐ Firebase scripts added to HTML
# ☐ Notification button added to at least one page
# ☐ Permission request tested
# ☐ Token appeared in Firestore
# ☐ Test notification sent and received
# ☐ Background notification tested
# ☐ Notification click opens app
#
# If all items are checked: ✅ YOU'RE DONE!
#
# ============================================================================

# NEXT STEPS
# ============================================================================
#
# 1. Add more notification buttons to other pages
# 2. Create notification preferences UI
# 3. Integrate with subscription renewal logic
# 4. Send real notifications to test users
# 5. Monitor and optimize
# 6. Launch to all users!
#
# For detailed information, see:
# - IMPLEMENTATION-SUMMARY.md
# - PUSH-NOTIFICATIONS-README.md
# - QUICK-REFERENCE.md
#
# ============================================================================

echo "✅ Setup complete! Start with README-PUSH-NOTIFICATIONS.md"
