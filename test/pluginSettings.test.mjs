import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PLUGIN_KEY, globalSettingsPath, resolveGlobalKey, readGlobalOptions } from '../lib/pluginSettings.mjs';

const ENV = { CLAUDE_CONFIG_DIR: '/home/u/.claude' };
const readFrom = (raw) => () => {
  if (raw === undefined) { const e = new Error('ENOENT'); e.code = 'ENOENT'; throw e; }
  return raw;
};

test('globalSettingsPath: honors CLAUDE_CONFIG_DIR', () => {
  assert.match(globalSettingsPath(ENV).replace(/\\/g, '/'), /\/home\/u\/\.claude\/settings\.json$/);
});

test('globalSettingsPath: falls back to ~/.claude', () => {
  assert.match(globalSettingsPath({}).replace(/\\/g, '/'), /\/\.claude\/settings\.json$/);
});

test('resolveGlobalKey: env override wins', () => {
  assert.equal(resolveGlobalKey({}, { CLAUDE_LIMIT_GUARD_PLUGIN_KEY: 'foo@bar' }), 'foo@bar');
});

test('resolveGlobalKey: existing claude-limit-guard@* key', () => {
  const settings = { pluginConfigs: { 'claude-limit-guard@mk': {} } };
  assert.equal(resolveGlobalKey(settings, {}), 'claude-limit-guard@mk');
});

test('resolveGlobalKey: default when nothing matches', () => {
  assert.equal(resolveGlobalKey({}, {}), PLUGIN_KEY);
});

test('readGlobalOptions: missing file -> {}', () => {
  assert.deepEqual(readGlobalOptions(ENV, readFrom(undefined)), {});
});

test('readGlobalOptions: malformed JSON -> {} and debug', () => {
  const logged = [];
  const out = readGlobalOptions(ENV, readFrom('{ not json'), (...a) => logged.push(a.join(' ')));
  assert.deepEqual(out, {});
  assert.ok(logged.some((l) => /settings\.json/.test(l)), `expected a debug line, got ${JSON.stringify(logged)}`);
});

test('readGlobalOptions: reads .options for the resolved key', () => {
  const raw = JSON.stringify({ pluginConfigs: { [PLUGIN_KEY]: { options: { threshold: 90, locale: 'cs-CZ' } } } });
  assert.deepEqual(readGlobalOptions(ENV, readFrom(raw)), { threshold: 90, locale: 'cs-CZ' });
});

test('readGlobalOptions: .options wins over legacy flat keys', () => {
  const raw = JSON.stringify({ pluginConfigs: { [PLUGIN_KEY]: { locale: 'en-US', options: { locale: 'cs-CZ' } } } });
  assert.deepEqual(readGlobalOptions(ENV, readFrom(raw)), { locale: 'cs-CZ' });
});

test('readGlobalOptions: legacy flat option (no .options) is returned', () => {
  const raw = JSON.stringify({ pluginConfigs: { [PLUGIN_KEY]: { locale: 'cs-CZ' } } });
  assert.deepEqual(readGlobalOptions(ENV, readFrom(raw)), { locale: 'cs-CZ' });
});

test('readGlobalOptions: no pluginConfigs -> {}', () => {
  assert.deepEqual(readGlobalOptions(ENV, readFrom(JSON.stringify({ theme: 'dark' }))), {});
});
