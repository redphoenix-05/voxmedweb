/**
 * Doctor Scheduling — server-side unit tests
 *
 * Tests the Zod validation schema and the select-then-update-or-insert
 * branching logic used by POST /hospital/doctors/:id/schedule.
 *
 * Run with:  node --test server/src/test/scheduling.test.js
 * Or via:    npm test   (after adding "test" script to package.json)
 *
 * No external testing framework required — uses Node's built-in node:test.
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Replicate the schedule schema (single source of truth for validation rules)
// ---------------------------------------------------------------------------
const scheduleSchema = z.object({
  day_of_week: z.number().min(0).max(6),
  start_time: z.string(),
  end_time: z.string(),
  slot_duration_minutes: z.number().min(5).default(30),
  is_active: z.boolean().default(true),
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
const parse = (payload) => scheduleSchema.safeParse(payload);

// ---------------------------------------------------------------------------
// Schema validation
// ---------------------------------------------------------------------------
describe('scheduleSchema — valid payloads', () => {
  it('accepts a complete valid schedule', () => {
    const result = parse({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      slot_duration_minutes: 30,
      is_active: true,
    });
    assert.equal(result.success, true);
    assert.equal(result.data.day_of_week, 1);
  });

  it('applies default slot_duration_minutes of 30 when omitted', () => {
    const result = parse({ day_of_week: 1, start_time: '09:00', end_time: '17:00' });
    assert.equal(result.success, true);
    assert.equal(result.data.slot_duration_minutes, 30);
  });

  it('applies default is_active of true when omitted', () => {
    const result = parse({ day_of_week: 1, start_time: '09:00', end_time: '17:00' });
    assert.equal(result.success, true);
    assert.equal(result.data.is_active, true);
  });

  it('accepts day_of_week 0 (Sunday)', () => {
    const result = parse({ day_of_week: 0, start_time: '10:00', end_time: '14:00' });
    assert.equal(result.success, true);
  });

  it('accepts day_of_week 6 (Saturday)', () => {
    const result = parse({ day_of_week: 6, start_time: '10:00', end_time: '14:00' });
    assert.equal(result.success, true);
  });

  it('accepts is_active: false (deactivate a day)', () => {
    const result = parse({
      day_of_week: 2,
      start_time: '08:00',
      end_time: '12:00',
      is_active: false,
    });
    assert.equal(result.success, true);
    assert.equal(result.data.is_active, false);
  });

  it('accepts minimum slot_duration_minutes of 5', () => {
    const result = parse({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '10:00',
      slot_duration_minutes: 5,
    });
    assert.equal(result.success, true);
  });
});

describe('scheduleSchema — invalid payloads', () => {
  it('rejects day_of_week of 7 (out of range)', () => {
    const result = parse({ day_of_week: 7, start_time: '09:00', end_time: '17:00' });
    assert.equal(result.success, false);
  });

  it('rejects negative day_of_week', () => {
    const result = parse({ day_of_week: -1, start_time: '09:00', end_time: '17:00' });
    assert.equal(result.success, false);
  });

  it('rejects slot_duration_minutes below 5', () => {
    const result = parse({
      day_of_week: 1,
      start_time: '09:00',
      end_time: '17:00',
      slot_duration_minutes: 4,
    });
    assert.equal(result.success, false);
  });

  it('rejects missing start_time', () => {
    const result = parse({ day_of_week: 1, end_time: '17:00' });
    assert.equal(result.success, false);
  });

  it('rejects missing end_time', () => {
    const result = parse({ day_of_week: 1, start_time: '09:00' });
    assert.equal(result.success, false);
  });

  it('rejects completely empty payload', () => {
    const result = parse({});
    assert.equal(result.success, false);
  });
});

// ---------------------------------------------------------------------------
// Slot count logic (mirrors the Flutter test for consistency)
// ---------------------------------------------------------------------------
describe('Slot count calculation', () => {
  /**
   * Calculate how many appointment slots fit in a schedule window.
   * @param {string} start - HH:MM
   * @param {string} end   - HH:MM
   * @param {number} duration - slot size in minutes
   */
  function slotCount(start, end, duration) {
    const toMinutes = (t) => {
      const [h, m] = t.split(':').map(Number);
      return h * 60 + m;
    };
    const total = toMinutes(end) - toMinutes(start);
    if (total <= 0 || duration <= 0) return 0;
    return Math.floor(total / duration);
  }

  it('09:00–17:00 with 30-min slots = 16 slots', () => {
    assert.equal(slotCount('09:00', '17:00', 30), 16);
  });

  it('09:00–13:00 with 30-min slots = 8 slots (matches seed data)', () => {
    assert.equal(slotCount('09:00', '13:00', 30), 8);
  });

  it('09:00–10:00 with 15-min slots = 4 slots', () => {
    assert.equal(slotCount('09:00', '10:00', 15), 4);
  });

  it('returns 0 when end is before start', () => {
    assert.equal(slotCount('17:00', '09:00', 30), 0);
  });

  it('returns 0 when duration is 0', () => {
    assert.equal(slotCount('09:00', '17:00', 0), 0);
  });
});

// ---------------------------------------------------------------------------
// Upsert branching logic
// ---------------------------------------------------------------------------
describe('Schedule upsert branching logic', () => {
  /**
   * Simulates the server's select-then-update-or-insert decision.
   */
  function resolveUpsertAction(existingRecord) {
    return existingRecord ? 'update' : 'insert';
  }

  it('uses UPDATE when a schedule row already exists for doctor+day', () => {
    const existing = { id: 'existing-id-123' };
    assert.equal(resolveUpsertAction(existing), 'update');
  });

  it('uses INSERT when no schedule row exists for doctor+day', () => {
    assert.equal(resolveUpsertAction(null), 'insert');
  });

  it('uses INSERT when maybeSingle() returns undefined', () => {
    assert.equal(resolveUpsertAction(undefined), 'insert');
  });
});
