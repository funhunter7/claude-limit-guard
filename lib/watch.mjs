// Resolve the configured `watch` (the sentinel string 'auto' or an explicit array of
// window keys) into the effective windows to show/guard. Pure: no I/O, no Date.now().
//
// 'auto' is model-aware WITHOUT needing the active model: it always covers the 5h and
// overall weekly windows, then adds any per-model weekly window actually used this week
// (utilization > 0). Because it reads only the usage payload, it works identically in the
// status line and in the hooks, and covers Opus-main-with-Sonnet-subagents (both windows
// rise above 0, so both are watched).

export const AUTO = 'auto';

const BASE = ['five_hour', 'seven_day'];
const PER_MODEL = ['seven_day_opus', 'seven_day_sonnet'];

/**
 * The fixed window set known before live usage (hot-path coverage + staleness checks).
 * @param {string|string[]} watchConfig 'auto' or an explicit array of window keys.
 * @returns {string[]}
 */
export function watchBase(watchConfig) {
  return Array.isArray(watchConfig) ? watchConfig : [...BASE];
}

/**
 * The effective windows to show/guard, resolved from live usage.
 * @param {object|null|undefined} usage Internal usage shape ({ five_hour: { utilization }, ... }).
 * @param {string|string[]} watchConfig 'auto' or an explicit array of window keys.
 * @returns {string[]}
 */
export function resolveWatch(usage, watchConfig) {
  if (Array.isArray(watchConfig)) return watchConfig;
  const out = [...BASE];
  for (const key of PER_MODEL) {
    const v = usage?.[key]?.utilization;
    if (typeof v === 'number' && v > 0) out.push(key);
  }
  return out;
}
