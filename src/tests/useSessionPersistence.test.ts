import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSessionPersistence, CandidateSessionState } from '../hooks/useSessionPersistence';

// Mock ToastContext
const mockAddToast = vi.fn();
vi.mock('../contexts/ToastContext', () => ({
  useToast: () => ({
    addToast: mockAddToast,
    removeToast: vi.fn(),
  }),
}));

describe('useSessionPersistence Hook', () => {
  const TEST_STORAGE_KEY = 'test_candidate_session_persistence';

  beforeEach(() => {
    localStorage.clear();
    mockAddToast.mockClear();
    vi.clearAllMocks();
  });

  it('initializes with default state when localStorage is empty', () => {
    const { result } = renderHook(() =>
      useSessionPersistence({ storageKey: TEST_STORAGE_KEY })
    );

    expect(result.current.stage).toBe('welcome');
    expect(result.current.index).toBe(0);
    expect(result.current.answers).toEqual({});
    expect(result.current.isRecovered).toBe(false);
    expect(mockAddToast).not.toHaveBeenCalled();
  });

  it('automatically syncs stage, index, and answers to localStorage', () => {
    const { result } = renderHook(() =>
      useSessionPersistence({ storageKey: TEST_STORAGE_KEY })
    );

    act(() => {
      result.current.setStage('interview_technical');
      result.current.setIndex(2);
      result.current.setAnswer('q1', 'Async programming ensures non-blocking IO');
    });

    const storedRaw = localStorage.getItem(TEST_STORAGE_KEY);
    expect(storedRaw).toBeTruthy();
    const stored = JSON.parse(storedRaw!);
    expect(stored.stage).toBe('interview_technical');
    expect(stored.index).toBe(2);
    expect(stored.answers['q1']).toBe('Async programming ensures non-blocking IO');
  });

  it('recovers state from localStorage on mount and triggers toast notification', () => {
    const savedState: CandidateSessionState = {
      stage: 'interview_behavioral',
      index: 3,
      answers: { 'q1': 'Answer 1', 'q2': 'Answer 2' },
      sessionId: 'session-123',
      candidateId: 'cand-456',
      timestamp: Date.now(),
      metadata: { role: 'Software Engineer' }
    };

    localStorage.setItem(TEST_STORAGE_KEY, JSON.stringify(savedState));

    const onRecoverMock = vi.fn();
    const { result } = renderHook(() =>
      useSessionPersistence({
        storageKey: TEST_STORAGE_KEY,
        onRecover: onRecoverMock,
        notifyOnRecovery: true,
      })
    );

    expect(result.current.isRecovered).toBe(true);
    expect(result.current.stage).toBe('interview_behavioral');
    expect(result.current.index).toBe(3);
    expect(result.current.answers).toEqual({ 'q1': 'Answer 1', 'q2': 'Answer 2' });
    expect(result.current.sessionId).toBe('session-123');
    expect(onRecoverMock).toHaveBeenCalledWith(expect.objectContaining({
      stage: 'interview_behavioral',
      index: 3
    }));

    expect(mockAddToast).toHaveBeenCalledWith('info', 'Restored previous interview session progress.');
  });

  it('clears state from localStorage when clearSessionState is invoked', () => {
    const { result } = renderHook(() =>
      useSessionPersistence({ storageKey: TEST_STORAGE_KEY })
    );

    act(() => {
      result.current.setStage('interview_technical');
      result.current.setAnswer('q1', 'Test answer');
    });

    expect(localStorage.getItem(TEST_STORAGE_KEY)).not.toBeNull();

    act(() => {
      result.current.clearSessionState();
    });

    expect(localStorage.getItem(TEST_STORAGE_KEY)).toBeNull();
    expect(result.current.stage).toBe('welcome');
    expect(result.current.answers).toEqual({});
  });
});
