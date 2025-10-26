import React, { useState } from 'react';

interface ButtonState {
  pressed: boolean;
  loading: boolean;
  success: boolean;
  error: boolean;
}

interface ActionButtonProps {
  label: string;
  onClick?: () => Promise<void> | void;
  testId?: string;
  isSpecial?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ActionButton({ 
  label, 
  onClick, 
  testId, 
  isSpecial = false, 
  className = '', 
  style = {} 
}: ActionButtonProps) {
  const [state, setState] = useState<ButtonState>({
    pressed: false,
    loading: false,
    success: false,
    error: false
  });

  const handleClick = async () => {
    if (!onClick || state.loading) return;

    // Set pressed state
    setState(prev => ({ ...prev, pressed: true }));

    try {
      // Set loading state
      setState(prev => ({ ...prev, loading: true }));

      // Call the action
      await onClick();

      // Set success state
      setState(prev => ({ ...prev, success: true }));

      // Clear success state after delay
      setTimeout(() => {
        setState(prev => ({ ...prev, success: false }));
      }, 1000);

    } catch (_error) {
      // Set error state
      setState(prev => ({ ...prev, error: true }));

      // Clear error state after delay
      setTimeout(() => {
        setState(prev => ({ ...prev, error: false }));
      }, 2000);
    } finally {
      // Clear pressed and loading states
      setTimeout(() => {
        setState(prev => ({ 
          ...prev, 
          pressed: false, 
          loading: false 
        }));
      }, 200);
    }
  };

  const getButtonStyle = () => {
    if (state.success) {
      return {
        backgroundColor: '#10b981', // green-500
        color: 'white',
        borderColor: '#10b981',
        ...style
      };
    }
    if (state.error) {
      return {
        backgroundColor: '#ef4444', // red-500
        color: 'white',
        borderColor: '#ef4444',
        ...style
      };
    }
    if (state.pressed) {
      return {
        backgroundColor: 'var(--accent)',
        color: isSpecial ? 'white' : 'var(--text)',
        borderColor: 'var(--line)',
        ...style
      };
    }
    return {
      backgroundColor: 'var(--btn)',
      color: isSpecial ? 'white' : 'var(--text)',
      borderColor: 'var(--line)',
      ...style
    };
  };

  const getButtonContent = () => {
    if (state.loading) {
      return (
        <div className="flex items-center justify-center">
          <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin mr-1"></div>
          <span className="text-[10px]">...</span>
        </div>
      );
    }
    if (state.success) {
      return (
        <div className="flex items-center justify-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px]">Done</span>
        </div>
      );
    }
    if (state.error) {
      return (
        <div className="flex items-center justify-center">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
          <span className="text-[10px]">Error</span>
        </div>
      );
    }
    return label;
  };

  return (
    <button
      onClick={handleClick}
      className={`px-2.5 py-1.5 rounded-lg text-xs transition-all duration-200 ${
        state.pressed ? 'scale-95 opacity-80' : 'hover:scale-105 hover:opacity-90'
      } ${state.loading ? 'cursor-wait' : 'cursor-pointer'} ${className}`}
      style={getButtonStyle()}
      data-testid={testId}
      disabled={state.loading}
    >
      {getButtonContent()}
    </button>
  );
}
