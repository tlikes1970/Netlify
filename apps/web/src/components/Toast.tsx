import React, { useState, useEffect } from 'react';
import { getPersonalityText } from '../lib/settings';
import type { PersonalityLevel } from '../lib/settings';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  personalityLevel: PersonalityLevel;
  onClose: () => void;
}

export default function Toast({ message, type, personalityLevel, onClose }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for animation to complete
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  const getToastStyle = () => {
    switch (type) {
      case 'success':
        return {
          backgroundColor: 'var(--card)',
          borderColor: '#10b981', // green-500
          color: 'var(--text)',
          border: '1px solid'
        };
      case 'error':
        return {
          backgroundColor: 'var(--card)',
          borderColor: '#ef4444', // red-500
          color: 'var(--text)',
          border: '1px solid'
        };
      default:
        return {
          backgroundColor: 'var(--card)',
          borderColor: 'var(--line)',
          color: 'var(--text)',
          border: '1px solid'
        };
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      style={getToastStyle()}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-3 text-neutral-400 hover:text-neutral-200 transition-colors"
          aria-label="Close notification"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}

// Toast manager hook
export function useToast() {
  const [toasts, setToasts] = useState<Array<{
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }>>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
}
