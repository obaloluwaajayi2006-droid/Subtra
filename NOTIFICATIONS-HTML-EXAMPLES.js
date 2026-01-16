/**
 * HTML Integration Examples
 * Copy-paste these examples into your pages to add notification features
 */

// ============================================================================
// EXAMPLE 1: Dashboard with Notification Control
// ============================================================================

/*
Add this to dashboard/index.html:

<div class="container mt-5">
  <div class="row">
    
    <!-- Notification Control Card -->
    <div class="col-md-4 mb-4">
      <div class="card border-primary h-100">
        <div class="card-header bg-primary text-white">
          <h5 class="mb-0"><i class="fas fa-bell"></i> Notifications</h5>
        </div>
        <div class="card-body">
          <p class="text-muted small">
            Get notified about subscription renewals and important updates.
          </p>
          <button
            id="enable-notifications-btn"
            class="btn btn-primary w-100"
            type="button"
          >
            <i class="fas fa-bell"></i> Enable Notifications
          </button>
          <div id="notification-status" style="margin-top: 15px;"></div>
        </div>
      </div>
    </div>

    <!-- Your other dashboard content -->
    <div class="col-md-8 mb-4">
      <!-- Dashboard content here -->
    </div>

  </div>
</div>

<!-- Include scripts -->
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"></script>

<script src="/firebase-config.js"></script>
<script src="/notifications-fcm.js"></script>
<script src="/notifications-ui.js"></script>
<script src="/notifications-utils.js"></script>
<script src="/dashboard-notifications.js"></script>
*/

// ============================================================================
// EXAMPLE 2: Settings Page with Preferences
// ============================================================================

/*
Add this to settings/index.html:

<div class="card">
  <div class="card-header">
    <h5><i class="fas fa-bell"></i> Push Notifications</h5>
  </div>
  <div class="card-body">
    <p class="text-muted">Manage your notification preferences.</p>

    <!-- Notification Preferences -->
    <div class="mb-4">
      <h6>Notification Types</h6>

      <div class="form-check mb-2">
        <input
          type="checkbox"
          id="pref-renewals"
          class="form-check-input"
          checked
        >
        <label class="form-check-label" for="pref-renewals">
          <strong>Subscription Renewals</strong>
          <small class="d-block text-muted">Reminders 7 days before renewal</small>
        </label>
      </div>

      <div class="form-check mb-2">
        <input
          type="checkbox"
          id="pref-price-changes"
          class="form-check-input"
        >
        <label class="form-check-label" for="pref-price-changes">
          <strong>Price Changes</strong>
          <small class="d-block text-muted">Alerts when subscription prices change</small>
        </label>
      </div>

      <div class="form-check mb-3">
        <input
          type="checkbox"
          id="pref-announcements"
          class="form-check-input"
        >
        <label class="form-check-label" for="pref-announcements">
          <strong>Product Announcements</strong>
          <small class="d-block text-muted">New features and updates</small>
        </label>
      </div>
    </div>

    <!-- Enable/Disable Notifications -->
    <div class="mb-4">
      <h6>Notification Status</h6>
      <button
        id="enable-notifications-btn"
        class="btn btn-primary"
        type="button"
      >
        <i class="fas fa-bell"></i> Enable Notifications
      </button>
    </div>

    <!-- Test Notification -->
    <div>
      <h6>Test</h6>
      <button
        type="button"
        class="btn btn-outline-primary"
        onclick="sendTestNotification()"
      >
        <i class="fas fa-paper-plane"></i> Send Test Notification
      </button>
    </div>
  </div>
  <div class="card-footer">
    <small class="text-muted">
      <i class="fas fa-info-circle"></i>
      Notifications require HTTPS and browser permission. Some notifications
      may take a few minutes to arrive.
    </small>
  </div>
</div>

<script>
// Save preferences when they change
document.querySelectorAll('.form-check-input').forEach(checkbox => {
  checkbox.addEventListener('change', async () => {
    const prefs = {
      'subscription-renewals': document.getElementById('pref-renewals').checked,
      'price-changes': document.getElementById('pref-price-changes').checked,
      'announcements': document.getElementById('pref-announcements').checked
    };

    try {
      const db = firebase.firestore();
      await db.collection('users')
        .doc(firebase.auth().currentUser.uid)
        .update({ notificationPreferences: prefs });

      alert('Preferences saved!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Error saving preferences');
    }
  });
});
</script>
*/

