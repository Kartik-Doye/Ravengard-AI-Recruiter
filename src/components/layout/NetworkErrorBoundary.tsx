import React from 'react';
import { WifiOff, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  isOffline: boolean;
  isTimeout: boolean;
  requestError: Error | null;
  onRetry: () => void;
  children: React.ReactNode;
}

export function NetworkErrorBoundary({ isOffline, isTimeout, requestError, onRetry, children }: Props) {
  if (isOffline) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center glass-panel rounded-2xl max-w-md mx-auto my-12">
        <WifiOff className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">No Internet Connection</h3>
        <p className="text-white/60 mb-6">It looks like you are offline. Please check your network and try again.</p>
        <Button variant="outline" onClick={onRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Retry Connection
        </Button>
      </div>
    );
  }

  if (isTimeout || requestError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center glass-panel rounded-2xl max-w-md mx-auto my-12">
        <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
        <h3 className="text-xl font-medium text-white mb-2">
          {isTimeout ? 'Connection Timeout' : 'Request Failed'}
        </h3>
        <p className="text-white/60 mb-6">
          {isTimeout 
            ? 'The server is taking too long to respond. Please try again.'
            : (requestError?.message || 'An unexpected network error occurred.')}
        </p>
        <Button variant="outline" onClick={onRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
          Retry Request
        </Button>
      </div>
    );
  }

  return <>{children}</>;
}
