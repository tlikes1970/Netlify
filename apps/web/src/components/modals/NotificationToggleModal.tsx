import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { notificationManager } from '@/lib/notifications';
import type { MediaItem } from '@/components/cards/card.types';

interface NotificationToggleModalProps {
  isOpen: boolean;
  onClose: () => void;
  show: MediaItem;
}

export function NotificationToggleModal({ isOpen, onClose, show }: NotificationToggleModalProps) {
  const [showSettings, setShowSettings] = useState(notificationManager.getShowSettings(Number(show.id)));
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    if (isOpen) {
      setShowSettings(notificationManager.getShowSettings(Number(show.id)));
      setMessage(null);
      if ('Notification' in window) {
        setPushPermission(Notification.permission);
      }
    }
  }, [isOpen, show.id]);

  const handleToggle = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      const newSettings = {
        ...showSettings,
        enabled: !showSettings.enabled
      };

      notificationManager.updateShowSettings(Number(show.id), newSettings);
      setShowSettings(newSettings);

      setMessage({
        type: 'success',
        text: `Reminders ${newSettings.enabled ? 'enabled' : 'disabled'} for ${show.title}`
      });

      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Failed to toggle reminders:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update reminder settings'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodToggle = (method: 'inApp' | 'push') => {
    const newSettings = {
      ...showSettings,
      methods: {
        ...showSettings.methods,
        [method]: !showSettings.methods?.[method]
      }
    };

    notificationManager.updateShowSettings(Number(show.id), newSettings);
    setShowSettings(newSettings);
  };

  const requestPushPermission = async () => {
    const permission = await notificationManager.requestPushPermission();
    setPushPermission(permission ? 'granted' : 'denied');
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center">
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            🔔 Watch Reminders
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
            <h3 className="font-medium" style={{ color: 'var(--text)' }}>
              {show.title}
            </h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {show.mediaType === 'tv' ? 'TV Show' : 'Movie'}
            </p>
          </div>

          <div className="mb-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                Episode alerts
              </span>
              <button
                onClick={handleToggle}
                disabled={isLoading}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showSettings.enabled ? 'bg-blue-600' : 'bg-gray-300'
                } ${isLoading ? 'opacity-50' : ''}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    showSettings.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {showSettings.enabled 
                ? 'You will get device reminders for new episodes'
                : 'No reminders for this show'
              }
            </p>
          </div>

          {showSettings.enabled && (
            <div className="space-y-3">
              <h4 className="font-medium" style={{ color: 'var(--text)' }}>
                Device notifications
              </h4>
              
              <label className="flex items-center justify-between cursor-pointer">
                <span style={{ color: 'var(--text)' }}>In-app alerts</span>
                <button
                  onClick={() => handleMethodToggle('inApp')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showSettings.methods?.inApp !== false ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showSettings.methods?.inApp !== false ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <span style={{ color: 'var(--text)' }}>Push notifications</span>
                <button
                  onClick={() => handleMethodToggle('push')}
                  disabled={pushPermission === 'denied'}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showSettings.methods?.push !== false ? 'bg-blue-600' : 'bg-gray-300'
                  } ${pushPermission === 'denied' ? 'opacity-50' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showSettings.methods?.push !== false ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
              {pushPermission === 'default' && (
                <button
                  onClick={requestPushPermission}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Enable device notifications
                </button>
              )}
              {pushPermission === 'denied' && (
                <p className="text-xs text-red-500">
                  Notifications are blocked in your browser or device settings.
                </p>
              )}
            </div>
          )}

          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 p-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
