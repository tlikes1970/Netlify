import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { notificationManager } from '@/lib/notifications';
import { sendTestEmail } from '@/api/notifications';
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
  const [cooldownEndsAt, setCooldownEndsAt] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (isOpen) {
      setShowSettings(notificationManager.getShowSettings(Number(show.id)));
      setMessage(null);
      setCooldownEndsAt(null);
      setCooldownSeconds(0);
    }
  }, [isOpen, show.id]);

  // Cooldown timer effect
  useEffect(() => {
    if (!cooldownEndsAt) return;

    const updateCooldown = () => {
      const now = Date.now();
      const remaining = Math.ceil((cooldownEndsAt - now) / 1000);
      
      if (remaining <= 0) {
        setCooldownEndsAt(null);
        setCooldownSeconds(0);
      } else {
        setCooldownSeconds(remaining);
      }
    };

    const interval = setInterval(updateCooldown, 1000);
    updateCooldown(); // Initial update

    return () => clearInterval(interval);
  }, [cooldownEndsAt]);

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
        text: `Notifications ${newSettings.enabled ? 'enabled' : 'disabled'} for ${show.title}`
      });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);

    } catch (error) {
      console.error('Failed to toggle notifications:', error);
      setMessage({
        type: 'error',
        text: 'Failed to update notification settings'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestEmail = async () => {
    setIsLoading(true);
    setMessage(null);

    try {
      // Get user email from prompt
      const userEmail = prompt('Enter your email address to receive a test notification:');
      if (!userEmail) {
        setMessage({
          type: 'error',
          text: 'Email address is required to send a test notification'
        });
        return;
      }

      // Basic email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userEmail)) {
        setMessage({
          type: 'error',
          text: 'Please enter a valid email address'
        });
        return;
      }

      // Call the Netlify function
      await sendTestEmail(userEmail);
      
      setMessage({
        type: 'success',
        text: 'Test email sent successfully! Check your inbox.'
      });

      // Start 30-second cooldown
      setCooldownEndsAt(Date.now() + 30000);

      // Clear message after 5 seconds
      setTimeout(() => setMessage(null), 5000);

    } catch (error) {
      console.error('Test email failed:', error);
      setMessage({
        type: 'error',
        text: `Test email failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleMethodToggle = (method: 'inApp' | 'push' | 'email') => {
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

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-modal flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold" style={{ color: 'var(--text)' }}>
            🔔 Notification Settings
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Show Info */}
          <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--card)' }}>
            <h3 className="font-medium" style={{ color: 'var(--text)' }}>
              {show.title}
            </h3>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              {show.mediaType === 'tv' ? 'TV Show' : 'Movie'}
            </p>
          </div>

          {/* Main Toggle */}
          <div className="mb-4">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-medium" style={{ color: 'var(--text)' }}>
                Enable Notifications
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
                ? 'You will receive notifications for new episodes'
                : 'No notifications will be sent for this show'
              }
            </p>
          </div>

          {/* Notification Methods */}
          {showSettings.enabled && (
            <div className="space-y-3">
              <h4 className="font-medium" style={{ color: 'var(--text)' }}>
                Notification Methods
              </h4>
              
              {/* In-App Notifications */}
              <label className="flex items-center justify-between cursor-pointer">
                <span style={{ color: 'var(--text)' }}>In-App Notifications</span>
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

              {/* Push Notifications */}
              <label className="flex items-center justify-between cursor-pointer">
                <span style={{ color: 'var(--text)' }}>Push Notifications</span>
                <button
                  onClick={() => handleMethodToggle('push')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showSettings.methods?.push ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showSettings.methods?.push ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>

              {/* Email Notifications (Pro only) */}
              <label className="flex items-center justify-between cursor-pointer">
                <span style={{ color: 'var(--text)' }}>
                  Email Notifications
                  <span className="ml-1 px-1 py-0.5 text-xs rounded" style={{ backgroundColor: 'var(--pro)', color: 'white' }}>
                    PRO
                  </span>
                </span>
                <button
                  onClick={() => handleMethodToggle('email')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    showSettings.methods?.email ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      showSettings.methods?.email ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </label>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Test Email Button */}
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={handleTestEmail}
              disabled={isLoading || cooldownEndsAt !== null}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading 
                ? 'Sending...' 
                : cooldownEndsAt 
                  ? `Test again in ${cooldownSeconds}s`
                  : '📧 Send Test Email'
              }
            </button>
            <p className="text-xs mt-2 text-center" style={{ color: 'var(--muted)' }}>
              Send a test email to verify your notification settings
            </p>
          </div>
        </div>

        {/* Footer */}
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
