import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig as defaultLoadConfig } from '../lib/config.mjs';
import { getUsage as defaultGetUsage, CACHE_PATH } from '../lib/usage.mjs';
import { writeCache as defaultWriteCache } from '../lib/cache.mjs';
import { appendReading as defaultAppendReading, readHistory as defaultReadHistory, projectMinutesToThreshold, HISTORY_PATH, HISTORY_MIN_INTERVAL_MS } from '../lib/history.mjs';
import { appendUsage as defaultAppendUsage, USAGE_LOG_PATH } from '../lib/usageLog.mjs';
import { coversWatched, usageFromRateLimits, watchedExpired } from '../lib/stdinUsage.mjs';
import { formatStatusLine, resolveHour12, resolveStyle, resolveLocale } from '../lib/format.mjs';
import { breachedLimits, warnedLimits } from '../lib/threshold.mjs';
import { getMessages } from '../lib/messages.mjs';
import { shouldBlockStop as defaultShouldBlockStop } from '../lib/stopGuard.mjs';
import { notify as defaultNotify } from '../lib/notify.mjs';
import { shouldNotify as defaultShouldNotify } from '../lib/notifyGuard.mjs';
import { snoozeUntil as defaultSnoozeUntil } from '../lib/snoozeGuard.mjs';

export async function runCli(mode, cwd, deps = {}) {
  const {
    loadConfig = defaultLoadConfig,
    getUsage = defaultGetUsage,
    handoffExists,
    shouldBlockStop = defaultShouldBlockStop,
    now = () => new Date(),
    // Already mapped to the internal usage shape via usageFromRateLimits — NOT the raw
    // rate_limits block. Passing raw rate_limits here would silently miss the fast-path.
    stdinUsage = null,
    writeCache = defaultWriteCache,
    cachePath = CACHE_PATH,
    appendReading = defaultAppendReading,
    readHistory = defaultReadHistory,
    historyPath = HISTORY_PATH,
    notify = defaultNotify,
    shouldNotify = defaultShouldNotify,
    appendUsage = defaultAppendUsage,
    usageLogPath = USAGE_LOG_PATH,
    snoozeUntil = defaultSnoozeUntil,
  } = deps;

  const cfg = loadConfig(cwd);
  // 'system'/'auto' (the default) follows the OS locale for both weekday/date rendering
  // and message language — so the user needn't set a language. Works on Windows and Linux.
  const locale = resolveLocale(cfg.locale);
  const m = getMessages(locale);
  // Only --resume-check and --stop care whether a handoff already exists; compute lazily
  // so the per-keystroke --statusline/--context paths skip the filesystem stat.
  const hoExists = () => (handoffExists ? handoffExists() : existsSync(join(cwd, cfg.handoff)));

  if (mode === '--resume-check') {
    if (!hoExists()) return '{}';
    return JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: m.resume(cfg.handoff),
      },
    });
  }

  const nowDate = now();
  const nowMs = nowDate.getTime();

  // Hot path: the --statusline invocation receives native rate_limits on stdin. When the
  // mapped data covers every watched window AND has not passed its reset, use it directly
  // (no network) and write it through to the shared cache so the hooks (--stop/--context)
  // read warm data too. Once a watched window's reset time passes, the stdin/cache value is
  // stale (Claude Code only refreshes rate_limits after an API response), so we fall back to
  // getUsage() — the OAuth poll — to fetch the fresh post-reset value. Any other gap
  // (absent/garbage window, API-key user, pre-first-response) also falls back to getUsage().
  let usage;
  if (mode === '--statusline'
      && coversWatched(stdinUsage, cfg.watch)
      && !watchedExpired(stdinUsage, cfg.watch, nowMs)) {
    usage = stdinUsage;
    writeCache(cachePath, stdinUsage); // fire-and-forget; the real writeCache never throws
  } else {
    usage = await getUsage(cachePath, { nowMs, watch: cfg.watch });
  }
  const glyphs = resolveStyle(cfg.style);
  const hour12 = resolveHour12(cfg.timeFormat);
  // When snoozed (/limit-guard-snooze), suppress the guard/context directives until the
  // snooze expires. The status line and notifications are unaffected.
  const snoozed = snoozeUntil(nowMs) != null;

  // Build per-window threshold overrides from config (only set when non-null).
  const overrides = {};
  if (cfg.thresholdFiveHour != null) overrides.five_hour = cfg.thresholdFiveHour;
  if (cfg.thresholdSevenDay != null) overrides.seven_day = cfg.thresholdSevenDay;

  // Burn-rate history: record one reading per status-line render (fire-and-forget, like the
  // cache write) so the projection has a trend to fit. Only the status line writes history.
  // When notifications are on, snapshot the prior readings BEFORE appending this render's
  // reading, so reset detection compares the current value against history rather than the
  // value we just wrote.
  let prevByKey = null;
  if (mode === '--statusline' && usage && !usage.authError) {
    if (cfg.notifications === 'on') {
      prevByKey = {};
      for (const r of readHistory(historyPath)) {
        for (const key of cfg.watch) if (typeof r[key] === 'number') prevByKey[key] = r[key];
      }
    }
    const reading = { ts: nowMs };
    for (const key of cfg.watch) {
      const u = usage[key]?.utilization;
      if (typeof u === 'number') reading[key] = u;
    }
    appendReading(historyPath, reading, 30, { minIntervalMs: HISTORY_MIN_INTERVAL_MS }); // never throws; throttled to 1/min
    appendUsage(usageLogPath, reading, nowMs); // long-lived ~7-day stats log; throttled to 1/min
  }

  // Optional projection (opt-in): minutes until the soonest watched window hits its
  // effective threshold, from a least-squares fit of recent readings.
  let projection = null;
  if (cfg.projectionDisplay === 'on') {
    const history = readHistory(historyPath);
    for (const key of cfg.watch) {
      const th = overrides[key] ?? cfg.threshold;
      const mins = projectMinutesToThreshold(history, key, th, nowMs);
      if (mins != null && (projection == null || mins < projection.minutes)) projection = { minutes: mins, threshold: th };
    }
  }

  const line = formatStatusLine(usage, cfg.threshold, cfg.watch, { now: nowDate, locale, hour12, glyphs, warnBand: cfg.warnBand, labelStyle: cfg.labelStyle, resetDisplay: cfg.resetDisplay, thresholdOverrides: overrides, projectionDisplay: cfg.projectionDisplay, projection });

  if (mode === '--statusline') {
    // Fire a desktop notification once per crossing (keyed cwd|window|resets_at|band) when
    // enabled. The status line is the freshest, most frequent caller; gating by shouldNotify
    // keeps it to one toast per crossing rather than one per render. All best-effort.
    if (cfg.notifications === 'on' && usage && !usage.authError) {
      // Reset toast: a watched window dropping sharply versus its prior reading means the
      // window rolled over (e.g. 88% -> 5%). One-shot per (cwd|window|new resets_at).
      for (const key of cfg.watch) {
        const cur = usage[key]?.utilization;
        const prev = prevByKey?.[key];
        if (typeof cur === 'number' && typeof prev === 'number' && cur < prev - 15) {
          if (shouldNotify(`${cwd}|${key}|${usage[key]?.resets_at || ''}|reset`)) notify(m.notifyTitle, m.notifyReset(key));
        }
      }
      const breachedNow = breachedLimits(usage, cfg.threshold, cfg.watch, overrides);
      const warnedNow = warnedLimits(usage, cfg.warnBand, cfg.threshold, cfg.watch, overrides);
      for (const key of breachedNow) {
        if (shouldNotify(`${cwd}|${key}|${usage[key]?.resets_at || ''}|breach`)) notify(m.notifyTitle, m.notifyBreach(key));
      }
      for (const key of warnedNow) {
        if (shouldNotify(`${cwd}|${key}|${usage[key]?.resets_at || ''}|warn`)) notify(m.notifyTitle, m.notifyWarn(key));
      }
    }
    return line;
  }

  const breached = breachedLimits(usage, cfg.threshold, cfg.watch, overrides);

  if (mode === '--context') {
    let ctx = m.contextLabel(line, cfg.threshold);
    if (!snoozed) {
      if (breached.length) {
        const action = cfg.guardAction || m.contextAction(cfg.handoff);
        ctx += ' ' + m.breach(breached.join(', '), action);
      } else {
        // Pass the same per-window overrides so the warn band's upper bound matches each
        // window's effective threshold (a looser per-window threshold still warns up to it).
        const warned = warnedLimits(usage, cfg.warnBand, cfg.threshold, cfg.watch, overrides);
        if (warned.length) {
          const action = cfg.warnAction || m.warnAction;
          ctx += ' ' + m.warn(warned.join(', '), action);
        }
      }
    }
    return JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: ctx } });
  }

  if (mode === '--stop') {
    if (snoozed) return '{}';
    if (breached.length && !hoExists()) {
      // Scope the one-shot marker to this project so blocking in one project does not
      // suppress the guard in another that breaches in the same reset window.
      const windowKey = `${cwd}|${usage[breached[0]]?.resets_at || ''}`;
      if (!shouldBlockStop(windowKey)) return '{}';
      const action = cfg.guardAction || m.stopAction(cfg.handoff);
      return JSON.stringify({
        decision: 'block',
        reason: m.stopReason(cfg.threshold, breached.join(', '), action),
      });
    }
    return '{}';
  }

  return '{}';
}

