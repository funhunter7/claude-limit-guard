export function breachedLimits(usage, threshold, watch) {
  if (!usage) return [];
  const out = [];
  for (const key of watch) {
    const lim = usage[key];
    if (lim && lim.utilization != null && lim.utilization >= threshold) out.push(key);
  }
  return out;
}
