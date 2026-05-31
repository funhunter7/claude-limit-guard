import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readCache, writeCache } from '../lib/cache.mjs';

test('readCache: fresh entry returned', () => {
  const readFile = () => JSON.stringify({ ts: 1000, data: { a: 1 } });
  assert.deepEqual(readCache('/c', 5000, 4000 + 1000, readFile), { a: 1 });
});

test('readCache: stale entry -> null', () => {
  const readFile = () => JSON.stringify({ ts: 1000, data: { a: 1 } });
  assert.equal(readCache('/c', 5000, 99000 + 1000, readFile), null);
});

test('readCache: missing/garbage -> null', () => {
  const throws = () => { throw new Error('ENOENT'); };
  assert.equal(readCache('/c', 5000, 45000, throws), null);
  assert.equal(readCache('/c', 5000, 45000, () => 'garbage'), null);
});

test('writeCache: serializes ts + data', () => {
  let written;
  const writeFile = (_p, contents) => { written = contents; };
  assert.equal(writeCache('/c', { a: 1 }, 7000, writeFile), true);
  assert.deepEqual(JSON.parse(written), { ts: 7000, data: { a: 1 } });
});
