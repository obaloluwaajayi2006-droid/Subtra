// Notification Manager
class NotificationManager {
  constructor() {
    this.notifications = this.loadFromStorage();
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  addNotification(message, type = 'info') {
    const notification = {
      id: Date.now(),
      message,
      type,
      timestamp: new Date().toLocaleString(),
      read: false
    };
    this.notifications.unshift(notification);
    this.saveToStorage();
    this.render();
    this.updateBadge();
  }

  deleteNotification(id) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.saveToStorage();
    this.render();
    this.updateBadge();
  }

  readNotification(id) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.saveToStorage();
      this.render();
      this.updateBadge();
    }
  }

  clearAll() {
    if (this.notifications.length > 0) {
      if (confirm('Are you sure you want to clear all notifications?')) {
        this.notifications = [];
        this.saveToStorage();
        this.render();
        this.updateBadge();
      }
    }
  }

  saveToStorage() {
    localStorage.setItem('subtraNotifications', JSON.stringify(this.notifications));
  }

  loadFromStorage() {
    const stored = localStorage.getItem('subtraNotifications');
    return stored ? JSON.parse(stored) : [];
  }

  updateBadge() {
    const badge = document.getElementById('notificationBadge');
    const unreadCount = this.notifications.filter(n => !n.read).length;
    if (unreadCount > 0) {
      badge.textContent = unreadCount;
      badge.style.display = 'inline-block';
    } else {
      badge.style.display = 'none';
    }
  }

  getTypeIcon(type) {
    const icons = {
      'success': '<i class="fas fa-check-circle" style="color: #34d399;"></i>',
      'error': '<i class="fas fa-times-circle" style="color: #fca5a5;"></i>',
      'info': '<i class="fas fa-info-circle" style="color: #8b5cf6;"></i>',
      'warning': '<i class="fas fa-exclamation-circle" style="color: #fcd34d;"></i>'
    };
    return icons[type] || icons['info'];
  }

  render() {
    const list = document.getElementById('notificationsList');
    const empty = document.getElementById('emptyState');

    if (this.notifications.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }

    empty.style.display = 'none';
    list.innerHTML = this.notifications.map(n => `
      <div class="list-group-item" style="background: rgba(139, 92, 246, 0.05); border: 1px solid rgba(139, 92, 246, 0.2); margin-bottom: 10px; border-radius: 8px; padding: 15px; cursor: pointer; transition: background 0.3s;" onmouseover="this.style.background='rgba(139, 92, 246, 0.1)'" onmouseout="this.style.background='rgba(139, 92, 246, 0.05)'">
        <div class="d-flex justify-content-between align-items-start">
          <div class="d-flex align-items-start flex-grow-1">
            <div style="margin-right: 12px; margin-top: 2px;">
              ${this.getTypeIcon(n.type)}
            </div>
            <div style="flex-grow: 1;">
              <p class="mb-1 text-light" style="cursor: pointer;" onclick="notificationManager.readNotification(${n.id})">
                ${n.message}
              </p>
              <small class="text-muted">${n.timestamp}</small>
              ${!n.read ? '<span class="badge bg-danger ms-2" style="font-size: 0.7rem;">New</span>' : ''}
            </div>
          </div>
          <button class="btn btn-sm" style="background: none; border: none; color: #fca5a5; padding: 0; margin-left: 10px;" onclick="notificationManager.deleteNotification(${n.id}); event.stopPropagation();">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `).join('');

    this.updateBadge();
  }

  attachEventListeners() {
    const clearBtn = document.getElementById('clearAllBtn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.clearAll());
    }
  }
}

// Initialize Notification Manager
window.notificationManager = new NotificationManager();
