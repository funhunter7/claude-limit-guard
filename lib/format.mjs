const WARN_BAND = 80;

export function bandEmoji(util, threshold) {
  if (util == null) return '⚪';
  if (util >= threshold) return '🔴';
  if (util >= WARN_BAND) return '🟡';
  return '🟢';
}

export function formatReset(resetsAt, now = new Date(), locale = undefined) {
  if (!resetsAt) return '';
  const d = new Date(resetsAt);
  if (Number.isNaN(d.getTime())) return '';
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `→${hh}:${mm}`;
  }
  // Weekday name in the configured language; falls back to the system locale.
  return `→${d.toLocaleDateString(locale || undefined, { weekday: 'short' })}`;
}

export function formatLimit(label, limit, threshold, now = new Date(), locale = undefined) {
  if (!limit || limit.utilization == null) return `⚪ ${label} ?`;
  const pct = Math.round(limit.utilization);
  const emoji = bandEmoji(limit.utilization, threshold);
  const reset = formatReset(limit.resets_at, now, locale);
  return `${emoji} ${label} ${pct}%${reset ? ' ' + reset : ''}`;
}

const LABELS = { five_hour: '5h', seven_day: '7d' };

export function formatStatusLine(usage, threshold, watch, now = new Date(), locale = undefined) {
  if (!usage) return '⚪ limit ?';
  const parts = [];
  for (const key of watch) {
    if (LABELS[key]) parts.push(formatLimit(LABELS[key], usage[key], threshold, now, locale));
  }
  return parts.length ? parts.join(' · ') : '⚪ limit ?';
}
