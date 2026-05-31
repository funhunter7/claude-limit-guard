import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, DEFAULT_CONFIG } from '../lib/config.mjs';

test('loadConfig: returns defaults when file missing', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.deepEqual(loadConfig('/proj', readThrows), DEFAULT_CONFIG);
});

test('loadConfig: merges project overrides over defaults', () => {
  const readFile = () => JSON.stringify({ threshold: 90, handoff: 'NOTES.md' });
  const cfg = loadConfig('/proj', readFile);
  assert.equal(cfg.threshold, 90);
  assert.equal(cfg.handoff, 'NOTES.md');
  assert.deepEqual(cfg.watch, DEFAULT_CONFIG.watch);
});

test('loadConfig: malformed JSON -> defaults', () => {
  const readFile = () => '{ not json';
  assert.deepEqual(loadConfig('/proj', readFile), DEFAULT_CONFIG);
});
