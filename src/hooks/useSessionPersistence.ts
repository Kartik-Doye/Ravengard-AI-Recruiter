import { useState, useEffect, useCallback, useRef } from 'react';
import { useToast } from '../contexts/ToastContext';

export interface CandidateSessionState {
  stage: string;
  index: number;
  answers: Record<string | number, any>;
  sessionId?: string | number | null;
  candidateId?: string | null;
  timestamp?: number;
  metadata?: Record<string, any>;
}

export interface UseSessionPersistenceOptions {
  /**
   * Unique localStorage key for isolating candidate sessions.
   * Default: 'ravengard_candidate_session_state'
   */
  storageKey?: string;

  /**
   * Initial candidate state when no persisted session exists.
   */
  initialState?: Partial<CandidateSessionState>;

  /**
   * Whether to automatically save state to localStorage whenever state changes.
   * Default: true
   */
  autoSync?: boolean;

  /**
   * Whether to trigger a toast notification when state is successfully recovered.
   * Default: true
   */
  notifyOnRecovery?: boolean;

  /**
   * Custom toast message on session recovery.
   * Default: 'Restored previous interview session progress.'
   */
  recoveryToastMessage?: string;

  /**
   * Callback fired upon successful recovery of session state.
   */
  onRecover?: (recoveredState: CandidateSessionState) => void;
}

const DEFAULT_STORAGE_KEY = 'ravengard_candidate_session_state';

const DEFAULT_STATE: CandidateSessionState = {
  stage: 'welcome',
  index: 0,
  answers: {},
  sessionId: null,
  candidateId: null,
  timestamp: Date.now(),
  metadata: {}
};

/**
 * Custom React Hook that automatically syncs candidate state (stage, index, answers)
 * to localStorage and triggers a toast notification on recovery using ToastProvider.
 */