// ============================================================================
// EXAMPLE 3: Navigation Bar with Dropdown
// ============================================================================

/*
Add this to your navigation/header:

<nav class="navbar navbar-expand-lg navbar-dark bg-dark">
  <div class="container-fluid">
    <a class="navbar-brand" href="/">Subtra</a>

    <button class="navbar-toggler" type="button" data-bs-toggle="collapse">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse">
      <ul class="navbar-nav ms-auto">
        <!-- ... other nav items ... -->

        <!-- Notification Dropdown -->
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" id="notificationDropdown" role="button">
            <i class="fas fa-bell"></i>
            <span id="notification-badge" class="badge bg-danger" style="display: none;">
              <i class="fas fa-check"></i>
            </span>
          </a>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="notificationDropdown">
            <li>
              <button class="dropdown-item" id="enable-notifications-btn">
                <i class="fas fa-bell"></i> Enable Notifications
              </button>
            </li>
            <li>
              <a class="dropdown-item" href="/settings">
                <i class="fas fa-cog"></i> Notification Settings
              </a>
            </li>
            <li><hr class="dropdown-divider"></li>
            <li>
              <button class="dropdown-item" onclick="sendTestNotification()">
                <i class="fas fa-paper-plane"></i> Send Test
              </button>
            </li>
          </ul>
        </li>
      </ul>
    </div>
  </div>
</nav>

<script src="/firebase-config.js"></script>
<script src="/notifications-fcm.js"></script>
<script src="/notifications-ui.js"></script>
<script src="/notifications-utils.js"></script>
</script>
*/

// ============================================================================
// EXAMPLE 4: Subscription Card with Notification Indicator
// ============================================================================

/*
Add this to your subscription cards:

<div class="card subscription-card">
  <div class="card-body">
    <div class="d-flex justify-content-between align-items-start">
      <div>
        <h5>Netflix</h5>
        <p class="text-muted mb-0">$15.99/month</p>
      </div>

      <!-- Notification Status Indicator -->
      <span class="badge" id="notification-badge-netflix">
        <i class="fas fa-bell"></i>
      </span>
    </div>

    <div class="mt-3">
      <small class="text-muted">
        Renews in <strong>7 days</strong>
        <i class="fas fa-bell-slash" id="no-notif-netflix"
           style="display: none; margin-left: 5px;">
        </i>
      </small>
    </div>
  </div>
  <div class="card-footer">
    <button class="btn btn-sm btn-outline-primary"
            onclick="editSubscription('netflix-id')">
      <i class="fas fa-edit"></i> Edit
    </button>
  </div>
</div>

<script>
// Script to update notification badges
function updateSubscriptionNotificationBadges() {
  const isNotifEnabled = isNotificationsEnabled();

  document.querySelectorAll('[id^="notification-badge-"]').forEach(badge => {
    if (isNotifEnabled) {
      badge.classList.add('bg-success');
      badge.classList.remove('bg-secondary');
    } else {
      badge.classList.add('bg-secondary');
      badge.classList.remove('bg-success');
    }
  });
}

// Call on page load and whenever notification status changes
updateSubscriptionNotificationBadges();
window.addEventListener('focus', updateSubscriptionNotificationBadges);
</script>
*/

// ============================================================================
// EXAMPLE 5: Modal Dialog for Permission Request
// ============================================================================

/*
Add this to show an elegant permission request:

<div class="modal fade" id="notificationPromptModal" tabindex="-1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header bg-primary text-white">
        <h5 class="modal-title">
          <i class="fas fa-bell"></i> Enable Notifications
        </h5>
        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
      </div>
      <div class="modal-body">
        <p>
          Get notified about your subscription renewals and important updates.
          We'll send you a reminder <strong>7 days before</strong> each subscription renews.
        </p>

        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          <small>
            Notifications require your browser permission. You can change this
            in your browser settings at any time.
          </small>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
          Not Now
        </button>
        <button
          type="button"
          class="btn btn-primary"
          onclick="enableNotificationsAndClose()"
        >
          <i class="fas fa-bell"></i> Enable Notifications
        </button>
      </div>
    </div>
  </div>
</div>

<script>
function showNotificationPrompt() {
  if (Notification.permission === 'default') {
    const modal = new bootstrap.Modal(document.getElementById('notificationPromptModal'));
    modal.show();
  }
}

async function enableNotificationsAndClose() {
  await enableNotifications();
  const modal = bootstrap.Modal.getInstance(document.getElementById('notificationPromptModal'));
  modal.hide();
}

// Show prompt after a delay (let user explore app first)
setTimeout(() => {
  showNotificationPrompt();
}, 5000);
</script>
*/

