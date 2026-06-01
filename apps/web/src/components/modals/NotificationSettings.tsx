import { useState, useEffect } from 'react';
import { notificationManager } from '../../lib/notifications';
import { useEntitlements } from '../../hooks/useEntitlements';

interface NotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationSettings({ isOpen, onClose }: NotificationSettingsProps) {
  if (!isOpen) return null;
  const [settings, setSettings] = useState(notificationManager.getSettings());
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const { hasFullAccess } = useEntitlements();
  const isProUser = hasFullAccess;

  useEffect(() => {
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, []);

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
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      <div 
        className="relative bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: 'var(--card)', color: 'var(--text)' }}
      >
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--line)' }}>
          <div>
            <h2 className="text-xl font-bold">🔔 Reminder Settings</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Watch reminders and release alerts on this device
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

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)] space-y-6">
          
          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Episode Reminders</h3>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.globalEnabled}
                onChange={(e) => handleSettingChange('globalEnabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span>Enable watch reminders</span>
            </label>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Reminder Timing</h3>
            
            {isProUser ? (
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
                  Choose how far ahead episode alerts fire on your device
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-sm font-medium">When to remind you:</label>
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
                <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
                  Sign in to start your 21-day trial for hour-by-hour reminder timing.
                </p>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Device Notifications</h3>
            
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.methods.inApp}
                onChange={(e) => handleMethodChange('inApp', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span>In-app alerts</span>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Show reminders while you are using Flicklet
                </p>
              </div>
            </label>

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
                  Browser or device alerts when the app is in the background
                </p>
                {pushPermission === 'default' && (
                  <button
                    onClick={requestPushPermission}
                    className="text-xs text-blue-500 hover:underline mt-1"
                  >
                    Enable device notifications
                  </button>
                )}
                {pushPermission === 'denied' && (
                  <p className="text-xs text-red-500 mt-1">
                    Notifications are blocked. Turn them on in your browser or device settings.
                  </p>
                )}
              </div>
            </label>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-semibold">Per-Show Reminders</h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Open Watch Reminders from any show card to customize alerts for that title.
            </p>
          </div>
        </div>

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
