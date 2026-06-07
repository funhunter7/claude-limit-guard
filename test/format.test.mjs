import { test } from 'node:test';
import assert from 'node:assert/strict';
import { bandEmoji } from '../lib/format.mjs';

test('bandEmoji: green below 80', () => {
  assert.equal(bandEmoji(0, 95), '🟢');
  assert.equal(bandEmoji(79.9, 95), '🟢');
});

test('bandEmoji: amber from 80 up to threshold', () => {
  assert.equal(bandEmoji(80, 95), '🟡');
  assert.equal(bandEmoji(94, 95), '🟡');
});

test('bandEmoji: red at or above threshold', () => {
  assert.equal(bandEmoji(95, 95), '🔴');
  assert.equal(bandEmoji(100, 95), '🔴');
});

test('bandEmoji: unknown utilization -> white', () => {
  assert.equal(bandEmoji(null, 95), '⚪');
  assert.equal(bandEmoji(undefined, 95), '⚪');
});

test('bandEmoji: custom warnBand moves the amber threshold', () => {
  // warnBand 60: 59 still green, 60 already amber
  assert.equal(bandEmoji(59, 95, GLYPHS.emoji, 60), '🟢');
  assert.equal(bandEmoji(60, 95, GLYPHS.emoji, 60), '🟡');
});

import { formatReset } from '../lib/format.mjs';

test('formatReset: same local day -> arrow + HH:MM', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset('2026-05-31T06:00:00+02:00', { now }), '→ 06:00');
});

test('formatReset: different day -> weekday + locale-ordered slash date with year + time', () => {
  const now = new Date('2026-05-31T01:00:00+02:00'); // Sunday
  const wed = '2026-06-03T10:00:00+02:00'; // Wednesday
  // US puts the month first; Europe the day first; both use slashes and include the year.
  assert.equal(formatReset(wed, { now, locale: 'en-US' }), '→ Wednesday 6/3/2026 10:00');
  assert.equal(formatReset(wed, { now, locale: 'cs-CZ' }), '→ středa 3/6/2026 10:00');
  assert.equal(formatReset(wed, { now, locale: 'de-DE' }), '→ Mittwoch 3/6/2026 10:00');
});

test('formatReset: different day -> Japanese keeps year/month/day order', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  const wed = '2026-06-03T10:00:00+02:00';
  assert.equal(formatReset(wed, { now, locale: 'ja-JP' }), '→ 水曜日 2026/6/3 10:00');
});

test('formatReset: different day -> system default weekday + slash date + time', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  const wed = '2026-06-03T10:00:00+02:00';
  const weekday = new Date(wed).toLocaleDateString(undefined, { weekday: 'long' });
  const date = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(new Date(wed))
    .filter((p) => ['day', 'month', 'year'].includes(p.type))
    .map((p) => p.value)
    .join('/');
  assert.equal(formatReset(wed, { now }), `→ ${weekday} ${date} 10:00`);
});

test('formatReset: different day with 12h -> weekday + slash date + AM/PM time', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  const wed = '2026-06-03T17:00:00+02:00';
  assert.equal(formatReset(wed, { now, locale: 'en-US', hour12: true }).replace(/ /g, ' '), '→ Wednesday 6/3/2026 5:00 PM');
});

test('formatReset: missing/invalid -> empty string', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset(null, { now }), '');
  assert.equal(formatReset('not-a-date', { now }), '');
});

import { formatLimit, formatStatusLine, formatProjection } from '../lib/format.mjs';
import { readFileSync } from 'node:fs';

const SAMPLE = JSON.parse(readFileSync(new URL('./fixtures/usage-sample.json', import.meta.url)));
const NOW = new Date('2026-05-31T01:00:00+02:00');

test('formatLimit: emoji + label + rounded pct + reset', () => {
  assert.equal(formatLimit('5h', SAMPLE.five_hour, 95, { now: NOW }), '🟢 5h 72% → 06:00');
});

