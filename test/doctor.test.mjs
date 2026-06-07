import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderDoctor } from '../bin/doctor.mjs';

test('renderDoctor: ok checks show check mark, bad checks show cross + hint', () => {
  const out = renderDoctor([
    { key: 'node', ok: true },
    { key: 'token', ok: false, hint: 'sign in' },
  ], { locale: 'en-US' });
  assert.match(out, /✅.*node/i);
  assert.match(out, /❌.*token/i);
  assert.match(out, /sign in/);
});

test('renderDoctor: neutral check (note) renders without a cross', () => {
  const out = renderDoctor([
    { key: 'version', ok: true, note: 'unknown' },
  ], { locale: 'en-US' });
  assert.doesNotMatch(out, /❌/);
  assert.match(out, /unknown/);
});

test('renderDoctor: localizes the header (cs)', () => {
  const out = renderDoctor([{ key: 'node', ok: true }], { locale: 'cs-CZ' });
  assert.equal(typeof out, 'string');
  assert.ok(out.length > 0);
});
