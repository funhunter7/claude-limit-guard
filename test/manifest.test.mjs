import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (rel) => JSON.parse(readFileSync(join(root, rel), 'utf8'));

const VALID_EVENTS = new Set([
  'PreToolUse', 'PostToolUse', 'UserPromptSubmit', 'Stop', 'SubagentStop',
  'Notification', 'PreCompact', 'SessionStart', 'SessionEnd',
]);

test('hooks.json: top-level "hooks" is a record (Claude Code plugin schema)', () => {
  const manifest = readJson('hooks/hooks.json');
  assert.equal(typeof manifest.hooks, 'object');
  assert.ok(manifest.hooks !== null && !Array.isArray(manifest.hooks),
    'hooks must be an object keyed by event name, not an array or null');
});

test('hooks.json: every event is known and maps to an array of matcher groups', () => {
  const { hooks } = readJson('hooks/hooks.json');
  for (const [event, groups] of Object.entries(hooks)) {
    assert.ok(VALID_EVENTS.has(event), `unknown hook event: ${event}`);
    assert.ok(Array.isArray(groups), `${event} must be an array`);
    for (const group of groups) {
      assert.ok(Array.isArray(group.hooks), `${event} group needs a hooks array`);
      for (const h of group.hooks) {
        assert.equal(h.type, 'command');
        assert.match(h.command, /CLAUDE_PLUGIN_ROOT/, 'command should use ${CLAUDE_PLUGIN_ROOT}');
      }
    }
  }
});

test('plugin.json: does not re-reference the auto-loaded hooks/hooks.json', () => {
  // Claude Code auto-loads the conventional hooks/hooks.json; referencing it again
  // in manifest.hooks makes the loader report a "Duplicate hooks file" error.
  const plugin = readJson('.claude-plugin/plugin.json');
  const ref = typeof plugin.hooks === 'string' ? [plugin.hooks] : (plugin.hooks ?? []);
  for (const p of ref) {
    assert.notMatch(p, /(^\.\/)?hooks\/hooks\.json$/,
      'remove ./hooks/hooks.json from manifest.hooks — it loads automatically');
  }
});

test('plugin.json and package.json versions agree', () => {
  assert.equal(readJson('.claude-plugin/plugin.json').version, readJson('package.json').version);
});

test('plugin.json: userConfig omits the OS/terminal-driven options (locale, time_format, style)', () => {
  // These auto-detect from the OS/terminal, so the always-on /config dialog must not prompt
  // for them; time_format/style remain overridable on demand via /limit-guard-config.
  const { userConfig } = readJson('.claude-plugin/plugin.json');
  for (const k of ['locale', 'time_format', 'style']) {
    assert.equal(userConfig[k], undefined, `userConfig should not expose ${k}`);
  }
});

test('commands/limit-guard-config.md: drives bin/config.mjs via CLAUDE_PLUGIN_ROOT, Czech', () => {
  const md = readFileSync(join(root, 'commands/limit-guard-config.md'), 'utf8');
  assert.match(md, /allowed-tools:.*AskUserQuestion/, 'must allow AskUserQuestion');
  assert.match(md, /\$\{CLAUDE_PLUGIN_ROOT\}\/bin\/config\.mjs/, 'must invoke bin/config.mjs');
  assert.match(md, /Communicate with the user exclusively in Czech/, 'must instruct Czech');
});
