export function breachedLimits(usage, threshold, watch, overrides = {}) {
  if (!usage) return [];
  const out = [];
  for (const key of watch) {
    const lim = usage[key];
    // Use ?? so an explicit override of 0 is honored (0 is a valid threshold).
    const effThreshold = overrides[key] ?? threshold;
    if (lim && lim.utilization != null && lim.utilization >= effThreshold) out.push(key);
  }
  return out;
}

// Returns the subset of watched windows whose utilization is in [warnBand, effThreshold),
// where effThreshold is the window's per-window override (if set) or the global threshold —
// mirroring breachedLimits so warn and breach share the same upper bound. A window at/above
// its effective threshold is breached (not warned); below warnBand is neither.
export function warnedLimits(usage, warnBand, threshold, watch, overrides = {}) {
  if (!usage) return [];
  const out = [];
  for (const key of watch) {
    const lim = usage[key];
    const effThreshold = overrides[key] ?? threshold;
    if (lim && lim.utilization != null && lim.utilization >= warnBand && lim.utilization < effThreshold) out.push(key);
  }
  return out;
}
