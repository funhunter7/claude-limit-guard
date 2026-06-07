import { readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

// Burn-rate history lives in a single bounded ring-buffer file in the OS temp dir, kept
// separate from the single-reading status cache (lib/cache.mjs) which it must not overload.
export const HISTORY_PATH = join(tmpdir(), 'claude-limit-guard-history.json');

// The status line re-renders far faster than usage meaningfully changes, so throttle history
// writes to one per minute — otherwise 30 sub-second readings would make the projection
// extrapolate "% per minute" from noise.
export const HISTORY_MIN_INTERVAL_MS = 60000;

// A drop larger than this many percentage points between consecutive readings means the
// window reset (e.g. 90% -> 5%); readings before it belong to a finished window and must
// not pollute the fit.
const RESET_DROP = 15;

// Refuse to project from a segment that spans less than this many minutes: a steep slope
// measured over seconds extrapolates to a wildly unreliable ETA.
const MIN_SPAN_MINUTES = 2;

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
  const { readFile = readFileSync, writeFile = writeFileSync, minIntervalMs = 0 } = deps;
  try {
    const history = readHistory(path, readFile);
    const last = history[history.length - 1];
    // Throttle: skip when the previous reading is more recent than minIntervalMs.
    if (last && typeof last.ts === 'number' && typeof reading.ts === 'number'
      && reading.ts - last.ts < minIntervalMs) {
      return false;
    }
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
  const xsAll = [];
  const ysAll = [];
  for (const r of history) {
    if (r && typeof r.ts === 'number' && typeof r[key] === 'number') {
      xsAll.push((r.ts - now) / 60000); // minutes relative to now (x = 0 at now)
      ysAll.push(r[key]);
    }
  }
  // Keep only the current window: discard everything up to the last reset (a large drop
  // between consecutive readings), so a finished window's climb can't skew the slope.
  let start = 0;
  for (let i = 1; i < ysAll.length; i++) {
    if (ysAll[i] < ysAll[i - 1] - RESET_DROP) start = i;
  }
  const xs = xsAll.slice(start);
  const ys = ysAll.slice(start);
  const n = xs.length;
  if (n < 2) return null;
  // Need a wide enough time base; readings arrive in chronological order.
  if (xs[n - 1] - xs[0] < MIN_SPAN_MINUTES) return null;
  // Already at/above the threshold per the latest actual reading: no future ETA to show
  // (a lagging fit could otherwise advertise a contradictory "time to" while red).
  if (ys[n - 1] >= threshold) return null;

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
