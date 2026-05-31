const WARN_BAND = 80;

export function bandEmoji(util, threshold) {
  if (util == null) return '⚪';
  if (util >= threshold) return '🔴';
  if (util >= WARN_BAND) return '🟡';
  return '🟢';
}