export function useSessionPersistence(options: UseSessionPersistenceOptions = {}) {
  const {
    storageKey = DEFAULT_STORAGE_KEY,
    initialState,
    autoSync = true,
    notifyOnRecovery = true,
    recoveryToastMessage = 'Restored previous interview session progress.',
    onRecover
  } = options;

  let toastApi: { addToast: (type: 'success' | 'error' | 'info', msg: string) => void } | null = null;
  try {
    toastApi = useToast();
  } catch {
    // Graceful fallback if invoked outside ToastProvider
    toastApi = null;
  }

  // Initial state computation
  const resolvedInitialState = useRef<CandidateSessionState>({
    ...DEFAULT_STATE,
    ...initialState,
    timestamp: Date.now()
  }).current;

  const [sessionState, setSessionState] = useState<CandidateSessionState>(resolvedInitialState);
  const [isRecovered, setIsRecovered] = useState<boolean>(false);
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [lastSaved, setLastSaved] = useState<number | null>(null);

  // References to keep callbacks current and avoid re-triggering effects
  const onRecoverRef = useRef(onRecover);
  useEffect(() => {
    onRecoverRef.current = onRecover;
  }, [onRecover]);

  const hasNotifiedRef = useRef(false);

  // 1. Recovery on initial mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed: Partial<CandidateSessionState> = JSON.parse(raw);

        // Check if there is meaningful saved state to restore
        const hasStage = typeof parsed.stage === 'string' && parsed.stage.length > 0;
        const hasIndex = typeof parsed.index === 'number' && parsed.index >= 0;
        const hasAnswers = parsed.answers && typeof parsed.answers === 'object' && Object.keys(parsed.answers).length > 0;
        const hasSessionId = parsed.sessionId !== undefined && parsed.sessionId !== null;

        if (hasStage || hasIndex || hasAnswers || hasSessionId) {
          const recovered: CandidateSessionState = {
            stage: parsed.stage ?? resolvedInitialState.stage,
            index: typeof parsed.index === 'number' ? parsed.index : resolvedInitialState.index,
            answers: parsed.answers ?? resolvedInitialState.answers ?? {},
            sessionId: parsed.sessionId ?? resolvedInitialState.sessionId ?? null,
            candidateId: parsed.candidateId ?? resolvedInitialState.candidateId ?? null,
            timestamp: parsed.timestamp ?? Date.now(),
            metadata: parsed.metadata ?? resolvedInitialState.metadata ?? {}
          };

          setSessionState(recovered);
          setIsRecovered(true);
          setLastSaved(recovered.timestamp || Date.now());

          if (notifyOnRecovery && !hasNotifiedRef.current) {
            hasNotifiedRef.current = true;
            toastApi?.addToast('info', recoveryToastMessage);
          }

          onRecoverRef.current?.(recovered);
        }
      }
    } catch (err) {
      console.warn(`[useSessionPersistence] Failed to restore session from key "${storageKey}":`, err);
    } finally {
      setIsInitialized(true);
    }
  }, [storageKey, notifyOnRecovery, recoveryToastMessage, resolvedInitialState]);

  // 2. Automatic synchronization to localStorage on state changes
  useEffect(() => {
    if (!isInitialized || !autoSync || typeof window === 'undefined') return;

    try {
      const payload: CandidateSessionState = {
        ...sessionState,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
      setLastSaved(payload.timestamp ?? Date.now());
    } catch (err) {
      console.error(`[useSessionPersistence] Error writing state to localStorage ("${storageKey}"):`, err);
    }
  }, [sessionState, isInitialized, autoSync, storageKey]);

  // Public state manipulation handlers
  const setStage = useCallback((stage: string) => {
    setSessionState((prev) => ({ ...prev, stage }));
  }, []);

  const setIndex = useCallback((index: number | ((prevIndex: number) => number)) => {
    setSessionState((prev) => ({
      ...prev,
      index: typeof index === 'function' ? index(prev.index) : index
    }));
  }, []);

  const setAnswer = useCallback((questionKey: string | number, answer: any) => {
    setSessionState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionKey]: answer
      }
    }));
  }, []);

  const setAnswers = useCallback((
    answers: Record<string | number, any> | ((prevAnswers: Record<string | number, any>) => Record<string | number, any>)
  ) => {
    setSessionState((prev) => ({
      ...prev,
      answers: typeof answers === 'function' ? answers(prev.answers) : answers
    }));
  }, []);

  const updateSessionState = useCallback((partial: Partial<CandidateSessionState>) => {
    setSessionState((prev) => ({
      ...prev,
      ...partial,
      answers: partial.answers ? { ...prev.answers, ...partial.answers } : prev.answers,
      metadata: partial.metadata ? { ...prev.metadata, ...partial.metadata } : prev.metadata
    }));
  }, []);

  const clearSessionState = useCallback(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(storageKey);
      } catch (err) {
        console.warn(`[useSessionPersistence] Failed to remove storage item ("${storageKey}"):`, err);
      }
    }
    setSessionState({
      ...resolvedInitialState,
      timestamp: Date.now()
    });
    setIsRecovered(false);
    setLastSaved(null);
  }, [storageKey, resolvedInitialState]);

  const saveSessionState = useCallback((customState?: Partial<CandidateSessionState>) => {
    if (typeof window === 'undefined') return;

    try {
      const stateToSave: CandidateSessionState = {
        ...sessionState,
        ...customState,
        timestamp: Date.now()
      };
      localStorage.setItem(storageKey, JSON.stringify(stateToSave));
      setSessionState(stateToSave);
      setLastSaved(stateToSave.timestamp || Date.now());
    } catch (err) {
      console.error(`[useSessionPersistence] Failed to manually save session state:`, err);
    }
  }, [sessionState, storageKey]);

  return {
    state: sessionState,
    stage: sessionState.stage,
    index: sessionState.index,
    answers: sessionState.answers,
    sessionId: sessionState.sessionId,
    candidateId: sessionState.candidateId,
    metadata: sessionState.metadata,
    isRecovered,
    isInitialized,
    lastSaved,
    setStage,
    setIndex,
    setAnswer,
    setAnswers,
    updateSessionState,
    clearSessionState,
    saveSessionState
  };
}