test('formatLimit: unknown limit -> white placeholder', () => {
  assert.equal(formatLimit('5h', null, 95, { now: NOW }), '⚪ 5h ?');
  assert.equal(formatLimit('7d', { utilization: null }, 95, { now: NOW }), '⚪ 7d ?');
});

test('formatStatusLine: both limits joined by middot', () => {
  assert.equal(
    formatStatusLine(SAMPLE, 95, ['five_hour', 'seven_day'], { now: NOW, locale: 'en-US' }),
    '🟢 Limit session: 72% → 06:00 · 🟢 Week Limit: 39% → Wednesday 6/3/2026 10:00'
  );
});

test('formatStatusLine: locale switches weekday language', () => {
  assert.equal(
    formatStatusLine(SAMPLE, 95, ['seven_day'], { now: NOW, locale: 'de-DE' }),
    '🟢 Week Limit: 39% → Mittwoch 3/6/2026 10:00'
  );
});

test('formatStatusLine: labels localize by locale (Czech for cs, English fallback)', () => {
  const cs = formatStatusLine(SAMPLE, 95, ['five_hour', 'seven_day'], { now: NOW, locale: 'cs-CZ' });
  assert.match(cs, /🟢 Limit relace: 72% .* · 🟢 Týdenní limit: 39%/);
  // de has no message set -> labels fall back to English
  assert.match(formatStatusLine(SAMPLE, 95, ['five_hour'], { now: NOW, locale: 'de-DE' }), /🟢 Limit session: 72%/);
});

test('formatStatusLine: respects watch list', () => {
  assert.equal(formatStatusLine(SAMPLE, 95, ['five_hour'], { now: NOW }), '🟢 Limit session: 72% → 06:00');
});

test('formatStatusLine: null usage -> placeholder', () => {
  assert.equal(formatStatusLine(null, 95, ['five_hour', 'seven_day'], { now: NOW }), '⚪ limit ?');
});

import { resolveHour12 } from '../lib/format.mjs';

test('resolveHour12: explicit 12 -> true, 24 -> false', () => {
  assert.equal(resolveHour12('12'), true);
  assert.equal(resolveHour12('24'), false);
});

test('resolveHour12: system uses injected detector', () => {
  assert.equal(resolveHour12('system', () => 'h12'), true);
  assert.equal(resolveHour12('system', () => 'h11'), true);
  assert.equal(resolveHour12('system', () => 'h23'), false);
  assert.equal(resolveHour12('system', () => 'h24'), false);
});

test('resolveHour12: unknown value treated as system', () => {
  assert.equal(resolveHour12(undefined, () => 'h12'), true);
});

test('formatReset: 12h same-day -> localized AM/PM', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  const out = formatReset('2026-05-31T17:00:00+02:00', { now, locale: 'en-US', hour12: true });
  assert.equal(out.replace(/ /g, ' '), '→ 5:00 PM');
});

test('formatReset: 12h respects locale wording', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  const out = formatReset('2026-05-31T17:00:00+02:00', { now, locale: 'cs-CZ', hour12: true });
  assert.match(out, /odp\./);
  assert.match(out, /5:00/);
});

test('formatReset: 12h noon -> 12:00 PM', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  const noon = formatReset('2026-05-31T12:00:00+02:00', { now, locale: 'en-US', hour12: true });
  assert.match(noon.replace(/ /g, ' '), /12:00 PM/);
});

test('formatReset: hour12 defaults false -> 24h unchanged', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset('2026-05-31T17:00:00+02:00', { now, locale: 'en-US' }), '→ 17:00');
});

test('formatStatusLine: hour12 true switches same-day time to 12h', () => {
  const sample = { five_hour: { utilization: 72, resets_at: '2026-05-31T17:00:00+02:00' } };
  const now = new Date('2026-05-31T01:00:00+02:00');
  const out = formatStatusLine(sample, 95, ['five_hour'], { now, locale: 'en-US', hour12: true });
  assert.match(out.replace(/ /g, ' '), /🟢 Limit session: 72% → 5:00 PM/);
});

