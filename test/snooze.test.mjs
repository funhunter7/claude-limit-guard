import { test } from 'node:test';
import assert from 'node:assert/strict';
import { soonestReset } from '../bin/snooze.mjs';

const NOW = Date.parse('2026-05-31T00:00:00Z');

test('soonestReset: picks the earliest future reset among watched windows', () => {
  const usage = {
    five_hour: { resets_at: '2026-05-31T06:00:00Z' },
    seven_day: { resets_at: '2026-06-03T10:00:00Z' },
  };
  assert.equal(soonestReset(usage, ['five_hour', 'seven_day'], NOW), Date.parse('2026-05-31T06:00:00Z'));
});

test('soonestReset: accepts ms timestamps and ignores past/missing', () => {
  const usage = {
    five_hour: { resets_at: Date.parse('2026-05-30T06:00:00Z') }, // past -> ignored
    seven_day: { resets_at: Date.parse('2026-06-03T10:00:00Z') },
  };
  assert.equal(soonestReset(usage, ['five_hour', 'seven_day'], NOW), Date.parse('2026-06-03T10:00:00Z'));
});

test('soonestReset: null usage or no future resets -> null', () => {
  assert.equal(soonestReset(null, ['five_hour'], NOW), null);
  assert.equal(soonestReset({ five_hour: {} }, ['five_hour'], NOW), null);
});
