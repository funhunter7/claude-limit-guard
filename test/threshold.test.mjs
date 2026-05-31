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

test('breachedLimits: null usage or null utilization -> empty', () => {
  assert.deepEqual(breachedLimits(null, 95, ['five_hour']), []);
  assert.deepEqual(breachedLimits({ five_hour: { utilization: null } }, 95, ['five_hour']), []);
});