// Parse a Claude Code stdin payload once, extracting both the working directory and the
// native rate_limits block. Returns safe defaults on missing fields or malformed input.
export function parseStdin(raw, fallback) {
  try {
    const j = JSON.parse(raw);
    return {
      cwd: j?.workspace?.current_dir || j?.cwd || fallback,
      rateLimits: j?.rate_limits,
    };
  } catch {
    return { cwd: fallback, rateLimits: undefined };
  }
}

// Back-compat thin wrapper: the cwd-only extraction used by callers that don't need limits.
export function parseCwd(raw, fallback) {
  return parseStdin(raw, fallback).cwd;
}

// ---- real entrypoint (the fd-0 read itself is not exercised by unit tests) ----
function readStdin() {
  if (process.stdin.isTTY) return { cwd: process.cwd(), rateLimits: undefined };
  try {
    return parseStdin(readFileSync(0, 'utf8'), process.cwd()); // fd 0 = stdin
  } catch {
    return { cwd: process.cwd(), rateLimits: undefined };
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] || '--statusline';
  const { cwd, rateLimits } = readStdin();
  const stdinUsage = usageFromRateLimits(rateLimits);
  runCli(mode, cwd, { stdinUsage })
    .then((out) => process.stdout.write(out))
    .catch(() => process.stdout.write(mode === '--statusline' ? 'limit ?' : '{}'));
}
