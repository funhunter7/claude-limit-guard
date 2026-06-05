// Map Claude Code's native statusline `rate_limits` payload into the internal usage shape
// consumed by lib/format.mjs and lib/threshold.mjs ({ five_hour|seven_day: { utilization, resets_at } }).
//
// Sources (verified 2026-06-05): code.claude.com/docs/en/statusline gives
//   rate_limits.<window>.used_percentage (0-100, may be fractional) and .resets_at (Unix epoch SECONDS).
// Two documented hazards are handled here:
//   - issue #52326: used_percentage may return a garbage epoch value when a window has no data yet
//     -> any value outside [0,100] is rejected.
//   - issue #40094 / API-key users: a window (or the whole field) may be absent -> dropped/null.

const WINDOWS = ['five_hour', 'seven_day'];

// resets_at arrives as Unix epoch seconds; new Date(number) treats numbers as ms, so scale up.
// A string variant (observed in one CC version) is passed through for new Date() to parse.
function mapResetsAt(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v * 1000;
  if (typeof v === 'string') return v;
  return undefined;
}

/**
 * Convert a Claude Code `rate_limits` object into the internal usage shape.
 * @param {unknown} rateLimits The `rate_limits` field from the statusline stdin payload.
 * @returns {{five_hour?: object, seven_day?: object}|null} Valid windows only, or null if none.
 */
export function usageFromRateLimits(rateLimits) {
  if (!rateLimits || typeof rateLimits !== 'object') return null;
  const out = {};
  for (const key of WINDOWS) {
    const raw = rateLimits[key];
    const up = raw?.used_percentage;
    if (typeof up !== 'number' || !Number.isFinite(up) || up < 0 || up > 100) continue;
    const win = { utilization: up };
    const resetsAt = mapResetsAt(raw.resets_at);
    if (resetsAt !== undefined) win.resets_at = resetsAt;
    out[key] = win;
  }
  return Object.keys(out).length ? out : null;
}

/**
 * True iff every watched window is present in `stdinUsage` with a numeric utilization.
 * @param {object|null} stdinUsage Output of usageFromRateLimits.
 * @param {string[]} watch Watched window keys (e.g. ['five_hour','seven_day']).
 * @returns {boolean}
 */
export function coversWatched(stdinUsage, watch) {
  if (!stdinUsage) return false;
  return watch.every((k) => stdinUsage[k] && typeof stdinUsage[k].utilization === 'number');
}
