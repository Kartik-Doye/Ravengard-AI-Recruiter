import { describe, it, expect } from 'vitest';
import { signCandidateToken, signAdminToken } from '../../src/middleware/auth';

describe('Auth Middleware', () => {
  it('should sign a candidate token correctly', () => {
    const payload = {
      id: 'candidate-123',
      email: 'candidate@example.com',
      name: 'John Doe',
      email_verified: true
    };
    const token = signCandidateToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });

  it('should sign an admin token correctly', () => {
    const payload = {
      id: 'admin-123',
      email: 'admin@example.com',
      role: 'admin'
    };
    const token = signAdminToken(payload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');
  });
});
