import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';

interface Props {
  onRetry: () => void;
  message?: string;
}

export function ApiTimeoutFallback({ onRetry, message = "The server is taking too long to respond." }: Props) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center glass-panel rounded-2xl max-w-md mx-auto my-12">
      <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
      <h3 className="text-xl font-medium text-white mb-2">Connection Timeout</h3>
      <p className="text-white/60 mb-6">{message}</p>
      <Button variant="outline" onClick={onRetry} leftIcon={<RefreshCw className="w-4 h-4" />}>
        Retry Request
      </Button>
    </div>
  );
}
