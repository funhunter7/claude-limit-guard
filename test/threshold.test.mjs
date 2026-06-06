import { test } from 'node:test';
import assert from 'node:assert/strict';
import { breachedLimits } from '../lib/threshold.mjs';

const usage = {
  five_hour: { utilization: 96 },
  seven_day: { utilization: 39 },
};

test('breachedLimits: returns keys at/above threshold within watch list', () => {
  assert.deepEqual(breachedLimits(usage, 95, ['five_hour', 'seven_day']), ['five_hour']);
});

test('breachedLimits: none breached -> empty', () => {
  assert.deepEqual(breachedLimits({ five_hour: { utilization: 50 } }, 95, ['five_hour']), []);
});

test('breachedLimits: ignores limits outside watch list', () => {
  assert.deepEqual(breachedLimits(usage, 95, ['seven_day']), []);
});

test('breachedLimits: 7d breach triggers guard even when 5h is well under threshold', () => {
  const u = { five_hour: { utilization: 40 }, seven_day: { utilization: 92 } };
  assert.deepEqual(breachedLimits(u, 90, ['five_hour', 'seven_day']), ['seven_day']);
});

test('breachedLimits: both 5h and 7d over threshold -> both reported', () => {
  const u = { five_hour: { utilization: 96 }, seven_day: { utilization: 97 } };
  assert.deepEqual(breachedLimits(u, 90, ['five_hour', 'seven_day']), ['five_hour', 'seven_day']);
});

test('breachedLimits: null usage or null utilization -> empty', () => {
  assert.deepEqual(breachedLimits(null, 95, ['five_hour']), []);
  assert.deepEqual(breachedLimits({ five_hour: { utilization: null } }, 95, ['five_hour']), []);
});
