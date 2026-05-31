const WARN_BAND = 80;

export function bandEmoji(util, threshold) {
  if (util == null) return '⚪';
  if (util >= threshold) return '🔴';
  if (util >= WARN_BAND) return '🟡';
  return '🟢';
}

const CZ_DAYS = ['ne', 'po', 'út', 'st', 'čt', 'pá', 'so'];

export function formatReset(resetsAt, now = new Date()) {
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
  return `→${CZ_DAYS[d.getDay()]}`;
}
