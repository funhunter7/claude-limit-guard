import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeSettings } from '../bin/setup.mjs';

const CMD = 'node "/root/bin/usage.mjs" --statusline';

test('computeSettings: adds statusLine when absent', () => {
  const { settings, changed } = computeSettings({}, CMD);
  assert.equal(changed, true);
  assert.deepEqual(settings.statusLine, { type: 'command', command: CMD });
});

test('computeSettings: no-op when identical', () => {
  const existing = { statusLine: { type: 'command', command: CMD }, other: 1 };
  const { changed, settings } = computeSettings(existing, CMD);
  assert.equal(changed, false);
  assert.equal(settings.other, 1);
});

test('computeSettings: overwrites a different command, preserves other keys', () => {
  const { settings, changed } = computeSettings({ statusLine: { type: 'command', command: 'old' }, keep: 2 }, CMD);
  assert.equal(changed, true);
  assert.equal(settings.statusLine.command, CMD);
  assert.equal(settings.keep, 2);
});
