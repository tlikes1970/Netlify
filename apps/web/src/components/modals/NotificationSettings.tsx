import { useState, useEffect } from 'react';
import { notificationManager } from '../../lib/notifications';
import { useSettings } from '../../lib/settings';
import { startProUpgrade } from '../../lib/proUpgrade';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  if (!isOpen) return null;
  const [settings, setSettings] = useState(notificationManager.getSettings());
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isProUser, setIsProUser] = useState(false);
  const settingsManager = useSettings();

  useEffect(() => {
    // Check push notification permission
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }

    // Check if user is Pro (implement based on your auth system)
    setIsProUser(Boolean(settingsManager.pro));
  }, [settingsManager.pro]);

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    notificationManager.updateSettings(newSettings);
  };

  const handleMethodChange = (method: string, enabled: boolean) => {
    const newMethods = { ...settings.methods, [method]: enabled };
    const newSettings = { ...settings, methods: newMethods };
    setSettings(newSettings);
    notificationManager.updateSettings(newSettings);
  };

  const requestPushPermission = async () => {
    const permission = await notificationManager.requestPushPermission();
    setPushPermission(permission ? 'granted' : 'denied');
  };

  const timingOptions = notificationManager.getAvailableTimingOptions();

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
              Manage how and when you receive episode notifications
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
          
          {/* Global Enable/Disable */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Global Settings</h3>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.globalEnabled}
                onChange={(e) => handleSettingChange('globalEnabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span>Enable notifications</span>
            </label>
          </div>

          {/* Timing Settings */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Notification Timing</h3>
            
            {isProUser ? (
              // Pro user - precise timing
              <div className="space-y-2">
                <label className="block text-sm font-medium">Hours before episode airs:</label>
                <select
                  value={settings.proTierTiming}
                  onChange={(e) => handleSettingChange('proTierTiming', parseInt(e.target.value))}
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
                  Pro feature: Set exact timing for notifications
                </p>
              </div>
            ) : (
              // Free user - vague timing
              <div className="space-y-2">
                <label className="block text-sm font-medium">When to notify:</label>
                <div className="space-y-2">
                  {timingOptions.filter(opt => !opt.proOnly).map(option => (
                    <label key={option.value} className="flex items-center space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="timing"
                        value={option.value}
                        checked={settings.freeTierTiming === option.value}
                        onChange={(e) => handleSettingChange('freeTierTiming', e.target.value)}
                        className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span>{option.label}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Upgrade to Pro for precise timing control
                </p>
              </div>
            )}
          </div>

          {/* Notification Methods */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Notification Methods</h3>
            
            {/* In-App Notifications */}
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.methods.inApp}
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
                checked={settings.methods.push}
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
                checked={settings.methods.email}
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

          {/* Per-Show Settings Preview */}
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Per-Show Settings</h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              You can customize notification settings for individual shows by clicking the notification icon on each show's card.
            </p>
          </div>

          {/* Pro Upgrade Banner */}
          {!isProUser && (
            <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--btn)', borderColor: 'var(--line)' }}>
              <div className="flex items-center gap-3">
                <div className="text-2xl">💎</div>
                <div className="flex-1">
                  <h4 className="font-semibold">Upgrade to Pro</h4>
                  <p className="text-sm" style={{ color: 'var(--muted)' }}>
                    Get precise timing control, email notifications, and advanced features
                  </p>
                </div>
                <button 
                  onClick={startProUpgrade}
                  className="px-4 py-2 rounded text-sm font-medium transition-colors"
                  style={{ backgroundColor: 'var(--accent)', color: 'white' }}>
                  Upgrade
                </button>
              </div>
            </div>
          )}
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


