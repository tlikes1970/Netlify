import { useState, useEffect, useRef } from 'react';
import type { PersonalityLevel } from '../lib/settings';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  personalityLevel: PersonalityLevel;
  onClose: () => void;
  action?: { label: string; onClick: () => void };
}

export default function Toast({ message, type, onClose, action }: ToastProps) {
  const [isVisible, setIsVisible] = useState(true);

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const remaining = useRef(action ? 8000 : 3000);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>();
  const close = () => {
    setIsVisible(false);
    closeTimer.current = setTimeout(onClose, 300);
  };
  useEffect(() => () => clearTimeout(closeTimer.current), []);
  useEffect(() => {
    if (!isVisible || hovered || focused) return;
    const started = Date.now();
    const timer = setTimeout(() => {
      setIsVisible(false);
      closeTimer.current = setTimeout(onClose, 300);
    }, remaining.current);
    return () => {
      clearTimeout(timer);
      remaining.current = Math.max(0, remaining.current - (Date.now() - started));
    };
  }, [onClose, isVisible, hovered, focused]);

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
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false); }}
      className={`fixed z-50 px-4 py-3 rounded-lg shadow-lg transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
      style={{
        ...getToastStyle(),
        top: 'calc(var(--safe-top, 0px) + 1rem)',
        right: 'calc(var(--safe-right, 0px) + 1rem)',
      }}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{message}</p>
        {action && (
          <button
            className="ml-3 text-sm font-semibold underline"
            onClick={() => { action.onClick(); close(); }}
          >
            {action.label}
          </button>
        )}
        <button
          onClick={() => {
            close();
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
    action?: { label: string; onClick: () => void };
  }>>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info', action?: { label: string; onClick: () => void }) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type, action }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  return { toasts, addToast, removeToast };
}