import { resolveLocale } from '../lib/format.mjs';

test('resolveLocale: system -> OS default locale from detector', () => {
  assert.equal(resolveLocale('system', () => 'cs-CZ'), 'cs-CZ');
});

test('resolveLocale: auto/empty/undefined -> OS default locale', () => {
  assert.equal(resolveLocale('auto', () => 'en-GB'), 'en-GB');
  assert.equal(resolveLocale('', () => 'en-GB'), 'en-GB');
  assert.equal(resolveLocale(undefined, () => 'en-GB'), 'en-GB');
});

test('resolveLocale: explicit locale passes through (detector not used)', () => {
  assert.equal(resolveLocale('de-DE', () => 'cs-CZ'), 'de-DE');
});

import { GLYPHS, resolveStyle } from '../lib/format.mjs';

test('resolveStyle: explicit emoji/ascii', () => {
  assert.equal(resolveStyle('emoji', {}, 'win32'), GLYPHS.emoji);
  assert.equal(resolveStyle('ascii', {}, 'linux'), GLYPHS.ascii);
});

test('resolveStyle: auto on non-windows -> emoji', () => {
  assert.equal(resolveStyle('auto', {}, 'linux'), GLYPHS.emoji);
});

test('resolveStyle: auto on windows conhost -> ascii', () => {
  assert.equal(resolveStyle('auto', {}, 'win32'), GLYPHS.ascii);
});

test('resolveStyle: auto on windows terminal/vscode -> emoji', () => {
  assert.equal(resolveStyle('auto', { WT_SESSION: '1' }, 'win32'), GLYPHS.emoji);
  assert.equal(resolveStyle('auto', { TERM_PROGRAM: 'vscode' }, 'win32'), GLYPHS.emoji);
});

test('formatStatusLine: authError -> key glyph + localized sign-in', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatStatusLine({ authError: 'no-token' }, 95, ['five_hour'], { now, locale: 'en-US' }), '🔑 sign in');
  assert.equal(formatStatusLine({ authError: 'expired' }, 95, ['five_hour'], { now, locale: 'cs-CZ' }), '🔑 přihlas se');
});

test('formatStatusLine: ascii glyphs render plain', () => {
  const sample = { five_hour: { utilization: 72, resets_at: '2026-05-31T06:00:00+02:00' },
                   seven_day: { utilization: 39, resets_at: '2026-06-03T10:00:00+02:00' } };
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(
    formatStatusLine(sample, 95, ['five_hour', 'seven_day'], { now, locale: 'en-US', hour12: false, glyphs: GLYPHS.ascii }),
    '[OK] Limit session: 72% -> 06:00 | [OK] Week Limit: 39% -> Wednesday 6/3/2026 10:00'
  );
});

test('formatStatusLine: ascii authError', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatStatusLine({ authError: 'no-token' }, 95, ['five_hour'], { now, locale: 'en-US', hour12: false, glyphs: GLYPHS.ascii }), '[!] sign in');
});

test('formatStatusLine: label_style short uses 5h/7d', () => {
  assert.equal(
    formatStatusLine(SAMPLE, 95, ['five_hour', 'seven_day'], { now: NOW, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, warnBand: 80, labelStyle: 'short' }),
    '🟢 5h 72% → 06:00 · 🟢 7d 39% → Wednesday 6/3/2026 10:00'
  );
});

test('formatStatusLine: label_style short uses cs short labels', () => {
  assert.equal(
    formatStatusLine(SAMPLE, 95, ['five_hour', 'seven_day'], { now: NOW, locale: 'cs-CZ', hour12: false, glyphs: GLYPHS.emoji, warnBand: 80, labelStyle: 'short' }),
    '🟢 5h 72% → 06:00 · 🟢 7d 39% → středa 3/6/2026 10:00'
  );
});

