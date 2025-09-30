/**
 * Notification System - v28.82
 * Provides user feedback for data operations (success, error, info)
 */

(function() {
  'use strict';
  
  const NS = '[notifications]';
  const log = (...a) => console.log(NS, ...a);
  const warn = (...a) => console.warn(NS, ...a);
  const err = (...a) => console.error(NS, ...a);

  /**
   * Notification System for user feedback
   */
  window.NotificationSystem = {
    _container: null,
    _notifications: new Map(),
    _zIndex: 10000,

    /**
     * Initialize notification system
     */
    init() {
      log('Initializing notification system...');
      this._createContainer();
      this._setupStyles();
      log('Notification system initialized');
    },

    /**
     * Create notification container
     */
    _createContainer() {
      // Remove existing container if any
      const existing = document.getElementById('notification-container');
      if (existing) {
        existing.remove();
      }

      this._container = document.createElement('div');
      this._container.id = 'notification-container';
      this._container.className = 'notification-container';
      document.body.appendChild(this._container);
    },

    /**
     * Setup notification styles
     */
    _setupStyles() {
      if (document.getElementById('notification-styles')) {
        return; // Already added
      }

      const style = document.createElement('style');
      style.id = 'notification-styles';
      style.textContent = `
        .notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 10000;
          pointer-events: none;
        }
        
        .notification {
          background: var(--bg, #ffffff);
          border: 1px solid var(--border, #e5e7eb);
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          padding: 12px 16px;
          margin-bottom: 8px;
          max-width: 300px;
          pointer-events: auto;
          transform: translateX(100%);
          transition: transform 0.3s ease-in-out, opacity 0.3s ease-in-out;
          opacity: 0;
          position: relative;
        }
        
        .notification.show {
          transform: translateX(0);
          opacity: 1;
        }
        
        .notification.success {
          border-left: 4px solid #10b981;
          background: #f0fdf4;
        }
        
        .notification.error {
          border-left: 4px solid #ef4444;
          background: #fef2f2;
        }
        
        .notification.info {
          border-left: 4px solid #3b82f6;
          background: #eff6ff;
        }
        
        .notification.warning {
          border-left: 4px solid #f59e0b;
          background: #fffbeb;
        }
        
        .notification__content {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .notification__icon {
          font-size: 16px;
          flex-shrink: 0;
        }
        
        .notification__message {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: var(--fg, #1f2937);
        }
        
        .notification__close {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          color: var(--muted, #6b7280);
          padding: 0;
          width: 20px;
          height: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .notification__close:hover {
          color: var(--fg, #1f2937);
        }
        
        @media (max-width: 640px) {
          .notification-container {
            top: 10px;
            right: 10px;
            left: 10px;
          }
          
          .notification {
            max-width: none;
          }
        }
      `;
      document.head.appendChild(style);
    },

    /**
     * Show a notification
     */
    show(message, type = 'info', duration = 5000) {
      log('Showing notification:', { message, type, duration });
      
      const id = Date.now() + Math.random();
      const notification = this._createNotification(id, message, type);
      
      this._container.appendChild(notification);
      this._notifications.set(id, notification);
      
      // Trigger animation
      requestAnimationFrame(() => {
        notification.classList.add('show');
      });
      
      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          this.hide(id);
        }, duration);
      }
      
      return id;
    },

    /**
     * Create notification element
     */
    _createNotification(id, message, type) {
      const notification = document.createElement('div');
      notification.className = `notification ${type}`;
      notification.dataset.id = id;
      
      const icon = this._getIcon(type);
      
      notification.innerHTML = `
        <div class="notification__content">
          <span class="notification__icon">${icon}</span>
          <span class="notification__message">${this._escapeHtml(message)}</span>
          <button class="notification__close" onclick="window.NotificationSystem.hide(${id})">&times;</button>
        </div>
      `;
      
      return notification;
    },

    /**
     * Get icon for notification type
     */
    _getIcon(type) {
      const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
      };
      return icons[type] || icons.info;
    },

    /**
     * Hide a notification
     */
    hide(id) {
      const notification = this._notifications.get(id);
      if (!notification) {
        return;
      }
      
      notification.classList.remove('show');
      
      setTimeout(() => {
        if (notification.parentNode) {
          notification.parentNode.removeChild(notification);
        }
        this._notifications.delete(id);
      }, 300);
    },

    /**
     * Hide all notifications
     */
    hideAll() {
      this._notifications.forEach((notification, id) => {
        this.hide(id);
      });
    },

    /**
     * Escape HTML to prevent XSS
     */
    _escapeHtml(text) {
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      window.NotificationSystem.init();
    });
  } else {
    window.NotificationSystem.init();
  }

  // Expose global notification functions for backward compatibility
  window.showNotification = (message, type = 'info', duration = 5000) => {
    return window.NotificationSystem.show(message, type, duration);
  };

  log('Notification system loaded');
})();
