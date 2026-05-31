import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, DEFAULT_CONFIG } from '../lib/config.mjs';

const noEnv = {};

test('loadConfig: returns defaults when file missing', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.deepEqual(loadConfig('/proj', readThrows, noEnv), DEFAULT_CONFIG);
});

test('loadConfig: merges project overrides over defaults', () => {
  const readFile = () => JSON.stringify({ threshold: 90, handoff: 'NOTES.md' });
  const cfg = loadConfig('/proj', readFile, noEnv);
  assert.equal(cfg.threshold, 90);
  assert.equal(cfg.handoff, 'NOTES.md');
  assert.deepEqual(cfg.watch, DEFAULT_CONFIG.watch);
});

test('loadConfig: malformed JSON -> defaults', () => {
  const readFile = () => '{ not json';
  assert.deepEqual(loadConfig('/proj', readFile, noEnv), DEFAULT_CONFIG);
});

test('loadConfig: applies CLAUDE_PLUGIN_OPTION_* env options', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  const env = {
    CLAUDE_PLUGIN_OPTION_THRESHOLD: '90',
    CLAUDE_PLUGIN_OPTION_LOCALE: 'cs-CZ',
    CLAUDE_PLUGIN_OPTION_GUARD_ACTION: 'Ulož a vypni.',
  };
  const cfg = loadConfig('/proj', readThrows, env);
  assert.equal(cfg.threshold, 90); // parsed to number
  assert.equal(cfg.locale, 'cs-CZ');
  assert.equal(cfg.guardAction, 'Ulož a vypni.');
});

test('loadConfig: env option key is case-insensitive', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  const cfg = loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_threshold: '70' });
  assert.equal(cfg.threshold, 70);
});

test('loadConfig: ignores blank env options', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  const cfg = loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_LOCALE: '' });
  assert.equal(cfg.locale, DEFAULT_CONFIG.locale);
});

test('loadConfig: project file overrides env option (most specific wins)', () => {
  const readFile = () => JSON.stringify({ threshold: 80 });
  const cfg = loadConfig('/proj', readFile, { CLAUDE_PLUGIN_OPTION_THRESHOLD: '90' });
  assert.equal(cfg.threshold, 80);
});
