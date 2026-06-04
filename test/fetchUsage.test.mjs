import { test } from 'node:test';
import assert from 'node:assert/strict';
import { usageHeaders, fetchUsage, resolveCcVersion } from '../lib/fetchUsage.mjs';

test('usageHeaders: required auth + beta + UA headers', () => {
  const h = usageHeaders('tok');
  assert.equal(h.Authorization, 'Bearer tok');
  assert.equal(h['anthropic-beta'], 'oauth-2025-04-20');
  assert.match(h['User-Agent'], /^claude-code\//);
});

test('resolveCcVersion: falls back to the built-in default when unset', () => {
  assert.match(resolveCcVersion({}), /^\d+\.\d+\.\d+$/);
});

test('resolveCcVersion: honors CLAUDE_LIMIT_GUARD_CC_VERSION', () => {
  assert.equal(resolveCcVersion({ CLAUDE_LIMIT_GUARD_CC_VERSION: '9.9.9' }), '9.9.9');
});

test('usageHeaders: uses an explicitly provided cc version', () => {
  assert.equal(usageHeaders('tok', '9.9.9')['User-Agent'], 'claude-code/9.9.9');
});

test('fetchUsage: no token -> reason no-token', async () => {
  assert.deepEqual(await fetchUsage(null), { ok: false, reason: 'no-token' });
});

test('fetchUsage: 200 -> ok with data', async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, json: async () => ({ five_hour: { utilization: 10 } }) });
  const r = await fetchUsage('tok', { fetchImpl });
  assert.deepEqual(r, { ok: true, data: { five_hour: { utilization: 10 } } });
});

test('fetchUsage: 401 -> reason expired', async () => {
  const fetchImpl = async () => ({ ok: false, status: 401, json: async () => ({}) });
  assert.deepEqual(await fetchUsage('tok', { fetchImpl }), { ok: false, reason: 'expired' });
});

test('fetchUsage: other non-ok -> http-<code>', async () => {
  const fetchImpl = async () => ({ ok: false, status: 503, json: async () => ({}) });
  assert.deepEqual(await fetchUsage('tok', { fetchImpl }), { ok: false, reason: 'http-503' });
});

test('fetchUsage: abort -> reason timeout', async () => {
  const fetchImpl = async (_u, { signal }) => {
    const err = new Error('aborted'); err.name = 'AbortError';
    if (signal) throw err;
    throw err;
  };
  assert.deepEqual(await fetchUsage('tok', { fetchImpl, timeoutMs: 5 }), { ok: false, reason: 'timeout' });
});
