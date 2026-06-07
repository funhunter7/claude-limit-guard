import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setSnooze, clearSnooze, snoozeUntil } from '../lib/snoozeGuard.mjs';

test('snoozeUntil: returns the active expiry, null once expired', () => {
  let stored = null;
  const deps = { readFile: () => (stored ?? (() => { throw new Error('x'); })()), writeFile: (_p, d) => { stored = d; }, path: 'x' };
  setSnooze(2000, deps);
  assert.equal(snoozeUntil(1000, deps), 2000); // before expiry
  assert.equal(snoozeUntil(2000, deps), null);  // at/after expiry
});

test('clearSnooze: removes the snooze', () => {
  let stored = JSON.stringify({ until: 5000 });
  const deps = { readFile: () => stored, writeFile: (_p, d) => { stored = d; }, path: 'x' };
  clearSnooze(deps);
  assert.equal(snoozeUntil(1000, deps), null);
});

test('snoozeUntil: never throws on garbage/missing', () => {
  assert.equal(snoozeUntil(1, { readFile: () => { throw new Error('x'); }, path: 'x' }), null);
  assert.equal(snoozeUntil(1, { readFile: () => 'not json', path: 'x' }), null);
});
