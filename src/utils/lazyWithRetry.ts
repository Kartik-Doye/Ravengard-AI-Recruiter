import { ComponentType, lazy, LazyExoticComponent } from 'react';

/**
 * Resilient lazy loader that automatically retries dynamic module imports when network
 * disruptions, hot reloads, or container restarts cause temporary module resolution errors.
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  componentImport: () => Promise<{ default: T }>,
  retries = 2,
  interval = 400
): LazyExoticComponent<T> {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        componentImport()
          .then(resolve)
          .catch((error) => {
            if (remaining > 0) {
              setTimeout(() => {
                attempt(remaining - 1);
              }, interval);
            } else {
              const isChunkError =
                error?.message?.includes('Failed to fetch dynamically imported module') ||
                error?.message?.includes('dynamically imported module') ||
                error?.name === 'ChunkLoadError';

              if (
                isChunkError &&
                typeof window !== 'undefined' &&
                !sessionStorage.getItem(`chunk_retry_${window.location.pathname}`)
              ) {
                sessionStorage.setItem(`chunk_retry_${window.location.pathname}`, '1');
                window.location.reload();
                return;
              }
              reject(error);
            }
          });
      };
      attempt(retries);
    })
  );
}

export default lazyWithRetry;
