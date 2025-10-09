import React, { Component, ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, MapPin, Wifi, WifiOff } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  retryCount: number;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, retryCount: 0 };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, retryCount: 0 };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Map Error Boundary caught an error:', error, errorInfo);
    console.error('Error stack:', error.stack);
    console.error('Component stack:', errorInfo.componentStack);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <Card className="h-full w-full flex items-center justify-center bg-gray-50 dark:bg-gray-900">
          <CardContent className="text-center p-8">
            <div className="mb-4">
              {this.state.error?.message?.includes('network') || 
               this.state.error?.message?.includes('fetch') ? (
                <WifiOff className="w-16 h-16 mx-auto text-red-500 mb-4" />
              ) : (
                <MapPin className="w-16 h-16 mx-auto text-orange-500 mb-4" />
              )}
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Map Loading Error
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4 max-w-md">
              {this.state.error?.message?.includes('network') || 
               this.state.error?.message?.includes('fetch') 
                ? "Unable to load map tiles. Please check your internet connection and try again."
                : this.state.error?.message?.includes('Leaflet') || 
                  this.state.error?.message?.includes('MapContainer')
                ? "Map library loading issue. Please refresh the page or check your browser console."
                : "There was an issue loading the map. This might be due to tile server limitations or network issues."}
            </p>
            
            {this.state.error?.message && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
                <p className="text-sm text-red-700 dark:text-red-300">
                  <strong>Error:</strong> {this.state.error.message}
                </p>
              </div>
            )}
            
            <div className="space-y-2">
              <Button 
                onClick={this.handleRetry}
                className="w-full"
                disabled={this.state.retryCount >= 3}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry Loading Map
              </Button>
              
              {this.state.retryCount >= 3 && (
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Multiple retry attempts failed. Please refresh the page or check your connection.
                </p>
              )}
            </div>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-sm text-gray-500 cursor-pointer">
                  Error Details (Development)
                </summary>
                <pre className="text-xs text-red-600 mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded overflow-auto">
                  {this.state.error.stack}
                </pre>
              </details>
            )}
          </CardContent>
        </Card>
      );
    }

    return this.props.children;
  }
}
