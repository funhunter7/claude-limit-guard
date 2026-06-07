import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const SNOOZE_PATH = join(tmpdir(), 'claude-limit-guard-snooze.json');

// Persist a snooze expiry (ms epoch). While active, the guard/context directives are
// suppressed. Best-effort: a failed write simply means no snooze takes effect.
export function setSnooze(untilMs, deps = {}) {
  const { writeFile = writeFileSync, path = SNOOZE_PATH } = deps;
  try { writeFile(path, JSON.stringify({ until: untilMs }), 'utf8'); } catch { /* best-effort */ }
  return path;
}

// Clear any active snooze (writes an already-expired marker).
export function clearSnooze(deps = {}) {
  const { writeFile = writeFileSync, path = SNOOZE_PATH } = deps;
  try { writeFile(path, JSON.stringify({ until: 0 }), 'utf8'); } catch { /* best-effort */ }
  return path;
}

// Returns the active expiry (ms) if a snooze is in effect at `now`, else null. Never throws.
export function snoozeUntil(now, deps = {}) {
  const { readFile = readFileSync, path = SNOOZE_PATH } = deps;
  try {
    const until = JSON.parse(readFile(path, 'utf8')).until;
    return (typeof until === 'number' && now < until) ? until : null;
  } catch {
    return null;
  }
}
