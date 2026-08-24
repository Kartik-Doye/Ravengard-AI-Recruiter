import React, { Component, ErrorInfo } from 'react';
import { ShieldAlert, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log errors appropriately for a production environment.
    console.error('React Router Render Boundary Error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--color-bg-0)] p-6">
          <div className="glass-panel p-8 md:p-12 max-w-lg text-center rounded-3xl border border-red-500/20">
            <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
            <h1 className="text-2xl font-semibold text-white mb-4">A critical error occurred</h1>
            <p className="text-white/70 mb-8">
              We encountered an unexpected issue while rendering this page. Our team has been notified.
            </p>
            <Button 
              variant="solid" 
              onClick={this.handleReset}
              leftIcon={<RotateCcw className="w-4 h-4" />}
            >
              Reset and Try Again
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
