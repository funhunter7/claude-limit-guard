import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usageFromRateLimits, coversWatched, watchedExpired } from '../lib/stdinUsage.mjs';

test('maps a complete payload, seconds -> ms', () => {
  const r = usageFromRateLimits({
    five_hour: { used_percentage: 23.5, resets_at: 1738425600 },
    seven_day: { used_percentage: 41.2, resets_at: 1738857600 },
  });
  assert.deepEqual(r, {
    five_hour: { utilization: 23.5, resets_at: 1738425600000 },
    seven_day: { utilization: 41.2, resets_at: 1738857600000 },
  });
});

test('maps per-model seven_day_opus / seven_day_sonnet when present', () => {
  const r = usageFromRateLimits({
    seven_day_opus: { used_percentage: 50, resets_at: 1700000000 },
    seven_day_sonnet: { used_percentage: 12, resets_at: 1700000000 },
  });
  assert.deepEqual(r, {
    seven_day_opus: { utilization: 50, resets_at: 1700000000000 },
    seven_day_sonnet: { utilization: 12, resets_at: 1700000000000 },
  });
});

test('per-model windows absent -> simply not present (default windows unaffected)', () => {
  const r = usageFromRateLimits({ five_hour: { used_percentage: 10, resets_at: 1700000000 } });
  assert.equal('seven_day_opus' in r, false);
  assert.equal('seven_day_sonnet' in r, false);
  assert.ok(r.five_hour);
});

test('string resets_at is passed through unchanged', () => {
  const r = usageFromRateLimits({
    five_hour: { used_percentage: 10, resets_at: '2026-05-31T06:00:00+02:00' },
  });
  assert.deepEqual(r, { five_hour: { utilization: 10, resets_at: '2026-05-31T06:00:00+02:00' } });
});

test('garbage used_percentage (epoch from issue #52326) drops the window', () => {
  const r = usageFromRateLimits({
    five_hour: { used_percentage: 1776950400, resets_at: 1776950400 },
    seven_day: { used_percentage: 41, resets_at: 1738857600 },
  });
  assert.deepEqual(r, { seven_day: { utilization: 41, resets_at: 1738857600000 } });
});

test('out-of-range and non-numeric used_percentage drop the window', () => {
  assert.equal(usageFromRateLimits({ five_hour: { used_percentage: -1 } }), null);
  assert.equal(usageFromRateLimits({ five_hour: { used_percentage: '50' } }), null);
  assert.equal(usageFromRateLimits({ five_hour: { used_percentage: NaN } }), null);
});

test('valid percentage with missing resets_at keeps the window without a reset', () => {
  const r = usageFromRateLimits({ five_hour: { used_percentage: 0 } });
  assert.deepEqual(r, { five_hour: { utilization: 0 } });
});

test('missing window is omitted; empty/null/undefined input -> null', () => {
  assert.deepEqual(usageFromRateLimits({ seven_day: { used_percentage: 5, resets_at: 1738857600 } }),
    { seven_day: { utilization: 5, resets_at: 1738857600000 } });
  assert.equal(usageFromRateLimits({}), null);
  assert.equal(usageFromRateLimits(null), null);
  assert.equal(usageFromRateLimits(undefined), null);
});

test('coversWatched: true only when every watched window has a finite utilization', () => {
  const both = { five_hour: { utilization: 10 }, seven_day: { utilization: 20 } };
  assert.equal(coversWatched(both, ['five_hour', 'seven_day']), true);
  assert.equal(coversWatched({ five_hour: { utilization: 0 } }, ['five_hour']), true);
  assert.equal(coversWatched({ five_hour: { utilization: NaN } }, ['five_hour']), false);
  assert.equal(coversWatched({ five_hour: { utilization: 10 } }, ['five_hour', 'seven_day']), false);
  assert.equal(coversWatched(null, ['five_hour']), false);
});

test('used_percentage at the 100 boundary is valid', () => {
  assert.deepEqual(usageFromRateLimits({ five_hour: { used_percentage: 100 } }),
    { five_hour: { utilization: 100 } });
});

test('watchedExpired: true when a watched window reset (ms) is at or before now', () => {
  const now = 1_000_000;
  assert.equal(watchedExpired({ five_hour: { resets_at: now - 1 } }, ['five_hour'], now), true);
  assert.equal(watchedExpired({ five_hour: { resets_at: now } }, ['five_hour'], now), true);
});

test('watchedExpired: false when the reset is still in the future', () => {
  const now = 1_000_000;
  assert.equal(watchedExpired({ five_hour: { resets_at: now + 1 } }, ['five_hour'], now), false);
});

test('watchedExpired: handles an ISO-string resets_at (past and future)', () => {
  const now = Date.parse('2026-05-31T01:00:00+02:00');
  assert.equal(watchedExpired({ five_hour: { resets_at: '2026-05-31T00:00:00+02:00' } }, ['five_hour'], now), true);
  assert.equal(watchedExpired({ five_hour: { resets_at: '2026-05-31T06:00:00+02:00' } }, ['five_hour'], now), false);
});

test('watchedExpired: a window without resets_at is skipped, not expired', () => {
  const now = 1_000_000;
  assert.equal(watchedExpired({ five_hour: { utilization: 10 } }, ['five_hour'], now), false);
});

test('watchedExpired: only a non-watched window is expired -> false', () => {
  const now = 1_000_000;
  const usage = { five_hour: { resets_at: now + 5000 }, seven_day: { resets_at: now - 5000 } };
  assert.equal(watchedExpired(usage, ['five_hour'], now), false);
  assert.equal(watchedExpired(usage, ['five_hour', 'seven_day'], now), true);
});

test('watchedExpired: null/undefined usage -> false', () => {
  assert.equal(watchedExpired(null, ['five_hour'], 1), false);
  assert.equal(watchedExpired(undefined, ['five_hour'], 1), false);
});
