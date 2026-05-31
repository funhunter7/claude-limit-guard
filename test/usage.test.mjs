import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getUsage } from '../lib/usage.mjs';

function deps({ cache = null, fetchResult, stale = null }) {
  const calls = { wrote: null };
  return {
    calls,
    readCache: (_p, ttl) => (ttl === Number.MAX_SAFE_INTEGER ? stale : cache),
    writeCache: (_p, data) => { calls.wrote = data; return true; },
    getToken: () => 'tok',
    fetchUsage: async () => fetchResult,
  };
}

test('getUsage: returns fresh cache without fetching', async () => {
  const d = deps({ cache: { five_hour: { utilization: 1 } } });
  d.fetchUsage = async () => { throw new Error('should not fetch'); };
  const r = await getUsage('/c', d);
  assert.deepEqual(r, { five_hour: { utilization: 1 } });
  assert.equal(d.calls.wrote, null);
});

test('getUsage: fetches and writes cache on miss', async () => {
  const d = deps({ cache: null, fetchResult: { ok: true, data: { seven_day: { utilization: 2 } } } });
  const r = await getUsage('/c', d);
  assert.deepEqual(r, { seven_day: { utilization: 2 } });
  assert.deepEqual(d.calls.wrote, { seven_day: { utilization: 2 } });
});

test('getUsage: fetch fails -> falls back to stale cache', async () => {
  const d = deps({ cache: null, fetchResult: { ok: false, reason: 'timeout' }, stale: { five_hour: { utilization: 9 } } });
  const r = await getUsage('/c', d);
  assert.deepEqual(r, { five_hour: { utilization: 9 } });
});

test('getUsage: auth failure, no stale -> authError sentinel', async () => {
  const d = deps({ cache: null, fetchResult: { ok: false, reason: 'no-token' }, stale: null });
  assert.deepEqual(await getUsage('/c', d), { authError: 'no-token' });
});

test('getUsage: network failure, no stale -> null', async () => {
  const d = deps({ cache: null, fetchResult: { ok: false, reason: 'timeout' }, stale: null });
  assert.equal(await getUsage('/c', d), null);
});