test('formatStatusLine: label_style full (default) unchanged', () => {
  assert.equal(
    formatStatusLine(SAMPLE, 95, ['five_hour', 'seven_day'], { now: NOW, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, warnBand: 80, labelStyle: 'full' }),
    '🟢 Limit session: 72% → 06:00 · 🟢 Week Limit: 39% → Wednesday 6/3/2026 10:00'
  );
});

// --- reset_display ---

test('formatReset: mode=relative -> arrow + relIn + Hh Mm (en)', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset('2026-05-31T03:13:00+02:00', { now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, resetDisplay: 'relative' }), '→ in 2h13m');
});

test('formatReset: mode=relative cs wording', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset('2026-05-31T03:13:00+02:00', { now, locale: 'cs-CZ', hour12: false, glyphs: GLYPHS.emoji, resetDisplay: 'relative' }), '→ za 2h13m');
});

test('formatReset: mode=relative only minutes (no hour part)', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset('2026-05-31T01:13:00+02:00', { now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, resetDisplay: 'relative' }), '→ in 13m');
});

test('formatReset: mode=relative in the past -> 0m', () => {
  const now = new Date('2026-05-31T03:00:00+02:00');
  assert.equal(formatReset('2026-05-31T01:00:00+02:00', { now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, resetDisplay: 'relative' }), '→ in 0m');
});

test('formatReset: mode=relative exactly now -> 0m', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset('2026-05-31T01:00:00+02:00', { now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, resetDisplay: 'relative' }), '→ in 0m');
});

test('formatReset: mode=relative exactly 60 minutes -> 1h (no trailing 0m)', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset('2026-05-31T02:00:00+02:00', { now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, resetDisplay: 'relative' }), '→ in 1h');
});

test('formatReset: mode=relative 61 minutes -> 1h1m', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset('2026-05-31T02:01:00+02:00', { now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, resetDisplay: 'relative' }), '→ in 1h1m');
});

test('formatReset: mode=both -> clock (relative) en', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset('2026-05-31T03:13:00+02:00', { now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, resetDisplay: 'both' }), '→ 03:13 (in 2h13m)');
});

test('formatReset: mode=both cs wording', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset('2026-05-31T03:13:00+02:00', { now, locale: 'cs-CZ', hour12: false, glyphs: GLYPHS.emoji, resetDisplay: 'both' }), '→ 03:13 (za 2h13m)');
});

test('formatReset: mode=both cross-day -> weekday + date + time + (relative) en', () => {
  // now=2026-05-31 01:00 CEST, reset=2026-06-03 10:00 CEST (Wednesday, different day)
  // diff = 4860 min = 81h exactly -> after fix: "in 81h" (no trailing 0m)
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(
    formatReset('2026-06-03T10:00:00+02:00', { now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, resetDisplay: 'both' }),
    '→ Wednesday 6/3/2026 10:00 (in 81h)'
  );
});

test('formatReset: mode=clock (default, explicit) -> unchanged behavior', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  assert.equal(formatReset('2026-05-31T06:00:00+02:00', { now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, resetDisplay: 'clock' }), '→ 06:00');
});

test('formatStatusLine: reset_display=relative threads through', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  const sample = { five_hour: { utilization: 72, resets_at: '2026-05-31T03:13:00+02:00' } };
  assert.equal(
    formatStatusLine(sample, 95, ['five_hour'], { now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, warnBand: 80, labelStyle: 'full', resetDisplay: 'relative' }),
    '🟢 Limit session: 72% → in 2h13m'
  );
});

test('formatStatusLine: reset_display=both threads through', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  const sample = { five_hour: { utilization: 72, resets_at: '2026-05-31T03:13:00+02:00' } };
  assert.equal(
    formatStatusLine(sample, 95, ['five_hour'], { now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, warnBand: 80, labelStyle: 'full', resetDisplay: 'both' }),
    '🟢 Limit session: 72% → 03:13 (in 2h13m)'
  );
});

// --- per-window thresholdOverrides color tests ---

