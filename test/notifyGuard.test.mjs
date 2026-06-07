import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldNotify } from '../lib/notifyGuard.mjs';

test('shouldNotify: first time for a key -> true and records it', () => {
  let stored = null;
  const deps = {
    readFile: () => { throw new Error('ENOENT'); },
    writeFile: (_p, d) => { stored = d; },
    path: 'x',
  };
  assert.equal(shouldNotify('cwd|five_hour|123|warn', deps), true);
  assert.match(stored, /five_hour/);
});

test('shouldNotify: same key again -> false (no repeat notification)', () => {
  const deps = {
    readFile: () => JSON.stringify({ keys: ['cwd|five_hour|123|warn'] }),
    writeFile: () => {},
    path: 'x',
  };
  assert.equal(shouldNotify('cwd|five_hour|123|warn', deps), false);
});

test('shouldNotify: a different band/window crossing -> true', () => {
  let stored;
  const deps = {
    readFile: () => JSON.stringify({ keys: ['cwd|five_hour|123|warn'] }),
    writeFile: (_p, d) => { stored = d; },
    path: 'x',
  };
  assert.equal(shouldNotify('cwd|five_hour|123|breach', deps), true);
  assert.match(stored, /breach/);
});

test('shouldNotify: bounds the stored key list', () => {
  let stored;
  const many = Array.from({ length: 20 }, (_, i) => `k${i}`);
  const deps = {
    readFile: () => JSON.stringify({ keys: many }),
    writeFile: (_p, d) => { stored = d; },
    path: 'x',
  };
  assert.equal(shouldNotify('k-new', deps), true);
  const keys = JSON.parse(stored).keys;
  assert.equal(keys.length, 20);
  assert.equal(keys.includes('k0'), false); // oldest dropped
  assert.equal(keys.includes('k-new'), true);
});

test('shouldNotify: never throws on write failure, still returns true', () => {
  const deps = {
    readFile: () => { throw new Error('x'); },
    writeFile: () => { throw new Error('y'); },
    path: 'x',
  };
  let r;
  assert.doesNotThrow(() => { r = shouldNotify('k', deps); });
  assert.equal(r, true);
});
