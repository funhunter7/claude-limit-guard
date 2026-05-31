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
