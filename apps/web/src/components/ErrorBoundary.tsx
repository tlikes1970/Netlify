import { Component, ErrorInfo, ReactNode } from 'react';
import { derr } from '../lib/log';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
  name?: string;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const boundaryName = this.props.name ? `[ErrorBoundary: ${this.props.name}]` : '[ErrorBoundary]';
    derr(boundaryName, error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div 
          role="alert" 
          className="flex flex-col items-center justify-center p-4 text-center"
          style={{ minHeight: '120px' }}
        >
          <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
            Something went wrong here. Try again.
          </p>
          <button
            onClick={this.handleReset}
            className="px-3 py-1.5 text-xs rounded transition-colors"
            style={{ 
              backgroundColor: 'var(--btn)', 
              color: 'var(--text)', 
              borderColor: 'var(--line)', 
              border: '1px solid' 
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}