test('formatStatusLine: thresholdOverrides five_hour=80 -> 85% renders RED', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  const sample = { five_hour: { utilization: 85, resets_at: '2026-05-31T06:00:00+02:00' } };
  const out = formatStatusLine(sample, 95, ['five_hour'], {
    now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, warnBand: 80,
    thresholdOverrides: { five_hour: 80 },
  });
  assert.match(out, /^🔴/, 'expected red glyph when per-window threshold 80 and util 85');
});

test('formatStatusLine: without override the same 85% renders amber (not red) vs global 95', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  const sample = { five_hour: { utilization: 85, resets_at: '2026-05-31T06:00:00+02:00' } };
  const out = formatStatusLine(sample, 95, ['five_hour'], {
    now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, warnBand: 80,
  });
  assert.match(out, /^🟡/, 'expected amber glyph at 85% with global threshold 95');
});

test('formatStatusLine: thresholdOverrides only affects the targeted window', () => {
  const now = new Date('2026-05-31T01:00:00+02:00');
  const sample = {
    five_hour: { utilization: 85, resets_at: '2026-05-31T06:00:00+02:00' },
    seven_day: { utilization: 85, resets_at: '2026-06-03T10:00:00+02:00' },
  };
  const out = formatStatusLine(sample, 95, ['five_hour', 'seven_day'], {
    now, locale: 'en-US', hour12: false, glyphs: GLYPHS.emoji, warnBand: 80,
    thresholdOverrides: { five_hour: 80 },
  });
  // five_hour uses override 80 -> 85 >= 80 -> red; seven_day uses global 95 -> 85 < 95 -> amber
  assert.match(out, /^🔴/, 'five_hour should be red');
  assert.match(out, /🟡 Week Limit/, 'seven_day should be amber');
});

test('formatProjection: minutes+threshold -> trend segment (en)', () => {
  assert.equal(formatProjection(100, 90, { locale: 'en-US' }), '📈 ~1h40m to 90%');
  assert.equal(formatProjection(8, 90, { locale: 'en-US' }), '📈 ~8m to 90%');
  assert.equal(formatProjection(120, 80, { locale: 'en-US' }), '📈 ~2h to 80%');
});

test('formatProjection: cs uses "do"', () => {
  assert.equal(formatProjection(100, 90, { locale: 'cs-CZ' }), '📈 ~1h40m do 90%');
});

test('formatProjection: null minutes -> empty string', () => {
  assert.equal(formatProjection(null, 90, { locale: 'en-US' }), '');
});

test('formatStatusLine: projection on appends trend segment', () => {
  const line = formatStatusLine(SAMPLE, 95, ['five_hour', 'seven_day'], {
    now: NOW, locale: 'en-US', projectionDisplay: 'on', projection: { minutes: 100, threshold: 90 },
  });
  assert.match(line, /📈 ~1h40m to 90%$/);
});

test('formatStatusLine: projection off (default) omits trend segment', () => {
  const line = formatStatusLine(SAMPLE, 95, ['five_hour', 'seven_day'], {
    now: NOW, locale: 'en-US', projection: { minutes: 100, threshold: 90 },
  });
  assert.doesNotMatch(line, /📈/);
});

test('formatStatusLine: per-model opus/sonnet windows render with their labels', () => {
  const u = {
    seven_day_opus: { utilization: 50, resets_at: '2026-06-03T10:00:00+02:00' },
    seven_day_sonnet: { utilization: 12, resets_at: '2026-06-03T10:00:00+02:00' },
  };
  const en = formatStatusLine(u, 95, ['seven_day_opus', 'seven_day_sonnet'], { now: NOW, locale: 'en-US' });
  assert.match(en, /Week Opus: 50%/);
  assert.match(en, /Week Sonnet: 12%/);
  const csShort = formatStatusLine(u, 95, ['seven_day_opus'], { now: NOW, locale: 'cs-CZ', labelStyle: 'short' });
  assert.match(csShort, /7dO 50%/);
});
