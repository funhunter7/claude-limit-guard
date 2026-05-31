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

test('formatReset: different day -> arrow + localized weekday abbrev', () => {
  const now = new Date('2026-05-31T01:00:00+02:00'); // Sunday
  const wed = '2026-06-03T10:00:00+02:00'; // Wednesday
  assert.equal(formatReset(wed, now, 'en-US'), '→Wed');
  assert.equal(formatReset(wed, now, 'cs-CZ'), '→st');
  assert.equal(formatReset(wed, now, 'de-DE'), '→Mi');
});

test('formatReset: no locale -> system default weekday', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  const wed = '2026-06-03T10:00:00+02:00';
  const expected = '→' + new Date(wed).toLocaleDateString(undefined, { weekday: 'short' });
  assert.equal(formatReset(wed, now), expected);
});

test('formatReset: missing/invalid -> empty string', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset(null, now), '');
  assert.equal(formatReset('not-a-date', now), '');
});

import { formatLimit, formatStatusLine } from '../lib/format.mjs';
import { readFileSync } from 'node:fs';

const SAMPLE = JSON.parse(readFileSync(new URL('./fixtures/usage-sample.json', import.meta.url)));
const NOW = new Date('2026-05-31T01:00:00+02:00');

test('formatLimit: emoji + label + rounded pct + reset', () => {
  assert.equal(formatLimit('5h', SAMPLE.five_hour, 95, NOW), '🟢 5h 72% →06:00');
});

test('formatLimit: unknown limit -> white placeholder', () => {
  assert.equal(formatLimit('5h', null, 95, NOW), '⚪ 5h ?');
  assert.equal(formatLimit('7d', { utilization: null }, 95, NOW), '⚪ 7d ?');
});

test('formatStatusLine: both limits joined by middot', () => {
  assert.equal(
    formatStatusLine(SAMPLE, 95, ['five_hour', 'seven_day'], NOW, 'en-US'),
    '🟢 5h 72% →06:00 · 🟢 7d 39% →Wed'
  );
});

test('formatStatusLine: locale switches weekday language', () => {
  assert.equal(
    formatStatusLine(SAMPLE, 95, ['seven_day'], NOW, 'de-DE'),
    '🟢 7d 39% →Mi'
  );
});

test('formatStatusLine: respects watch list', () => {
  assert.equal(formatStatusLine(SAMPLE, 95, ['five_hour'], NOW), '🟢 5h 72% →06:00');
});

test('formatStatusLine: null usage -> placeholder', () => {
  assert.equal(formatStatusLine(null, 95, ['five_hour', 'seven_day'], NOW), '⚪ limit ?');
});
