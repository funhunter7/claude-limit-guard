import { test } from 'node:test';
import assert from 'node:assert/strict';
import { setProjectGuard, clearProjectGuard, setGlobalGuard, clearGlobalGuard, PLUGIN_KEY } from '../lib/guardConfig.mjs';

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

const ENV = { CLAUDE_CONFIG_DIR: '/home/u/.claude' };

test('setGlobalGuard: creates nested pluginConfigs key', () => {
  const fs = fakeFs();
  const path = setGlobalGuard('Save and stop.', { ...fs, env: ENV });
  assert.match(path.replace(/\\/g, '/'), /\/home\/u\/\.claude\/settings\.json$/);
  const obj = JSON.parse(fs.files.get(path));
  assert.equal(obj.pluginConfigs[PLUGIN_KEY].guard_action, 'Save and stop.');
});

test('setGlobalGuard: preserves existing settings keys', () => {
  const fs = fakeFs();
  const path = setGlobalGuard('x', { ...fs, env: ENV });
  fs.files.set(path, JSON.stringify({
    statusLine: { type: 'command', command: 'node x' },
    pluginConfigs: { 'other@m': { foo: 1 }, [PLUGIN_KEY]: { guard_action: 'x' } },
  }));
  setGlobalGuard('new', { ...fs, env: ENV });
  const obj = JSON.parse(fs.files.get(path));
  assert.deepEqual(obj.statusLine, { type: 'command', command: 'node x' });
  assert.deepEqual(obj.pluginConfigs['other@m'], { foo: 1 });
  assert.equal(obj.pluginConfigs[PLUGIN_KEY].guard_action, 'new');
});

test('clearGlobalGuard: removes only guard_action, keeps siblings', () => {
  const fs = fakeFs();
  const path = setGlobalGuard('x', { ...fs, env: ENV });
  fs.files.set(path, JSON.stringify({
    pluginConfigs: { [PLUGIN_KEY]: { guard_action: 'x', threshold: 90 } },
  }));
  clearGlobalGuard({ ...fs, env: ENV });
  const obj = JSON.parse(fs.files.get(path));
  assert.equal(obj.pluginConfigs[PLUGIN_KEY].guard_action, undefined);
  assert.equal(obj.pluginConfigs[PLUGIN_KEY].threshold, 90);
});

test('clearGlobalGuard: no file -> no throw', () => {
  const fs = fakeFs();
  assert.doesNotThrow(() => clearGlobalGuard({ ...fs, env: ENV }));
});
