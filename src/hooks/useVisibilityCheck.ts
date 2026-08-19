import { useEffect } from 'react';

export function useVisibilityCheck(sessionId: number, onViolation: () => void) {
  useEffect(() => {
    if (!sessionId) return;

    const handleVisibilityChange = async () => {
      if (document.hidden) {
        onViolation();
        try {
          const token = localStorage.getItem('ravengard_uid');
          await fetch('/api/session/violation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ sessionId })
          });
        } catch (error) {
          console.error("Failed to log tab switch violation:", error);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [sessionId, onViolation]);
}
