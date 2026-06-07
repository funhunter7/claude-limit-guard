import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Burn-rate history lives in a single bounded ring-buffer file in the OS temp dir, kept
// separate from the single-reading status cache (lib/cache.mjs) which it must not overload.
export const HISTORY_PATH = join(tmpdir(), 'claude-limit-guard-history.json');

// Read the ring buffer as an array of readings. Returns [] on any error (missing file,
// malformed JSON, non-array contents) so callers never have to guard.
export function readHistory(path, readFile = readFileSync) {
  try {
    const arr = JSON.parse(readFile(path, 'utf8'));
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

// Append one reading ({ ts, <window>: <utilization>, ... }) to the ring buffer, keeping at
// most `max` most-recent readings. Synchronous by contract: callers in bin/usage.mjs invoke
// it fire-and-forget (no await), exactly like writeCache. Never throws; returns false on any
// read/write failure so a transient FS hiccup can't break the status line.
export function appendReading(path, reading, max = 30, deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync } = deps;
  try {
    const history = readHistory(path, readFile);
    history.push(reading);
    const trimmed = history.slice(-max);
    writeFile(path, JSON.stringify(trimmed), 'utf8');
    return true;
  } catch {
    return false;
  }
}

// Project the minutes from `now` (epoch ms) until window `key` reaches `threshold` (%),
// via an ordinary least-squares fit of utilization against time over the history's points
// for that window. Time is measured in minutes relative to `now` for numeric stability
// (raw epoch-ms values would lose precision in the variance terms). Returns null when there
// are fewer than 2 usable points, the trend is flat/declining (slope ≤ 0), or the projected
// utilization is already at/above `threshold` at `now`.
export function projectMinutesToThreshold(history, key, threshold, now) {
  const xs = [];
  const ys = [];
  for (const r of history) {
    if (r && typeof r.ts === 'number' && typeof r[key] === 'number') {
      xs.push((r.ts - now) / 60000); // minutes relative to now (x = 0 at now)
      ys.push(r[key]);
    }
  }
  const n = xs.length;
  if (n < 2) return null;

  let sx = 0;
  let sy = 0;
  let sxx = 0;
  let sxy = 0;
  for (let i = 0; i < n; i++) {
    sx += xs[i];
    sy += ys[i];
    sxx += xs[i] * xs[i];
    sxy += xs[i] * ys[i];
  }
  const denom = n * sxx - sx * sx;
  if (denom === 0) return null; // all readings at the same instant
  const slope = (n * sxy - sx * sy) / denom; // % per minute
  if (slope <= 0) return null;
  const intercept = (sy - slope * sx) / n; // projected utilization at now (x = 0)
  if (intercept >= threshold) return null;
  const minutes = (threshold - intercept) / slope;
  if (!Number.isFinite(minutes) || minutes <= 0) return null;
  return minutes;
}
