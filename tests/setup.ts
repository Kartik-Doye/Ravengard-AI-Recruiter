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
