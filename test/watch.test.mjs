import test from 'node:test';
import assert from 'node:assert/strict';
import { AUTO, watchBase, resolveWatch } from '../lib/watch.mjs';

const u = (o) => o; // readability helper

test('AUTO is the string "auto"', () => {
  assert.equal(AUTO, 'auto');
});

test('watchBase: explicit array passes through', () => {
  assert.deepEqual(watchBase(['five_hour']), ['five_hour']);
});

test('watchBase: auto -> base windows only', () => {
  assert.deepEqual(watchBase('auto'), ['five_hour', 'seven_day']);
});

test('resolveWatch: explicit array passes through unchanged', () => {
  const usage = u({ five_hour: { utilization: 10 }, seven_day_opus: { utilization: 50 } });
  assert.deepEqual(resolveWatch(usage, ['seven_day']), ['seven_day']);
});

test('resolveWatch: auto with only base windows', () => {
  const usage = u({ five_hour: { utilization: 10 }, seven_day: { utilization: 20 } });
  assert.deepEqual(resolveWatch(usage, 'auto'), ['five_hour', 'seven_day']);
});

test('resolveWatch: auto adds opus when used (>0)', () => {
  const usage = u({ five_hour: { utilization: 10 }, seven_day: { utilization: 20 }, seven_day_opus: { utilization: 0.5 } });
  assert.deepEqual(resolveWatch(usage, 'auto'), ['five_hour', 'seven_day', 'seven_day_opus']);
});

test('resolveWatch: auto adds both opus and sonnet when both used', () => {
  const usage = u({ five_hour: {}, seven_day: {}, seven_day_opus: { utilization: 80 }, seven_day_sonnet: { utilization: 5 } });
  assert.deepEqual(resolveWatch(usage, 'auto'), ['five_hour', 'seven_day', 'seven_day_opus', 'seven_day_sonnet']);
});

test('resolveWatch: auto excludes a per-model window at exactly 0', () => {
  const usage = u({ five_hour: {}, seven_day: {}, seven_day_opus: { utilization: 0 } });
  assert.deepEqual(resolveWatch(usage, 'auto'), ['five_hour', 'seven_day']);
});

test('resolveWatch: auto ignores null/absent per-model windows', () => {
  const usage = u({ five_hour: {}, seven_day: {}, seven_day_opus: null });
  assert.deepEqual(resolveWatch(usage, 'auto'), ['five_hour', 'seven_day']);
});

test('resolveWatch: auto with null usage returns base set', () => {
  assert.deepEqual(resolveWatch(null, 'auto'), ['five_hour', 'seven_day']);
});
