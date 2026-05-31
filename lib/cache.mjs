import { readFileSync, writeFileSync } from 'node:fs';

export function readCache(path, ttlMs, now = Date.now(), readFile = readFileSync) {
  try {
    const obj = JSON.parse(readFile(path, 'utf8'));
    if (typeof obj.ts !== 'number') return null;
    if (now - obj.ts > ttlMs) return null;
    return obj.data;
  } catch {
    return null;
  }
}

export function writeCache(path, data, now = Date.now(), writeFile = writeFileSync) {
  try {
    writeFile(path, JSON.stringify({ ts: now, data }), 'utf8');
    return true;
  } catch {
    return false;
  }
}
