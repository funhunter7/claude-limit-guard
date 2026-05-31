import { test } from 'node:test';
import assert from 'node:assert/strict';
import { shouldBlockStop } from '../lib/stopGuard.mjs';

function fakeFs() {
  const store = { data: undefined };
  return {
    store,
    readFile: () => { if (store.data === undefined) throw new Error('ENOENT'); return store.data; },
    writeFile: (_p, data) => { store.data = data; },
    path: '/fake/marker.json',
  };
}

test('shouldBlockStop: first time for a window -> block and record', () => {
  const fs = fakeFs();
  assert.equal(shouldBlockStop('2026-05-31T15:00:00Z', fs), true);
  assert.match(fs.store.data, /2026-05-31T15:00:00Z/);
});

test('shouldBlockStop: same window again -> allow (no re-block)', () => {
  const fs = fakeFs();
  shouldBlockStop('W1', fs);
  assert.equal(shouldBlockStop('W1', fs), false);
});

test('shouldBlockStop: a new window -> block again', () => {
  const fs = fakeFs();
  shouldBlockStop('W1', fs);
  assert.equal(shouldBlockStop('W2', fs), true);
});

test('shouldBlockStop: unreadable marker -> block', () => {
  const fs = fakeFs(); // readFile throws (no data)
  assert.equal(shouldBlockStop('W1', fs), true);
});
