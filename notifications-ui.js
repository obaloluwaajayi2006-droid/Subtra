/**
 * UI Module: Notification Permission Button
 * 
 * Provides UI components and handlers for requesting notification permission
 * Can be added to any page (dashboard, settings, home, etc.)
 * 
 * Usage:
 * 1. Add a button with id="enable-notifications-btn"
 * 2. Include this script
 * 3. The button will automatically be wired up
 */

class NotificationUI {
  constructor() {
    this.button = document.getElementById('enable-notifications-btn');
    this.init();
  }

  /**
   * Initialize the notification UI
   */
  init() {
    if (!this.button) {
      console.warn('Notification button not found in DOM');
      return;
    }

    // Check if notifications are already enabled
    this.updateButtonState();

    // Add click handler
    this.button.addEventListener('click', () => this.handleEnableClick());

    // Listen for notification permission changes
    window.addEventListener('focus', () => this.updateButtonState());

    console.log('✓ Notification UI initialized');
  }

  /**
   * Update button state based on notification permission
   */
  updateButtonState() {
    const permission = Notification.permission;

    switch (permission) {
      case 'granted':
        this.button.innerHTML = '<i class="fas fa-bell-slash"></i> Notifications Enabled';
        this.button.classList.add('btn-success');
        this.button.classList.remove('btn-primary');
        this.button.disabled = false;
        this.button.title = 'You have notifications enabled';
        break;

      case 'denied':
        this.button.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Permission Denied';
        this.button.classList.add('btn-danger');
        this.button.classList.remove('btn-primary', 'btn-success');
        this.button.disabled = true;
        this.button.title = 'Notification permission was denied. Please enable it in browser settings.';
        break;

      default:
        this.button.innerHTML = '<i class="fas fa-bell"></i> Enable Notifications';
        this.button.classList.add('btn-primary');
        this.button.classList.remove('btn-success', 'btn-danger');
        this.button.disabled = false;
        this.button.title = 'Click to enable push notifications';
    }
  }

  /**
   * Handle enable button click
   */
  async handleEnableClick() {
    if (Notification.permission === 'granted') {
      this.showMessage('Notifications are already enabled!', 'success');
      return;
    }

    if (Notification.permission === 'denied') {
      this.showMessage(
        'Notification permission was denied. Please enable it in your browser settings.',
        'error'
      );
      return;
    }

    // Request permission
    this.button.disabled = true;
    this.button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Requesting...';

    try {
      const result = await enableNotifications();

      if (result) {
        this.showMessage('✓ Notifications enabled successfully!', 'success');
        setTimeout(() => this.updateButtonState(), 500);
      } else {
        this.showMessage('✗ Failed to enable notifications.', 'error');
        this.updateButtonState();
      }
    } catch (error) {
      console.error('Error enabling notifications:', error);
      this.showMessage('Error enabling notifications. Please try again.', 'error');
      this.updateButtonState();
    }
  }

  /**
   * Show a message to the user
   */
  showMessage(message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.setAttribute('role', 'alert');
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Find container or use body
    const container = document.querySelector('main') || document.body;
    container.insertBefore(alert, container.firstChild);

    // Auto dismiss
    setTimeout(() => {
      alert.remove();
    }, 5000);
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.notificationUI = new NotificationUI();
  });
} else {
  window.notificationUI = new NotificationUI();
}
