import { vi } from 'vitest';

// Mocking the database to prevent accidental data modification during tests
vi.mock('@/src/db/index', () => {
  return {
    db: {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
      insert: vi.fn().mockReturnThis(),
      values: vi.fn().mockReturnThis(),
      returning: vi.fn().mockResolvedValue([{ id: 'mock-id' }]),
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    }
  };
});

// Mock environment variables
process.env.JWT_SECRET = 'test-secret';
process.env.ACTUAL_SECRET = 'test-secret';
process.env.GEMINI_API_KEY = 'test-api-key';

// Global localStorage Mock for Node/jsdom test environments
const globalLocalStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value ? value.toString() : '';
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    get length() {
      return Object.keys(store).length;
    },
    key: (index: number) => Object.keys(store)[index] || null,
  };
})();

if (typeof window !== 'undefined') {
  try {
    Object.defineProperty(window, 'localStorage', {
      value: globalLocalStorageMock,
      writable: true,
      configurable: true,
    });
  } catch (e) {
    (window as any).localStorage = globalLocalStorageMock;
  }
}

if (typeof globalThis !== 'undefined') {
  (globalThis as any).localStorage = globalLocalStorageMock;
}

