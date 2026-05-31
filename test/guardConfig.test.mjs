import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setProjectGuard, clearProjectGuard } from '../lib/guardConfig.mjs';

// In-memory fake fs: a Map of path -> contents.
function fakeFs(initial = {}) {
  const files = new Map(Object.entries(initial));
  return {
    files,
    readFile: (p) => {
      if (!files.has(p)) { const e = new Error('ENOENT'); e.code = 'ENOENT'; throw e; }
      return files.get(p);
    },
    writeFile: (p, data) => { files.set(p, data); },
    mkdir: () => {},
  };
}

test('setProjectGuard: creates file with guardAction', () => {
  const fs = fakeFs();
  const path = setProjectGuard('/proj', 'Save and stop.', fs);
  assert.match(path.replace(/\\/g, '/'), /\/proj\/\.claude\/limit-guard\.json$/);
  assert.deepEqual(JSON.parse(fs.files.get(path)), { guardAction: 'Save and stop.' });
});

test('setProjectGuard: preserves other keys', () => {
  const fs = fakeFs();
  const path = setProjectGuard('/proj', 'x', fs); // create to learn the path
  fs.files.set(path, JSON.stringify({ threshold: 90, guardAction: 'x' }));
  setProjectGuard('/proj', 'new', fs);
  assert.deepEqual(JSON.parse(fs.files.get(path)), { threshold: 90, guardAction: 'new' });
});

test('clearProjectGuard: removes only guardAction', () => {
  const fs = fakeFs();
  const path = setProjectGuard('/proj', 'x', fs);
  fs.files.set(path, JSON.stringify({ threshold: 90, guardAction: 'x' }));
  clearProjectGuard('/proj', fs);
  assert.deepEqual(JSON.parse(fs.files.get(path)), { threshold: 90 });
});

test('setProjectGuard: invalid JSON refuses to overwrite', () => {
  const fs = fakeFs();
  const path = setProjectGuard('/proj', 'x', fs);
  fs.files.set(path, '{ not json');
  assert.throws(() => setProjectGuard('/proj', 'y', fs), /Invalid JSON/);
});
