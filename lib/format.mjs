import { getMessages } from './messages.mjs';

export const WARN_BAND = 80;

export const GLYPHS = {
  emoji: { green: '🟢', amber: '🟡', red: '🔴', unknown: '⚪', arrow: '→', sep: ' · ', auth: '🔑', trend: '📈' },
  ascii: { green: '[OK]', amber: '[WARN]', red: '[CRIT]', unknown: '[?]', arrow: '->', sep: ' | ', auth: '[!]', trend: '[>]' },
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
// (so weekday names and messages need no language setting); anything else passes through —
// unless the tag is structurally invalid (hand-edited config), in which case every Intl
// formatter downstream would throw a RangeError, so fall back to the OS locale instead.
export function resolveLocale(locale, detect = detectSystemLocale) {
  if (locale && locale !== 'system' && locale !== 'auto') {
    try {
      Intl.getCanonicalLocales(locale);
      return locale;
    } catch {
      return detect();
    }
  }
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
function formatDate(d, locale, timeZone) {
  return new Intl.DateTimeFormat(locale || undefined, { year: 'numeric', month: 'numeric', day: 'numeric', ...(timeZone ? { timeZone } : {}) })
    .formatToParts(d)
    .filter((p) => p.type === 'day' || p.type === 'month' || p.type === 'year')
    .map((p) => p.value)
    .join('/');
}

// Return a `YYYY-M-D` key for a date as it falls in the given zone (for same-day comparison).
function ymdInZone(d, timeZone) {
  const parts = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'numeric', day: 'numeric', timeZone }).formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

// Format the clock portion of a reset time as a locale-aware HH:MM (or h:MM AM/PM when hour12).
// When timeZone is set, render the wall-clock in that zone via Intl (deterministic across hosts);
// otherwise fall back to the host-zone getHours()/getMinutes() path.
function formatClock(d, locale, hour12, timeZone) {
  if (timeZone) {
    const opts = hour12
      ? { hour: 'numeric', minute: '2-digit', hour12: true, timeZone }
      : { hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone };
    return new Intl.DateTimeFormat(locale || undefined, opts).format(d);
  }
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
// h>0, m>0 -> "Hh Mm" (e.g. "2h13m"); h>0, m===0 -> "Hh" (e.g. "8h"); h===0 -> "Mm" (e.g. "13m" or "0m").
// Clamps to 0m when d is in the past.
function formatRelative(d, now, locale) {
  const mins = Math.max(0, Math.round((d - now) / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const word = getMessages(locale).relIn;
  const hPart = h ? `${h}h` : '';
  const mPart = (m || !h) ? `${m}m` : '';
  return `${word} ${hPart}${mPart}`;
}

export function formatReset(resetsAt, opts = {}) {
  const { now = new Date(), locale = undefined, hour12 = false, glyphs = GLYPHS.emoji, resetDisplay = 'clock', timeZone = undefined } = opts;
  if (!resetsAt) return '';
  const d = new Date(resetsAt);
  if (Number.isNaN(d.getTime())) return '';

  if (resetDisplay === 'relative') {
    return `${glyphs.arrow} ${formatRelative(d, now, locale)}`;
  }

  const time = formatClock(d, locale, hour12, timeZone);
  const weekdayOpts = { weekday: 'long', ...(timeZone ? { timeZone } : {}) };
  const sameDay = timeZone
    ? ymdInZone(d, timeZone) === ymdInZone(now, timeZone)
    : d.getFullYear() === now.getFullYear() &&
      d.getMonth() === now.getMonth() &&
      d.getDate() === now.getDate();

  if (resetDisplay === 'both') {
    const clockStr = sameDay ? time : `${d.toLocaleDateString(locale || undefined, weekdayOpts)} ${formatDate(d, locale, timeZone)} ${time}`;
    return `${glyphs.arrow} ${clockStr} (${formatRelative(d, now, locale)})`;
  }

  // resetDisplay === 'clock' (default)
  if (sameDay) return `${glyphs.arrow} ${time}`;
  const weekday = d.toLocaleDateString(locale || undefined, weekdayOpts);
  const date = formatDate(d, locale, timeZone);
  return `${glyphs.arrow} ${weekday} ${date} ${time}`;
}

export function formatLimit(label, limit, threshold, opts = {}) {
  const { now = new Date(), locale = undefined, hour12 = false, glyphs = GLYPHS.emoji, warnBand = WARN_BAND, resetDisplay = 'clock', timeZone = undefined } = opts;
  if (!limit || limit.utilization == null) return `${glyphs.unknown} ${label} ?`;
  const pct = Math.round(limit.utilization);
  const emoji = bandEmoji(limit.utilization, threshold, glyphs, warnBand);
  const reset = formatReset(limit.resets_at, { now, locale, hour12, glyphs, resetDisplay, timeZone });
  return `${emoji} ${label} ${pct}%${reset ? ' ' + reset : ''}`;
}

// Compact duration like "1h40m" / "8m" / "2h" (no leading word). Clamps to 0m.
function formatDuration(mins) {
  const total = Math.max(0, Math.round(mins));
  const h = Math.floor(total / 60);
  const m = total % 60;
  const hPart = h ? `${h}h` : '';
  const mPart = (m || !h) ? `${m}m` : '';
  return `${hPart}${mPart}`;
}

// Burn-rate projection segment: "📈 ~1h40m to 90%" (en) / "📈 ~1h40m do 90%" (cs).
// `minutes` null (no usable projection) renders nothing.
export function formatProjection(minutes, threshold, opts = {}) {
  const { locale = undefined, glyphs = GLYPHS.emoji } = opts;
  if (minutes == null) return '';
  const word = getMessages(locale).toThreshold;
  return `${glyphs.trend} ~${formatDuration(minutes)} ${word} ${Math.round(threshold)}%`;
}

export function formatStatusLine(usage, threshold, watch, opts = {}) {
  const { now = new Date(), locale = undefined, hour12 = false, glyphs = GLYPHS.emoji, warnBand = WARN_BAND, labelStyle = 'full', resetDisplay = 'clock', thresholdOverrides = {}, projectionDisplay = 'off', projection = null, timeZone = undefined } = opts;
  const m = getMessages(locale);
  if (usage && usage.authError) return `${glyphs.auth} ${m.signIn}`;
  if (!usage) return `${glyphs.unknown} limit ?`;
  const labels = labelStyle === 'short' ? m.labelsShort : m.labels;
  const parts = [];
  for (const key of watch) {
    if (labels[key]) {
      // Use per-window threshold when set; fall back to the global threshold.
      const effThreshold = thresholdOverrides[key] ?? threshold;
      parts.push(formatLimit(labels[key], usage[key], effThreshold, { now, locale, hour12, glyphs, warnBand, resetDisplay, timeZone }));
    }
  }
  if (projectionDisplay === 'on' && projection && projection.minutes != null && parts.length) {
    parts.push(formatProjection(projection.minutes, projection.threshold, { locale, glyphs }));
  }
  return parts.length ? parts.join(glyphs.sep) : `${glyphs.unknown} limit ?`;
}
