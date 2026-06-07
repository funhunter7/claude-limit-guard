import { test } from 'node:test';
import assert from 'node:assert/strict';
import { probeTokenPresent, probeStatusLineWired, probeCacheAge } from '../lib/health.mjs';

test('probeTokenPresent: true when getToken returns non-null, false on null/throw', () => {
  assert.equal(probeTokenPresent(() => 'tok'), true);
  assert.equal(probeTokenPresent(() => null), false);
  assert.equal(probeTokenPresent(() => { throw new Error('x'); }), false);
});

test('probeStatusLineWired: true when command references usage.mjs', () => {
  const wired = () => JSON.stringify({ statusLine: { command: 'node "/p/bin/usage.mjs" --statusline' } });
  assert.equal(probeStatusLineWired({}, wired), true);
  const other = () => JSON.stringify({ statusLine: { command: 'something-else' } });
  assert.equal(probeStatusLineWired({}, other), false);
  assert.equal(probeStatusLineWired({}, () => { throw new Error('missing'); }), false);
});

test('probeCacheAge: null when missing/malformed, otherwise now-ts', () => {
  assert.equal(probeCacheAge('x', 1000, () => { throw new Error('missing'); }), null);
  assert.equal(probeCacheAge('x', 1000, () => JSON.stringify({ data: {} })), null); // no ts
  assert.equal(probeCacheAge('x', 5000, () => JSON.stringify({ ts: 1000, data: {} })), 4000);
});
