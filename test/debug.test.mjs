import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isDebugEnabled, makeDebug } from '../lib/debug.mjs';

test('isDebugEnabled: unset / blank / 0 / false / no -> false', () => {
  assert.equal(isDebugEnabled({}), false);
  assert.equal(isDebugEnabled({ CLAUDE_LIMIT_GUARD_DEBUG: '' }), false);
  assert.equal(isDebugEnabled({ CLAUDE_LIMIT_GUARD_DEBUG: '0' }), false);
  assert.equal(isDebugEnabled({ CLAUDE_LIMIT_GUARD_DEBUG: 'false' }), false);
  assert.equal(isDebugEnabled({ CLAUDE_LIMIT_GUARD_DEBUG: 'no' }), false);
});

test('isDebugEnabled: 1 / true / arbitrary truthy -> true', () => {
  assert.equal(isDebugEnabled({ CLAUDE_LIMIT_GUARD_DEBUG: '1' }), true);
  assert.equal(isDebugEnabled({ CLAUDE_LIMIT_GUARD_DEBUG: 'true' }), true);
  assert.equal(isDebugEnabled({ CLAUDE_LIMIT_GUARD_DEBUG: 'verbose' }), true);
});

test('makeDebug: disabled -> no-op, never writes', () => {
  const written = [];
  const debug = makeDebug({}, (s) => written.push(s));
  debug('hello');
  assert.deepEqual(written, []);
});

test('makeDebug: enabled -> writes prefixed line with newline', () => {
  const written = [];
  const debug = makeDebug({ CLAUDE_LIMIT_GUARD_DEBUG: '1' }, (s) => written.push(s));
  debug('fetch', 'timeout');
  assert.deepEqual(written, ['[limit-guard] fetch timeout\n']);
});

test('makeDebug: serializes non-string args as JSON', () => {
  const written = [];
  const debug = makeDebug({ CLAUDE_LIMIT_GUARD_DEBUG: '1' }, (s) => written.push(s));
  debug('result', { ok: false, reason: 'expired' });
  assert.equal(written[0], '[limit-guard] result {"ok":false,"reason":"expired"}\n');
});