// ============================================================================
// EXAMPLE 6: Full JavaScript Implementation
// ============================================================================

/*
Complete example showing all notification operations:

<script>
// Wait for FCM Manager to be ready
function waitForFCMManager() {
  return new Promise((resolve) => {
    if (window.fcmManager) {
      resolve();
    } else {
      const checkInterval = setInterval(() => {
        if (window.fcmManager) {
          clearInterval(checkInterval);
          resolve();
        }
      }, 100);
    }
  });
}

// Initialize notifications on page load
window.addEventListener('load', async () => {
  await waitForFCMManager();

  // 1. Check if notifications are supported
  if (!isNotificationsEnabled() && canRequestNotifications()) {
    console.log('Notifications not enabled yet');
  }

  // 2. Show notification button
  const button = document.getElementById('enable-notifications-btn');
  if (button) {
    button.addEventListener('click', async () => {
      const result = await enableNotifications();
      if (result) {
        console.log('✓ Notifications enabled');
        updateUI();
      }
    });
  }

  // 3. Listen for incoming notifications
  listenForNotifications((notification) => {
    console.log('Received notification:', notification);

    // Refresh subscription list if notification is about subscriptions
    if (notification.data?.subscriptionId) {
      refreshSubscriptions();
    }
  });

  // 4. Update UI based on notification status
  updateUI();
});

function updateUI() {
  const status = getNotificationStatus();
  const statusEl = document.getElementById('notification-status');

  if (statusEl) {
    if (status === 'enabled') {
      statusEl.innerHTML = `
        <div class="alert alert-success">
          <i class="fas fa-check-circle"></i>
          Notifications are enabled
        </div>
      `;
    } else if (status === 'denied') {
      statusEl.innerHTML = `
        <div class="alert alert-danger">
          <i class="fas fa-exclamation-circle"></i>
          Notifications permission denied in browser settings
        </div>
      `;
    } else {
      statusEl.innerHTML = `
        <div class="alert alert-info">
          <i class="fas fa-info-circle"></i>
          Click the button above to enable notifications
        </div>
      `;
    }
  }
}

// Utility function to refresh subscriptions
async function refreshSubscriptions() {
  const userId = firebase.auth().currentUser?.uid;
  if (!userId) return;

  const db = firebase.firestore();
  const snapshot = await db.collection('users')
    .doc(userId)
    .collection('subscriptions')
    .get();

  console.log('Refreshed subscriptions:', snapshot.size);
  // Update your UI with fresh data
}

// On user logout
function handleLogout() {
  // Clear FCM tokens
  clearFCMTokens();
  // Redirect to login
  window.location.href = '/signin';
}
</script>
*/

// ============================================================================
// SUMMARY
// ============================================================================

/*
REQUIRED SCRIPTS (add to all pages):

<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-firestore-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"></script>

<script src="/firebase-config.js"></script>
<script src="/notifications-fcm.js"></script>
<script src="/notifications-ui.js"></script>
<script src="/notifications-utils.js"></script>

OPTIONAL SCRIPTS (add only where needed):

<script src="/dashboard-notifications.js"></script>   <!-- For dashboard -->


HTML ELEMENTS (minimum required):

<button id="enable-notifications-btn" class="btn btn-primary" type="button">
  <i class="fas fa-bell"></i> Enable Notifications
</button>


AVAILABLE FUNCTIONS:

// Check status
isNotificationsEnabled()
canRequestNotifications()
getNotificationStatus()

// Request permission
await enableNotifications()

// Send/manage
await sendTestNotification()
await subscribeToTopic('topic-name')
await unsubscribeFromTopic('topic-name')

// Listen
listenForNotifications((payload) => { ... })

// Debug
debugNotificationStatus()

For more details, see PUSH-NOTIFICATIONS-README.md
*/

console.log('✓ HTML Integration Examples Loaded');
