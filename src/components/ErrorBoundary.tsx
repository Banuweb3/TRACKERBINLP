import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    console.error('🛡️ ErrorBoundary caught error:', error);
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🛡️ ErrorBoundary details:', error, errorInfo);
    
    // Log specific H.id errors
    if (error.message.includes("can't access property") || error.message.includes("is undefined")) {
      console.error('🛡️ Detected H.id type error - this is the DigitalOcean production bug');
    }
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
          <div className="glass-dark p-8 rounded-2xl border border-white/20 max-w-md text-center">
            <div className="text-red-400 mb-4">
              <svg className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-text-light mb-4">
              Application Error
            </h2>
            <p className="text-text-light/80 mb-6">
              Something went wrong. The application has been protected from crashing.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-gradient-to-r from-primary to-accent hover:from-primary-focus hover:to-accent text-text-light font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 border border-primary/30"
            >
              Reload Application
            </button>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-red-400 cursor-pointer">Error Details</summary>
                <pre className="mt-2 p-3 bg-black/30 rounded text-xs text-red-300 overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
