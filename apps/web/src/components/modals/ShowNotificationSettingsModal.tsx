import { useState, useEffect } from 'react';
import { notificationManager } from '../../lib/notifications';
import { useEntitlements } from '../../hooks/useEntitlements';

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
  if (!isOpen) return null;
  
  const [showSettings, setShowSettings] = useState(notificationManager.getShowSettings(show.id));
  const [globalSettings, setGlobalSettings] = useState(notificationManager.getSettings());
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const { hasFullAccess } = useEntitlements();
  const isProUser = hasFullAccess;

  useEffect(() => {
    if (isOpen) {
      setShowSettings(notificationManager.getShowSettings(show.id));
      setGlobalSettings(notificationManager.getSettings());
      
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
            <h2 className="text-xl font-bold">🔔 Watch Reminders</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Episode alerts for <strong>{show.title}</strong>
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
            <h3 className="text-lg font-semibold">Episode Alerts</h3>
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={showSettings.enabled}
                onChange={(e) => handleShowSettingChange('enabled', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <div>
                <span>Enable reminders for this show</span>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  Get release alerts when new episodes of {show.title} are coming up
                </p>
              </div>
            </label>
          </div>

          {isProUser && showSettings.enabled && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Reminder Timing</h3>
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
                  Overrides your global reminder timing for this show only
                </p>
              </div>
            </div>
          )}

          {showSettings.enabled && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold">Device Notifications</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                Choose how this show reaches you. These override your global device settings.
              </p>
              
              <label className="flex items-center space-x-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showSettings.methods?.inApp !== false}
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
                  checked={showSettings.methods?.push !== false}
                  onChange={(e) => handleMethodChange('push', e.target.checked)}
                  disabled={pushPermission === 'denied'}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div className="flex-1">
                  <span>Push notifications</span>
                  <p className="text-xs" style={{ color: 'var(--muted)' }}>
                    Device alerts when the app is in the background
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
          )}

          <div className="p-4 rounded-lg border" style={{ backgroundColor: 'var(--btn)', borderColor: 'var(--line)' }}>
            <h4 className="font-semibold mb-2">Global Reminder Settings</h4>
            <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
              Defaults for all shows unless overridden above. Open Settings → Watch Reminders to change.
            </p>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Reminders:</span>
                <span style={{ color: 'var(--text)' }}>
                  {globalSettings.globalEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: 'var(--muted)' }}>Default timing:</span>
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
