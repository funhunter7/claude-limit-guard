import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bandEmoji } from '../lib/format.mjs';

test('bandEmoji: green below 80', () => {
  assert.equal(bandEmoji(0, 95), '🟢');
  assert.equal(bandEmoji(79.9, 95), '🟢');
});

test('bandEmoji: amber from 80 up to threshold', () => {
  assert.equal(bandEmoji(80, 95), '🟡');
  assert.equal(bandEmoji(94, 95), '🟡');
});

test('bandEmoji: red at or above threshold', () => {
  assert.equal(bandEmoji(95, 95), '🔴');
  assert.equal(bandEmoji(100, 95), '🔴');
});

test('bandEmoji: unknown utilization -> white', () => {
  assert.equal(bandEmoji(null, 95), '⚪');
  assert.equal(bandEmoji(undefined, 95), '⚪');
});

import { formatReset } from '../lib/format.mjs';

test('formatReset: same local day -> arrow + HH:MM', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset('2026-05-31T06:00:00+02:00', now), '→06:00');
});

test('formatReset: different day -> arrow + czech weekday abbrev', () => {
  const now = new Date('2026-05-31T01:00:00+02:00'); // neděle
  // 2026-06-03 is Wednesday -> "st"
  assert.equal(formatReset('2026-06-03T10:00:00+02:00', now), '→st');
});

test('formatReset: missing/invalid -> empty string', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset(null, now), '');
  assert.equal(formatReset('not-a-date', now), '');
});
