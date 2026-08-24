import { useState, useEffect, useCallback } from 'react';

export function useNetworkState() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [isTimeout, setIsTimeout] = useState(false);
  const [requestError, setRequestError] = useState<Error | null>(null);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const executeWithTimeout = useCallback(async <T>(
    promise: Promise<T>,
    timeoutMs: number = 8000
  ): Promise<T> => {
    setIsTimeout(false);
    setRequestError(null);

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        setIsTimeout(true);
        reject(new Error('Request timed out'));
      }, timeoutMs);

      promise
        .then((res) => {
          clearTimeout(timeoutId);
          resolve(res);
        })
        .catch((err) => {
          clearTimeout(timeoutId);
          setRequestError(err);
          reject(err);
        });
    });
  }, []);

  return {
    isOffline,
    isTimeout,
    requestError,
    executeWithTimeout,
    resetNetworkState: () => {
      setIsTimeout(false);
      setRequestError(null);
    }
  };
}
