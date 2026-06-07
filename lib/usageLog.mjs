import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Long-lived usage log (distinct from the short tmpdir burn-rate ring buffer): an append-only
// JSONL kept under ~/.claude, throttled to one line/minute and pruned to a rolling ~7 days, so
// /limit-guard-stats can summarize recent usage. One line ≈ one reading: { ts, five_hour?, ... }.
export const USAGE_LOG_PATH = join(homedir(), '.claude', 'claude-limit-guard-usage.jsonl');
export const USAGE_LOG_MIN_INTERVAL_MS = 60000;
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
// A drop larger than this many points between consecutive readings counts as a window reset.
const RESET_DROP = 15;

// File last-modified time in ms, used as a cheap throttle proxy. Throws if the file is absent.
function defaultMtimeMs(path) {
  return statSync(path).mtimeMs;
}

// Parse the JSONL log into reading objects, skipping blank/garbage lines. [] on any error.
export function readUsageLog(path, readFile = readFileSync) {
  try {
    const raw = readFile(path, 'utf8');
    return raw
      .split('\n')
      .filter(Boolean)
      .map((line) => { try { return JSON.parse(line); } catch { return null; } })
      .filter((o) => o && typeof o.ts === 'number');
  } catch {
    return [];
  }
}

// Append one reading, throttled (skip when the last entry is newer than minIntervalMs) and
// pruned to the last 7 days. Rewrites the whole file so pruning takes effect; at one line per
// minute over a week that's only ~10k short lines. Never throws; returns false when skipped.
export function appendUsage(path, reading, now, deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, statFile = defaultMtimeMs, minIntervalMs = USAGE_LOG_MIN_INTERVAL_MS } = deps;
  // Cheap throttle: the status line calls this on every render, so skip without reading the
  // (potentially ~10k-line) log when the file was written within the throttle window. The
  // last-entry check below is the source of truth; this just avoids the read on the hot path.
  try {
    const mtime = statFile(path);
    if (mtime != null && now - mtime < minIntervalMs) return false;
  } catch {
    // no file yet (or stat unavailable) — fall through and let the read/append create it
  }
  try {
    const lines = readUsageLog(path, readFile);
    const last = lines[lines.length - 1];
    if (last && typeof last.ts === 'number' && now - last.ts < minIntervalMs) return false;
    lines.push(reading);
    const cutoff = now - SEVEN_DAYS_MS;
    const kept = lines.filter((l) => l.ts >= cutoff);
    writeFile(path, kept.map((l) => JSON.stringify(l)).join('\n') + '\n', 'utf8');
    return true;
  } catch {
    return false;
  }
}

// Summarize a list of readings: reading count, per-window peak utilization, number of window
// resets (a >15-point drop between consecutive readings, counted across both windows), and the
// oldest timestamp. Pure; nulls when a window never appears.
export function summarize(lines, _now) {
  const valid = lines.filter((l) => l && typeof l.ts === 'number');
  if (!valid.length) return { count: 0, peakFiveHour: null, peakSevenDay: null, resets: 0, sinceMs: null };

  let peakFiveHour = null;
  let peakSevenDay = null;
  let resets = 0;
  let prevFive = null;
  let prevSeven = null;
  for (const l of valid) {
    if (typeof l.five_hour === 'number') {
      if (peakFiveHour == null || l.five_hour > peakFiveHour) peakFiveHour = l.five_hour;
      if (prevFive != null && l.five_hour < prevFive - RESET_DROP) resets++;
      prevFive = l.five_hour;
    }
    if (typeof l.seven_day === 'number') {
      if (peakSevenDay == null || l.seven_day > peakSevenDay) peakSevenDay = l.seven_day;
      if (prevSeven != null && l.seven_day < prevSeven - RESET_DROP) resets++;
      prevSeven = l.seven_day;
    }
  }
  return { count: valid.length, peakFiveHour, peakSevenDay, resets, sinceMs: valid[0].ts };
}
