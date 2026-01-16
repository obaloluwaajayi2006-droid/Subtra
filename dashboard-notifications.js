/**
 * Example: Dashboard Integration with Notifications
 * 
 * Shows how to integrate notifications into your dashboard
 * Include this as part of dashboard/script.js or separately
 */

// Listen for FCM messages and update dashboard
function initializeDashboardNotifications() {
  // Listen for real-time notifications
  const unsubscribe = listenForNotifications((payload) => {
    console.log('Dashboard received notification:', payload);

    // Update dashboard based on notification type
    const { notification, data } = payload;

    if (data?.subscriptionId) {
      // Refresh subscription list or specific subscription
      refreshSubscriptionList();
    }

    if (notification?.title?.includes('Renewal')) {
      // Highlight upcoming renewals
      highlightUpcomingRenewals();
    }
  });

  // Clean up listener on page unload
  window.addEventListener('beforeunload', unsubscribe);
}

/**
 * Add notification badge to navigation
 * Shows when new notifications are available
 */
function updateNotificationBadge() {
  const badge = document.getElementById('notification-badge');
  if (!badge) return;

  if (isNotificationsEnabled()) {
    badge.style.display = 'inline-block';
    badge.classList.add('bg-success');
  } else if (canRequestNotifications()) {
    badge.style.display = 'inline-block';
    badge.classList.add('bg-warning');
  } else {
    badge.style.display = 'none';
  }
}

/**
 * Add notification control to dashboard
 */
function addNotificationControl() {
  // Check if button already exists
  if (document.getElementById('enable-notifications-btn')) {
    return;
  }

  // Create notification control container
  const container = document.createElement('div');
  container.className = 'notification-control';
  container.innerHTML = `
    <div class="card border-primary">
      <div class="card-header bg-primary text-white">
        <h5><i class="fas fa-bell"></i> Notifications</h5>
      </div>
      <div class="card-body">
        <p class="text-muted">Get notified about subscription renewals and important updates</p>
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
  `;

  // Insert into appropriate location
  const sidebar = document.querySelector('.sidebar') || document.querySelector('main');
  if (sidebar) {
    sidebar.insertBefore(container, sidebar.firstChild);
  }
}

/**
 * Show notification preferences modal
 */
function showNotificationPreferences() {
  const modalContent = `
    <div class="modal fade" id="notificationModal" tabindex="-1">
      <div class="modal-dialog">
        <div class="modal-content">
          <div class="modal-header">
            <h5 class="modal-title">Notification Settings</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <h6>Notification Preferences</h6>
            
            <div class="form-check mb-3">
              <input
                class="form-check-input notification-pref"
                type="checkbox"
                id="pref-renewals"
                data-topic="subscription-renewals"
                checked
              >
              <label class="form-check-label" for="pref-renewals">
                Subscription renewals (7 days before)
              </label>
            </div>
            
            <div class="form-check mb-3">
              <input
                class="form-check-input notification-pref"
                type="checkbox"
                id="pref-price-changes"
                data-topic="price-changes"
              >
              <label class="form-check-label" for="pref-price-changes">
                Price change notifications
              </label>
            </div>
            
            <div class="form-check mb-3">
              <input
                class="form-check-input notification-pref"
                type="checkbox"
                id="pref-announcements"
                data-topic="announcements"
              >
              <label class="form-check-label" for="pref-announcements">
                Product announcements
              </label>
            </div>
            
            <hr>
            
            <button
              type="button"
              class="btn btn-primary"
              onclick="sendTestNotification()"
            >
              <i class="fas fa-paper-plane"></i> Send Test Notification
            </button>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              Close
            </button>
            <button
              type="button"
              class="btn btn-primary"
              onclick="saveNotificationPreferences()"
              data-bs-dismiss="modal"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Remove old modal if exists
  const oldModal = document.getElementById('notificationModal');
  if (oldModal) oldModal.remove();

  // Create and show new modal
  const wrapper = document.createElement('div');
  wrapper.innerHTML = modalContent;
  document.body.appendChild(wrapper.firstChild);

  // Initialize modal
  const modal = new bootstrap.Modal(document.getElementById('notificationModal'));
  modal.show();

  // Load current preferences
  loadNotificationPreferences();
}

/**
 * Save user's notification preferences
 */
async function saveNotificationPreferences() {
  try {
    const db = firebase.firestore();
    const userId = firebase.auth().currentUser?.uid;

    if (!userId) return;

    const preferences = {
      'subscription-renewals': document.getElementById('pref-renewals')?.checked || false,
      'price-changes': document.getElementById('pref-price-changes')?.checked || false,
      'announcements': document.getElementById('pref-announcements')?.checked || false,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    // Save to Firestore
    await db.collection('users').doc(userId).update({
      notificationPreferences: preferences
    });

    // Subscribe/unsubscribe from topics
    for (const [topic, enabled] of Object.entries(preferences)) {
      if (enabled && topic !== 'updatedAt') {
        await subscribeToTopic(topic);
      } else if (!enabled && topic !== 'updatedAt') {
        await unsubscribeFromTopic(topic);
      }
    }

    console.log('✓ Notification preferences saved');
    showAlert('Notification preferences updated', 'success');
  } catch (error) {
    console.error('Error saving preferences:', error);
    showAlert('Error saving preferences', 'danger');
  }
}

/**
 * Load user's notification preferences
 */
async function loadNotificationPreferences() {
  try {
    const db = firebase.firestore();
    const userId = firebase.auth().currentUser?.uid;

    if (!userId) return;

    const userDoc = await db.collection('users').doc(userId).get();
    const preferences = userDoc.data()?.notificationPreferences || {};

    // Update checkboxes
    document.getElementById('pref-renewals').checked = preferences['subscription-renewals'] || false;
    document.getElementById('pref-price-changes').checked = preferences['price-changes'] || false;
    document.getElementById('pref-announcements').checked = preferences['announcements'] || false;
  } catch (error) {
    console.error('Error loading preferences:', error);
  }
}

/**
 * Helper: Show alert message
 */
function showAlert(message, type = 'info') {
  const alertElement = document.createElement('div');
  alertElement.className = `alert alert-${type} alert-dismissible fade show`;
  alertElement.setAttribute('role', 'alert');
  alertElement.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;

  const container = document.querySelector('main') || document.body;
  container.insertBefore(alertElement, container.firstChild);

  setTimeout(() => alertElement.remove(), 4000);
}

/**
 * Initialize all dashboard notification features
 * Call this on dashboard page load
 */
async function initNotificationDashboard() {
  console.log('Initializing notification dashboard...');

  // Wait for FCM Manager to initialize
  if (!window.fcmManager) {
    setTimeout(initNotificationDashboard, 100);
    return;
  }

  // Add notification control to page
  addNotificationControl();

  // Initialize listeners
  initializeDashboardNotifications();

  // Update badge
  updateNotificationBadge();

  // Listen for permission changes
  window.addEventListener('focus', updateNotificationBadge);

  console.log('✓ Notification dashboard initialized');
}

// Auto-initialize if on dashboard
if (window.location.pathname.includes('dashboard')) {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initNotificationDashboard);
  } else {
    initNotificationDashboard();
  }
}

console.log('✓ Dashboard notifications module loaded');
