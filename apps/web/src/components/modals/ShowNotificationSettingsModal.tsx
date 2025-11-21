import { useState, useEffect } from 'react';
import { notificationManager } from '../../lib/notifications';
import { useProStatus } from '../../lib/proStatus';

interface ShowNotificationSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: {
    id: number;
    title: string;
    mediaType: 'tv' | 'movie';
  };
}

export function ShowNotificationSettingsModal({ isOpen, onClose, show }: ShowNotificationSettingsModalProps) {
  console.log('🔔 ShowNotificationSettingsModal render:', { isOpen, show: show?.title });
  
  if (!isOpen) {
    console.log('🔔 Modal not open, returning null');
    return null;
  }
  
  const [showSettings, setShowSettings] = useState(notificationManager.getShowSettings(show.id));
  const [globalSettings, setGlobalSettings] = useState(notificationManager.getSettings());
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  // Pro gating: Use centralized Pro status helper
  // Config: proStatus.ts - useProStatus()
  const proStatus = useProStatus();
  const isProUser = proStatus.isPro;

  useEffect(() => {
    if (isOpen) {
      // Load current settings
      setShowSettings(notificationManager.getShowSettings(show.id));
      setGlobalSettings(notificationManager.getSettings());
      
      // Check push notification permission
      if ('Notification' in window) {
        setPushPermission(Notification.permission);
      }
    }
  }, [isOpen, show.id]);

  const handleShowSettingChange = (key: string, value: any) => {
    const newSettings = { ...showSettings, [key]: value };
    setShowSettings(newSettings);
    notificationManager.updateShowSettings(show.id, newSettings);
  };

  const handleMethodChange = (method: string, enabled: boolean) => {
    const newMethods = { ...showSettings.methods, [method]: enabled };
    const newSettings = { ...showSettings, methods: newMethods };
    setShowSettings(newSettings);
    notificationManager.updateShowSettings(show.id, newSettings);
  };

  const requestPushPermission = async () => {
    const permission = await notificationManager.requestPushPermission();
    setPushPermission(permission ? 'granted' : 'denied');
  };

  const sendTestNotification = async () => {
    // Get user email from settings or prompt
    const userEmail = prompt('Enter your email address to test notifications:');
    if (!userEmail) return;

    try {
      await notificationManager.sendTestNotification(userEmail);
      alert('✅ Test notification sent! Check your email.');
    } catch (error) {
      console.error('Test notification failed:', error);
      alert('❌ Test notification failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: 'var(--card)', color: 'var(--text)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--line)' }}>
          <div>
            <h2 className="text-xl font-bold">🔔 Notification Settings</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Manage notifications for <strong>{show.title}</strong>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-2xl hover:opacity-70 transition-opacity"
            style={{ color: 'var(--muted)' }}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          
          {/* Show-specific Enable/Disable */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Episode Notifications</h3>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showSettings.enabled}
                onChange={(e) => handleShowSettingChange('enabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span>Enable notifications for this show</span>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  You will receive notifications for new episodes of {show.title}
                </p>
              </div>
            </label>
          </div>

          {/* Show-specific Timing (Pro only) */}
          {isProUser && showSettings.enabled && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Custom Timing</h3>
              <div className="space-y-2">
                <label className="block text-sm font-medium">Hours before episode airs:</label>
                <select
                  value={showSettings.timing || globalSettings.proTierTiming}
                  onChange={(e) => handleShowSettingChange('timing', parseInt(e.target.value))}
                  className="w-full p-2 border rounded"
                  style={{ backgroundColor: 'var(--bg)', borderColor: 'var(--line)', color: 'var(--text)' }}
                >
                  {Array.from({ length: 24 }, (_, i) => i + 1).map(hours => (
                    <option key={hours} value={hours}>
                      {hours} hour{hours !== 1 ? 's' : ''} before
                    </option>
                  ))}
                </select>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Override global timing for this show only
                </p>
              </div>
            </div>
          )}

          {/* Show-specific Notification Methods */}
          {showSettings.enabled && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Notification Methods</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Choose how you want to be notified for this show. These settings override your global preferences.
              </p>
              
              {/* In-App Notifications */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSettings.methods?.inApp !== false}
                  onChange={(e) => handleMethodChange('inApp', e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span>In-app notifications</span>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Show notifications within the app
                  </p>
                </div>
              </label>

              {/* Push Notifications */}
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSettings.methods?.push !== false}
                  onChange={(e) => handleMethodChange('push', e.target.checked)}
                  disabled={pushPermission === 'denied'}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span>Push notifications</span>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Browser notifications (works when app is closed)
                  </p>
                  {pushPermission === 'default' && (
                    <button
                      onClick={requestPushPermission}
                      className="text-xs text-blue-500 hover:underline mt-1"
                    >
                      Grant permission
                    </button>
                  )}
                  {pushPermission === 'denied' && (
                    <p className="text-xs text-red-500 mt-1">
                      Permission denied. Enable in browser settings.
                    </p>
                  )}
                </div>
              </label>

              {/* Email Notifications (Pro only) */}
              <label className={`flex items-center space-x-3 ${!isProUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
                <input
                  type="checkbox"
                  checked={showSettings.methods?.email !== false}
                  onChange={(e) => handleMethodChange('email', e.target.checked)}
                  disabled={!isProUser}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div>
                  <span>Email notifications</span>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    {isProUser 
                      ? 'Receive notifications via email' 
                      : 'Pro feature - upgrade to enable email notifications'
                    }
                  </p>
                  {!isProUser && (
                    <span className="inline-block px-2 py-1 text-xs rounded-full mt-1" 
                          style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                      PRO
                    </span>
                  )}
                </div>
              </label>
            </div>
          )}

          {/* Test Notification */}
          {showSettings.enabled && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Test Notifications</h3>
              <button
                onClick={sendTestNotification}
                className="w-full px-4 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                style={{ backgroundColor: 'var(--accent)', color: 'white' }}
              >
                📧 Send Test Email
              </button>
              <p className="text-xs" style={{ color: 'var(--muted)' }}>
                Test the email notification system to make sure it's working properly
              </p>
            </div>
          )}

          {/* Global Settings Link */}
          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--btn)', borderColor: 'var(--line)' }}>
            <h4 className="font-semibold mb-2">Global Notification Settings</h4>
            <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
              These settings apply to all shows unless overridden above.
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Global Notifications:</span>
                <span style={{ color: 'var(--text)' }}>
                  {globalSettings.globalEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Default Timing:</span>
                <span style={{ color: 'var(--text)' }}>
                  {isProUser 
                    ? `${globalSettings.proTierTiming} hours before`
                    : globalSettings.freeTierTiming === '24-hours-before' 
                      ? '24 hours before' 
                      : '7 days before'
                  }
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t" style={{ borderColor: 'var(--line)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border transition-colors"
            style={{ 
              backgroundColor: 'var(--btn)', 
              color: 'var(--text)', 
              borderColor: 'var(--line)' 
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
