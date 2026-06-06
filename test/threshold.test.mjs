import { test } from 'node:test';
import assert from 'node:assert/strict';
import { breachedLimits, warnedLimits } from '../lib/threshold.mjs';

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

// --- warnedLimits tests ---

test('warnedLimits: window in [warnBand,threshold) is warned, not breached', () => {
  const u = { five_hour: { utilization: 84 }, seven_day: { utilization: 40 } };
  assert.deepEqual(warnedLimits(u, 80, 90, ['five_hour', 'seven_day']), ['five_hour']);
});

test('warnedLimits: exactly at warnBand -> warned', () => {
  const u = { five_hour: { utilization: 80 } };
  assert.deepEqual(warnedLimits(u, 80, 90, ['five_hour']), ['five_hour']);
});

test('warnedLimits: exactly at threshold -> NOT warned (it is breached)', () => {
  const u = { five_hour: { utilization: 90 } };
  assert.deepEqual(warnedLimits(u, 80, 90, ['five_hour']), []);
});

test('warnedLimits: below warnBand -> not warned', () => {
  const u = { five_hour: { utilization: 79 } };
  assert.deepEqual(warnedLimits(u, 80, 90, ['five_hour']), []);
});

test('warnedLimits: multiple windows, both in warn band', () => {
  const u = { five_hour: { utilization: 82 }, seven_day: { utilization: 85 } };
  assert.deepEqual(warnedLimits(u, 80, 90, ['five_hour', 'seven_day']), ['five_hour', 'seven_day']);
});

test('warnedLimits: ignores windows outside watch list', () => {
  const u = { five_hour: { utilization: 84 }, seven_day: { utilization: 84 } };
  assert.deepEqual(warnedLimits(u, 80, 90, ['five_hour']), ['five_hour']);
});

test('warnedLimits: null usage -> empty', () => {
  assert.deepEqual(warnedLimits(null, 80, 90, ['five_hour']), []);
});

test('warnedLimits: null utilization -> not warned', () => {
  assert.deepEqual(warnedLimits({ five_hour: { utilization: null } }, 80, 90, ['five_hour']), []);
});
