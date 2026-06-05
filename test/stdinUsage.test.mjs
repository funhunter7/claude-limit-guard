import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usageFromRateLimits, coversWatched } from '../lib/stdinUsage.mjs';

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
});;
