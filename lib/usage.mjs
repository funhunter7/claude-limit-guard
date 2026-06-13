import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readCache as defaultReadCache, writeCache as defaultWriteCache } from './cache.mjs';
import { getToken as defaultGetToken } from './credentials.mjs';
import { fetchUsage as defaultFetchUsage } from './fetchUsage.mjs';
import { watchedExpired } from './stdinUsage.mjs';
import { makeDebug } from './debug.mjs';

export const CACHE_PATH = join(tmpdir(), 'claude-limit-guard-cache.json');
export const TTL_MS = 45_000;

export async function getUsage(cachePath = CACHE_PATH, deps = {}) {
  const {
    readCache = defaultReadCache,
    writeCache = defaultWriteCache,
    getToken = defaultGetToken,
    fetchUsage = defaultFetchUsage,
    debug = makeDebug(),
    nowMs = Date.now(),
    // When provided, a cached reading whose watched window has already reset is treated as
    // stale (regardless of TTL) and a fresh fetch is forced — otherwise the 45 s cache,
    // write-through-populated from stale stdin data, would mask a limit reset.
    watch = null,
  } = deps;

  const fresh = readCache(cachePath, TTL_MS, nowMs);
  if (fresh && !(watch && watchedExpired(fresh, watch, nowMs))) {
    debug('cache hit (fresh)');
    return fresh;
  }
  if (fresh) debug('cache present but past reset; refetching');

  const res = await fetchUsage(getToken());
  if (res.ok) {
    debug('fetch ok, caching');
    writeCache(cachePath, res.data);
    return res.data;
  }
  debug('fetch failed:', res.reason);
  // fetch failed: prefer any stale cache regardless of TTL
  const stale = readCache(cachePath, Number.MAX_SAFE_INTEGER);
  if (stale) {
    debug('serving stale cache');
    return stale;
  }
  // no data at all: surface auth problems distinctly so the UI can prompt re-login
  if (res.reason === 'expired' || res.reason === 'no-token') {
    debug('auth error, no data:', res.reason);
    return { authError: res.reason };
  }
  debug('no data, returning null');
  return null;
}
