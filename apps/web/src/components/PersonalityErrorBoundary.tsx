import { Component, ErrorInfo, ReactNode } from 'react';
import { derr } from '../lib/log';
import { settingsManager, getPersonalityText } from '../lib/settings';
import { logErrorDetails } from '../lib/errorMessages';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export default class PersonalityErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    derr('PersonalityErrorBoundary caught an error:', error, errorInfo);
    logErrorDetails('PersonalityErrorBoundary', error, { componentStack: errorInfo.componentStack });
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Safely get settings with fallback
      let errorMessage = "Something went wrong. Please try again.";
      try {
        const settings = settingsManager.getSettings();
        errorMessage = getPersonalityText('errorGeneric', settings.personalityLevel);
      } catch (e) {
        // If settings manager fails, use default message
        console.warn('Error boundary: Could not get settings:', e);
      }

      // Display error details in dev mode
      const errorDetails = import.meta.env.DEV && this.state.error 
        ? this.state.error.message 
        : null;

      return (
        <div className="flex flex-col items-center justify-center min-h-[200px] p-8 text-center">
          <div className="mb-4">
            <svg
              className="w-16 h-16 mx-auto text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
            Hmm, that didn't work
          </h2>
          <p className="text-sm mb-4" style={{ color: 'var(--muted)' }}>
            {errorMessage}
          </p>
          {errorDetails && (
            <p className="text-xs mb-4 font-mono p-2 bg-red-50 dark:bg-red-900/20 rounded" style={{ color: 'var(--muted)', maxWidth: '600px', wordBreak: 'break-word' }}>
              {errorDetails}
            </p>
          )}
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg transition-colors"
            style={{ backgroundColor: 'var(--btn)', color: 'var(--text)', borderColor: 'var(--line)', border: '1px solid' }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
