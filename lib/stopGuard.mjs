import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const MARKER_PATH = join(tmpdir(), 'claude-limit-guard-stop.json');

// One-shot gate for the Stop hook. Returns true if we should block now (and records the
// current reset window), or false if we already blocked for this window — preventing an
// infinite Stop-block loop when a custom guard action never writes a handoff. A new reset
// window blocks once again.
export function shouldBlockStop(windowKey, deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, path = MARKER_PATH } = deps;
  let last;
  try {
    last = JSON.parse(readFile(path, 'utf8')).window;
  } catch {
    last = null;
  }
  if (last === windowKey) return false;
  try {
    writeFile(path, JSON.stringify({ window: windowKey }), 'utf8');
  } catch {
    // best-effort marker; if we can't persist it we simply block again next time
  }
  return true;
}
