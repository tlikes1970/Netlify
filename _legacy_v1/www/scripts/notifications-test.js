/**
 * Process: Notifications Testability System
 * Purpose: Add mock mode and visible state indicators for notification testing
 * Data Source: Notification settings, mock data, visible state indicators
 * Update Path: Modify mock data or add new test modes in this file
 * Dependencies: Notification system, window.FLAGS, settings UI
 */

(function () {
  'use strict';

  if (window.NotificationsTest) return; // Prevent double initialization

  console.log('🔔 Initializing notifications testability system...');

  // Notification modes
  const NOTIFICATION_MODES = {
    LIVE: 'live',
    MOCK: 'mock',
    DISABLED: 'disabled',
  };

  // Current notification mode
  let currentMode = NOTIFICATION_MODES.LIVE;

  // Mock notification data for testing
  const MOCK_NOTIFICATIONS = [
    {
      id: 'mock-1',
      type: 'episode',
      title: 'New Episode Available',
      message: 'Breaking Bad S01E01 - Pilot is now available',
      show: 'Breaking Bad',
      episode: 'Pilot',
      season: 1,
      episodeNumber: 1,
      airDate: new Date().toISOString(),
      priority: 'high',
    },
    {
      id: 'mock-2',
      type: 'episode',
      title: 'Episode Reminder',
      message: 'The Office S02E01 - The Dundies airs in 2 hours',
      show: 'The Office',
      episode: 'The Dundies',
      season: 2,
      episodeNumber: 1,
      airDate: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      priority: 'medium',
    },
    {
      id: 'mock-3',
      type: 'discover',
      title: 'New Show Recommendation',
      message: 'Based on your watching history, you might like "Stranger Things"',
      show: 'Stranger Things',
      priority: 'low',
    },
    {
      id: 'mock-4',
      type: 'digest',
      title: 'Weekly Digest',
      message: 'You watched 3 episodes this week. Keep it up!',
      priority: 'low',
    },
  ];

  // Get notification mode from settings
  function getNotificationMode() {
    const saved = localStorage.getItem('flicklet:notifications:mode');
    return saved || NOTIFICATION_MODES.LIVE;
  }

  // Set notification mode
  function setNotificationMode(mode) {
    currentMode = mode;
    localStorage.setItem('flicklet:notifications:mode', mode);
    updateModeIndicator();
    console.log('🔔 Notification mode set to:', mode);
  }

  // Update mode indicator in UI
  function updateModeIndicator() {
    const indicator = document.getElementById('notificationModeIndicator');
    if (!indicator) return;

    const modeText = {
      [NOTIFICATION_MODES.LIVE]: 'Live Mode',
      [NOTIFICATION_MODES.MOCK]: 'Mock Mode',
      [NOTIFICATION_MODES.DISABLED]: 'Disabled',
    };

    const modeColor = {
      [NOTIFICATION_MODES.LIVE]: '#28a745',
      [NOTIFICATION_MODES.MOCK]: '#ffc107',
      [NOTIFICATION_MODES.DISABLED]: '#dc3545',
    };

    indicator.textContent = modeText[currentMode];
    indicator.style.color = modeColor[currentMode];
    indicator.style.fontWeight = '600';
  }

  // Show mock notification
  function showMockNotification(notification) {
    console.log('🔔 Showing mock notification:', notification);

    if (window.Toast && window.Toast.show) {
      window.Toast.show(notification.message, 'info', { duration: 5000 });
    } else if (window.showNotification) {
      window.showNotification(notification.message, 'info');
    }

    // Add to visible state log
    addToNotificationLog(notification);
  }

  // Add notification to visible state log
  function addToNotificationLog(notification) {
    const log = document.getElementById('notificationLog');
    if (!log) return;

    const logEntry = document.createElement('div');
    logEntry.className = 'notification-log-entry';
    logEntry.style.cssText = `
      padding: 8px 12px;
      margin: 4px 0;
      background: var(--color-surface-secondary, #f8f9fa);
      border-radius: 4px;
      border-left: 3px solid var(--color-primary, #007bff);
      font-size: 14px;
    `;

    const timestamp = new Date().toLocaleTimeString();
    logEntry.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 600;">${notification.title}</span>
        <span style="font-size: 12px; color: var(--color-text-secondary, #666);">${timestamp}</span>
      </div>
      <div style="margin-top: 4px; color: var(--color-text-secondary, #666);">
        ${notification.message}
      </div>
    `;

    log.insertBefore(logEntry, log.firstChild);

    // Keep only last 10 entries
    while (log.children.length > 10) {
      log.removeChild(log.lastChild);
    }
  }

  // Generate random mock notification
  function generateMockNotification() {
    const randomNotification =
      MOCK_NOTIFICATIONS[Math.floor(Math.random() * MOCK_NOTIFICATIONS.length)];
    const notification = { ...randomNotification };
    notification.id = `mock-${Date.now()}`;
    notification.airDate = new Date().toISOString();
    return notification;
  }

  // Test notification system
  function testNotifications() {
    console.log('🔔 Testing notification system...');

    if (currentMode === NOTIFICATION_MODES.DISABLED) {
      if (window.showNotification) {
        window.showNotification('Notifications are disabled. Enable them to test.', 'warning');
      }
      return;
    }

    if (currentMode === NOTIFICATION_MODES.MOCK) {
      const mockNotification = generateMockNotification();
      showMockNotification(mockNotification);
    } else {
      // Live mode - show a test notification
      if (window.showNotification) {
        window.showNotification('Test notification from live mode', 'info');
      }
    }
  }

  // Create notification test UI
  function createNotificationTestUI() {
    const settingsSection = document.getElementById('notifications');
    if (!settingsSection) return;

    // Add test controls
    const testControls = document.createElement('div');
    testControls.className = 'settings-control-group';
    testControls.innerHTML = `
      <h4 class="settings-subtitle">🧪 Notification Testing</h4>
      <p class="settings-description">Test and debug notification functionality</p>
      
      <div style="display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap;">
        <button id="testNotificationBtn" class="btn secondary" style="flex: 1; min-width: 120px;">
          🧪 Test Notification
        </button>
        <button id="clearNotificationLogBtn" class="btn secondary" style="flex: 1; min-width: 120px;">
          🗑️ Clear Log
        </button>
      </div>
      
      <div style="margin-bottom: 16px;">
        <label for="notificationModeSelect" style="display: block; margin-bottom: 8px; font-weight: 600;">
          Notification Mode:
        </label>
        <select id="notificationModeSelect" class="settings-input" style="width: 100%; max-width: 200px;">
          <option value="${NOTIFICATION_MODES.LIVE}">Live Mode</option>
          <option value="${NOTIFICATION_MODES.MOCK}">Mock Mode</option>
          <option value="${NOTIFICATION_MODES.DISABLED}">Disabled</option>
        </select>
        <div id="notificationModeIndicator" style="margin-top: 8px; font-size: 14px; font-weight: 600;"></div>
      </div>
      
      <div>
        <label style="display: block; margin-bottom: 8px; font-weight: 600;">
          Notification Log:
        </label>
        <div id="notificationLog" style="
          max-height: 200px;
          overflow-y: auto;
          border: 1px solid var(--color-border, #e9ecef);
          border-radius: 4px;
          padding: 8px;
          background: var(--color-surface, #fff);
        ">
          <div style="text-align: center; color: var(--color-text-secondary, #666); padding: 20px;">
            No notifications yet. Click "Test Notification" to start.
          </div>
        </div>
      </div>
    `;

    settingsSection.appendChild(testControls);

    // Add event listeners
    document.getElementById('testNotificationBtn').addEventListener('click', testNotifications);
    document.getElementById('clearNotificationLogBtn').addEventListener('click', () => {
      const log = document.getElementById('notificationLog');
      if (log) {
        log.innerHTML =
          '<div style="text-align: center; color: var(--color-text-secondary, #666); padding: 20px;">No notifications yet. Click "Test Notification" to start.</div>';
      }
    });

    document.getElementById('notificationModeSelect').addEventListener('change', (e) => {
      setNotificationMode(e.target.value);
    });

    // Set initial mode
    const modeSelect = document.getElementById('notificationModeSelect');
    modeSelect.value = currentMode;
    updateModeIndicator();
  }

  // Override notification functions for mock mode
  function setupMockMode() {
    if (currentMode !== NOTIFICATION_MODES.MOCK) return;

    console.log('🔔 Setting up mock mode...');

    // Override notification functions to use mock data
    const originalShowNotification = window.showNotification;
    window.showNotification = function (message, type, duration) {
      const mockNotification = generateMockNotification();
      showMockNotification(mockNotification);
    };

    // Override Toast.show if available
    if (window.Toast && window.Toast.show) {
      const originalToastShow = window.Toast.show;
      window.Toast.show = function (message, type, options) {
        const mockNotification = generateMockNotification();
        showMockNotification(mockNotification);
      };
    }
  }

  // Initialize the system
  function init() {
    currentMode = getNotificationMode();

    // Create test UI
    createNotificationTestUI();

    // Setup mock mode if needed
    setupMockMode();

    console.log('🔔 Notifications testability system initialized');
  }

  // Public API
  window.NotificationsTest = {
    setMode: setNotificationMode,
    getMode: () => currentMode,
    test: testNotifications,
    generateMock: generateMockNotification,
    showMock: showMockNotification,
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
