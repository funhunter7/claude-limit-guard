import { getMessages } from './messages.mjs';

export const WARN_BAND = 80;

export const GLYPHS = {
  emoji: { green: '🟢', amber: '🟡', red: '🔴', unknown: '⚪', arrow: '→', sep: ' · ', auth: '🔑' },
  ascii: { green: '[OK]', amber: '[WARN]', red: '[CRIT]', unknown: '[?]', arrow: '->', sep: ' | ', auth: '[!]' },
};

// Choose a glyph set. 'emoji'/'ascii' are explicit. 'auto' (and anything else) renders
// emoji on non-Windows or in known modern Windows hosts (Windows Terminal, VS Code,
// ConEmu); otherwise it assumes legacy conhost/cmd and uses ASCII.
export function resolveStyle(style, env = process.env, platform = process.platform) {
  if (style === 'emoji') return GLYPHS.emoji;
  if (style === 'ascii') return GLYPHS.ascii;
  if (platform !== 'win32') return GLYPHS.emoji;
  if (env.WT_SESSION || env.WT_PROFILE_ID || env.TERM_PROGRAM || env.ConEmuANSI) return GLYPHS.emoji;
  return GLYPHS.ascii;
}

// Reads the runtime/system hour cycle (h11/h12/h23/h24). Injectable for tests.
function detectSystemHourCycle() {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric' }).resolvedOptions().hourCycle;
}

// Reads the runtime/OS default locale (e.g. 'cs-CZ' on a Czech system, 'en-US' otherwise).
// Cross-platform: Intl honors LANG/LC_* on Linux/macOS and the OS region on Windows.
// Injectable for tests.
function detectSystemLocale() {
  return new Intl.DateTimeFormat().resolvedOptions().locale;
}

// Resolve a locale setting to a concrete BCP-47 tag. 'system'/'auto'/empty follow the OS
// (so weekday names and messages need no language setting); anything else passes through.
export function resolveLocale(locale, detect = detectSystemLocale) {
  if (locale && locale !== 'system' && locale !== 'auto') return locale;
  return detect();
}

// Resolve a time-format setting ('system' | '12' | '24') to a 12-hour boolean.
export function resolveHour12(timeFormat, detectHourCycle = detectSystemHourCycle) {
  if (timeFormat === '12') return true;
  if (timeFormat === '24') return false;
  const hc = detectHourCycle();
  return hc === 'h11' || hc === 'h12';
}

export function bandEmoji(util, threshold, glyphs = GLYPHS.emoji, warnBand = WARN_BAND) {
  if (util == null) return glyphs.unknown;
  if (util >= threshold) return glyphs.red;
  if (util >= warnBand) return glyphs.amber;
  return glyphs.green;
}

// Format the date portion of a cross-day reset as a numeric date with the locale's field
// ORDER but slash separators and no inner spaces, always including the year — e.g. en-US
// `6/3/2026` (month first), cs-CZ/de-DE `3/6/2026` (day first), ja-JP `2026/6/3`.
function formatDate(d, locale) {
  return new Intl.DateTimeFormat(locale || undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(d)
    .filter((p) => p.type === 'day' || p.type === 'month' || p.type === 'year')
    .map((p) => p.value)
    .join('/');
}

// Format the clock portion of a reset time as a locale-aware HH:MM (or h:MM AM/PM when hour12).
function formatClock(d, locale, hour12) {
  if (hour12) {
    return new Intl.DateTimeFormat(locale || undefined, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);
  }
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

// Format a relative countdown from now to d: "in 2h13m" (en) / "za 2h13m" (cs).
// Minutes-only when h=0 (e.g. "in 13m"); clamps to 0m when d is in the past.
function formatRelative(d, now, locale) {
  const mins = Math.max(0, Math.round((d - now) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const word = getMessages(locale).relIn;
  return `${word} ${h ? h + 'h' : ''}${m}m`;
}

export function formatReset(resetsAt, now = new Date(), locale = undefined, hour12 = false, glyphs = GLYPHS.emoji, mode = 'clock') {
  if (!resetsAt) return '';
  const d = new Date(resetsAt);
  if (Number.isNaN(d.getTime())) return '';

  if (mode === 'relative') {
    return `${glyphs.arrow} ${formatRelative(d, now, locale)}`;
  }

  const time = formatClock(d, locale, hour12);
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();

  if (mode === 'both') {
    const clockStr = sameDay ? time : `${d.toLocaleDateString(locale || undefined, { weekday: 'long' })} ${formatDate(d, locale)} ${time}`;
    return `${glyphs.arrow} ${clockStr} (${formatRelative(d, now, locale)})`;
  }

  // mode === 'clock' (default)
  if (sameDay) return `${glyphs.arrow} ${time}`;
  const weekday = d.toLocaleDateString(locale || undefined, { weekday: 'long' });
  const date = formatDate(d, locale);
  return `${glyphs.arrow} ${weekday} ${date} ${time}`;
}

export function formatLimit(label, limit, threshold, now = new Date(), locale = undefined, hour12 = false, glyphs = GLYPHS.emoji, warnBand = WARN_BAND, resetDisplay = 'clock') {
  if (!limit || limit.utilization == null) return `${glyphs.unknown} ${label} ?`;
  const pct = Math.round(limit.utilization);
  const emoji = bandEmoji(limit.utilization, threshold, glyphs, warnBand);
  const reset = formatReset(limit.resets_at, now, locale, hour12, glyphs, resetDisplay);
  return `${emoji} ${label} ${pct}%${reset ? ' ' + reset : ''}`;
}

export function formatStatusLine(usage, threshold, watch, now = new Date(), locale = undefined, hour12 = false, glyphs = GLYPHS.emoji, warnBand = WARN_BAND, labelStyle = 'full', resetDisplay = 'clock') {
  const m = getMessages(locale);
  if (usage && usage.authError) return `${glyphs.auth} ${m.signIn}`;
  if (!usage) return `${glyphs.unknown} limit ?`;
  const labels = labelStyle === 'short' ? m.labelsShort : m.labels;
  const parts = [];
  for (const key of watch) {
    if (labels[key]) parts.push(formatLimit(labels[key], usage[key], threshold, now, locale, hour12, glyphs, warnBand, resetDisplay));
  }
  return parts.length ? parts.join(glyphs.sep) : `${glyphs.unknown} limit ?`;
}
