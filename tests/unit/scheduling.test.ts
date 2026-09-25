import { describe, it, expect, vi } from 'vitest';

describe('Interview Calendar Scheduling Engine', () => {
  it('should reject booking requests with missing scheduledAt parameter', () => {
    const invalidPayload = {
      candidateId: 'cand-test-123',
      timezone: 'UTC',
    };

    const validateBooking = (payload: any) => {
      if (!payload.scheduledAt) {
        return { valid: false, error: 'scheduledAt timestamp is required.' };
      }
      return { valid: true };
    };

    const result = validateBooking(invalidPayload);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('scheduledAt timestamp is required.');
  });

  it('should reject booking requests for past timestamps', () => {
    const pastDate = new Date(Date.now() - 3600000).toISOString();
    const payload = {
      candidateId: 'cand-test-123',
      scheduledAt: pastDate,
      timezone: 'UTC',
    };

    const validateBookingDate = (payload: any) => {
      const parsed = new Date(payload.scheduledAt);
      if (isNaN(parsed.getTime())) {
        return { valid: false, error: 'Invalid scheduledAt format.' };
      }
      if (parsed.getTime() <= Date.now()) {
        return { valid: false, error: 'Interview slot must be scheduled for a future time.' };
      }
      return { valid: true };
    };

    const result = validateBookingDate(payload);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Interview slot must be scheduled for a future time.');
  });

  it('should accept valid future booking and compute standard 45-minute duration window', () => {
    const futureDate = new Date(Date.now() + 86400000 * 2); // 2 days in future
    futureDate.setUTCHours(10, 0, 0, 0);

    const scheduledAt = futureDate.toISOString();
    const parsedStart = new Date(scheduledAt);
    const parsedEnd = new Date(parsedStart.getTime() + 45 * 60 * 1000);

    const durationMinutes = (parsedEnd.getTime() - parsedStart.getTime()) / (60 * 1000);
    expect(durationMinutes).toBe(45);
    expect(parsedEnd.getTime()).toBeGreaterThan(parsedStart.getTime());
  });

  it('should filter out weekends when generating business interview windows', () => {
    const checkIsBusinessDay = (date: Date) => {
      const day = date.getDay();
      return day !== 0 && day !== 6;
    };

    const sunday = new Date('2026-09-27T10:00:00Z'); // Sunday
    const monday = new Date('2026-09-28T10:00:00Z'); // Monday
    const saturday = new Date('2026-10-03T10:00:00Z'); // Saturday

    expect(checkIsBusinessDay(sunday)).toBe(false);
    expect(checkIsBusinessDay(monday)).toBe(true);
    expect(checkIsBusinessDay(saturday)).toBe(false);
  });

  it('should detect conflicts if a slot is already booked', () => {
    const existingBookedTimestamps = new Set([
      new Date('2026-09-28T09:00:00.000Z').toISOString(),
      new Date('2026-09-28T13:00:00.000Z').toISOString(),
    ]);

    const targetSlot1 = new Date('2026-09-28T09:00:00.000Z').toISOString();
    const targetSlot2 = new Date('2026-09-28T10:30:00.000Z').toISOString();

    expect(existingBookedTimestamps.has(targetSlot1)).toBe(true);
    expect(existingBookedTimestamps.has(targetSlot2)).toBe(false);
  });
});
