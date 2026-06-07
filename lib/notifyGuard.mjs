import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const NOTIFY_MARKER_PATH = join(tmpdir(), 'claude-limit-guard-notify.json');

// Keep at most this many recent crossing keys, so the marker can't grow unbounded across
// reset windows. Each key is expected to encode cwd|window|resets_at|band, so a new reset
// period (different resets_at) naturally yields a fresh key and re-notifies once.
const MAX_KEYS = 20;

// Once-per-crossing gate mirroring stopGuard.shouldBlockStop: returns true the first time a
// given crossing key is seen (and records it), false thereafter — so the per-keystroke status
// line fires an OS notification only on the crossing, not on every render. Never throws.
export function shouldNotify(key, deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, path = NOTIFY_MARKER_PATH } = deps;
  let keys = [];
  try {
    const obj = JSON.parse(readFile(path, 'utf8'));
    if (Array.isArray(obj.keys)) keys = obj.keys;
  } catch {
    keys = [];
  }
  if (keys.includes(key)) return false;
  keys.push(key);
  try {
    writeFile(path, JSON.stringify({ keys: keys.slice(-MAX_KEYS) }), 'utf8');
  } catch {
    // best-effort marker; if we can't persist it we may notify again next time
  }
  return true;
}
