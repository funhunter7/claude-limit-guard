import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderStats } from '../bin/stats.mjs';

test('renderStats: shows readings, peaks and resets (en)', () => {
  const out = renderStats({ count: 10, peakFiveHour: 90, peakSevenDay: 42, resets: 1, sinceMs: 1 }, { locale: 'en-US' });
  assert.match(out, /10/);
  assert.match(out, /90%/);
  assert.match(out, /42%/);
  assert.match(out, /resets.*1/i);
});

test('renderStats: no data wording when empty', () => {
  const out = renderStats({ count: 0, peakFiveHour: null, peakSevenDay: null, resets: 0, sinceMs: null }, { locale: 'en-US' });
  assert.match(out, /no.*data/i);
});

test('renderStats: cs localized header', () => {
  const out = renderStats({ count: 3, peakFiveHour: 50, peakSevenDay: 20, resets: 0, sinceMs: 1 }, { locale: 'cs-CZ' });
  assert.match(out, /statistiky/i);
});

test('renderStats: rounds fractional peaks', () => {
  const out = renderStats({ count: 2, peakFiveHour: 72.4, peakSevenDay: 39.6, resets: 0, sinceMs: 1 }, { locale: 'en-US' });
  assert.match(out, /72%/);
  assert.match(out, /40%/);
});
