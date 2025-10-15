import React, { useState, useEffect } from 'react';
import { notificationManager, NotificationLogEntry } from '../../lib/notifications';
import { useTranslations } from '../../lib/language';

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const [logEntries, setLogEntries] = useState<NotificationLogEntry[]>([]);
  const [filter, setFilter] = useState<'all' | 'sent' | 'failed' | 'read'>('all');
  const translations = useTranslations();

  useEffect(() => {
    if (isOpen) {
      setLogEntries(notificationManager.getLog());
    }
  }, [isOpen]);

  const filteredEntries = logEntries.filter(entry => {
    if (filter === 'all') return true;
    return entry.status === filter;
  });

  const markAsRead = (entryId: string) => {
    notificationManager.markAsRead(entryId);
    setLogEntries(notificationManager.getLog());
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'text-green-600';
      case 'delivered':
        return 'text-blue-600';
      case 'failed':
        return 'text-red-600';
      case 'read':
        return 'text-gray-500';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return '✅';
      case 'delivered':
        return '📨';
      case 'failed':
        return '❌';
      case 'read':
        return '👁️';
      default:
        return '📋';
    }
  };

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'in-app':
        return '📱';
      case 'push':
        return '🔔';
      case 'email':
        return '📧';
      default:
        return '📋';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden"
        style={{ backgroundColor: 'var(--card)', color: 'var(--text)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: 'var(--line)' }}>
          <div>
            <h2 className="text-xl font-bold">📋 Notification History</h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Track all your episode notifications
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

        {/* Filters */}
        <div className="p-4 border-b" style={{ borderColor: 'var(--line)' }}>
          <div className="flex gap-2">
            {[
              { key: 'all', label: 'All' },
              { key: 'sent', label: 'Sent' },
              { key: 'failed', label: 'Failed' },
              { key: 'read', label: 'Read' },
            ].map(filterOption => (
              <button
                key={filterOption.key}
                onClick={() => setFilter(filterOption.key as any)}
                className={`px-3 py-1 rounded text-sm transition-colors ${
                  filter === filterOption.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {filterOption.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-semibold mb-2">No notifications yet</h3>
              <p className="text-sm" style={{ color: 'var(--muted)' }}>
                {filter === 'all' 
                  ? 'You haven\'t received any episode notifications yet.'
                  : `No ${filter} notifications found.`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredEntries.map(entry => (
                <div 
                  key={entry.id}
                  className={`p-4 rounded-lg border transition-colors ${
                    entry.status === 'read' ? 'opacity-60' : ''
                  }`}
                  style={{ 
                    backgroundColor: 'var(--bg)', 
                    borderColor: 'var(--line)' 
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">{getMethodIcon(entry.method)}</span>
                        <h4 className="font-semibold">{entry.showName}</h4>
                        <span className={`text-sm ${getStatusColor(entry.status)}`}>
                          {getStatusIcon(entry.status)} {entry.status}
                        </span>
                      </div>
                      
                      <p className="text-sm mb-2" style={{ color: 'var(--text)' }}>
                        {entry.episodeTitle}
                      </p>
                      
                      <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--muted)' }}>
                        <span>📅 Air Date: {new Date(entry.airDate).toLocaleDateString()}</span>
                        <span>⏰ Sent: {new Date(entry.notificationTime).toLocaleString()}</span>
                        <span>📱 Method: {entry.method}</span>
                      </div>
                    </div>
                    
                    {entry.status !== 'read' && (
                      <button
                        onClick={() => markAsRead(entry.id)}
                        className="px-3 py-1 text-xs rounded border transition-colors"
                        style={{ 
                          backgroundColor: 'var(--btn)', 
                          color: 'var(--text)', 
                          borderColor: 'var(--line)' 
                        }}
                      >
                        Mark as Read
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t" style={{ borderColor: 'var(--line)' }}>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>
            Showing {filteredEntries.length} of {logEntries.length} notifications
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded border transition-colors"
            style={{ 
              backgroundColor: 'var(--btn)', 
              color: 'var(--text)', 
              borderColor: 'var(--line)' 
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
