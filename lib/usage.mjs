import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { readCache as defaultReadCache, writeCache as defaultWriteCache } from './cache.mjs';
import { getToken as defaultGetToken } from './credentials.mjs';
import { fetchUsage as defaultFetchUsage } from './fetchUsage.mjs';

export const CACHE_PATH = join(tmpdir(), 'claude-limit-guard-cache.json');
export const TTL_MS = 45_000;

export async function getUsage(cachePath = CACHE_PATH, deps = {}) {
  const {
    readCache = defaultReadCache,
    writeCache = defaultWriteCache,
    getToken = defaultGetToken,
    fetchUsage = defaultFetchUsage,
  } = deps;

  const fresh = readCache(cachePath, TTL_MS);
  if (fresh) return fresh;

  const res = await fetchUsage(getToken());
  if (res.ok) {
    writeCache(cachePath, res.data);
    return res.data;
  }
  // network failed: fall back to any stale cache regardless of TTL
  return readCache(cachePath, Number.MAX_SAFE_INTEGER) ?? null;
}
