import { getMessages } from './messages.mjs';

const WARN_BAND = 80;

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

// Resolve a time-format setting ('system' | '12' | '24') to a 12-hour boolean.
export function resolveHour12(timeFormat, detectHourCycle = detectSystemHourCycle) {
  if (timeFormat === '12') return true;
  if (timeFormat === '24') return false;
  const hc = detectHourCycle();
  return hc === 'h11' || hc === 'h12';
}

export function bandEmoji(util, threshold, glyphs = GLYPHS.emoji) {
  if (util == null) return glyphs.unknown;
  if (util >= threshold) return glyphs.red;
  if (util >= WARN_BAND) return glyphs.amber;
  return glyphs.green;
}

export function formatReset(resetsAt, now = new Date(), locale = undefined, hour12 = false, glyphs = GLYPHS.emoji) {
  if (!resetsAt) return '';
  const d = new Date(resetsAt);
  if (Number.isNaN(d.getTime())) return '';
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    if (hour12) {
      const t = new Intl.DateTimeFormat(locale || undefined, {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }).format(d);
      return `${glyphs.arrow}${t}`;
    }
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${glyphs.arrow}${hh}:${mm}`;
  }
  return `${glyphs.arrow}${d.toLocaleDateString(locale || undefined, { weekday: 'short' })}`;
}

export function formatLimit(label, limit, threshold, now = new Date(), locale = undefined, hour12 = false, glyphs = GLYPHS.emoji) {
  if (!limit || limit.utilization == null) return `${glyphs.unknown} ${label} ?`;
  const pct = Math.round(limit.utilization);
  const emoji = bandEmoji(limit.utilization, threshold, glyphs);
  const reset = formatReset(limit.resets_at, now, locale, hour12, glyphs);
  return `${emoji} ${label} ${pct}%${reset ? ' ' + reset : ''}`;
}

const LABELS = { five_hour: '5h', seven_day: '7d' };

export function formatStatusLine(usage, threshold, watch, now = new Date(), locale = undefined, hour12 = false, glyphs = GLYPHS.emoji) {
  if (usage && usage.authError) return `${glyphs.auth} ${getMessages(locale).signIn}`;
  if (!usage) return `${glyphs.unknown} limit ?`;
  const parts = [];
  for (const key of watch) {
    if (LABELS[key]) parts.push(formatLimit(LABELS[key], usage[key], threshold, now, locale, hour12, glyphs));
  }
  return parts.length ? parts.join(glyphs.sep) : `${glyphs.unknown} limit ?`;
}
