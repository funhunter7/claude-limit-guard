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

test('plugin.json: hooks field points at hooks/hooks.json', () => {
  const plugin = readJson('.claude-plugin/plugin.json');
  assert.equal(plugin.hooks, './hooks/hooks.json');
});

test('plugin.json and package.json versions agree', () => {
  assert.equal(readJson('.claude-plugin/plugin.json').version, readJson('package.json').version);
});
