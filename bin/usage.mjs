import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig as defaultLoadConfig } from '../lib/config.mjs';
import { getUsage as defaultGetUsage, CACHE_PATH } from '../lib/usage.mjs';
import { writeCache as defaultWriteCache } from '../lib/cache.mjs';
import { coversWatched, usageFromRateLimits } from '../lib/stdinUsage.mjs';
import { formatStatusLine, resolveHour12, resolveStyle } from '../lib/format.mjs';
import { breachedLimits } from '../lib/threshold.mjs';
import { getMessages } from '../lib/messages.mjs';
import { shouldBlockStop as defaultShouldBlockStop } from '../lib/stopGuard.mjs';

export async function runCli(mode, cwd, deps = {}) {
  const {
    loadConfig = defaultLoadConfig,
    getUsage = defaultGetUsage,
    handoffExists,
    shouldBlockStop = defaultShouldBlockStop,
    now = () => new Date(),
    stdinUsage = null,
    writeCache = defaultWriteCache,
    cachePath = CACHE_PATH,
  } = deps;

  const cfg = loadConfig(cwd);
  const m = getMessages(cfg.locale);
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

  // Hot path: the --statusline invocation receives native rate_limits on stdin. When the
  // mapped data covers every watched window, use it directly (no network) and write it
  // through to the shared cache so the hooks (--stop/--context) read warm data too.
  // Any gap (absent/garbage window, API-key user, pre-first-response) falls back to getUsage().
  let usage;
  if (mode === '--statusline' && coversWatched(stdinUsage, cfg.watch)) {
    writeCache(cachePath, stdinUsage);
    usage = stdinUsage;
  } else {
    usage = await getUsage();
  }
  const glyphs = resolveStyle(cfg.style);
  const hour12 = resolveHour12(cfg.timeFormat);
  const line = formatStatusLine(usage, cfg.threshold, cfg.watch, now(), cfg.locale, hour12, glyphs, cfg.warnBand);

  if (mode === '--statusline') return line;

  const breached = breachedLimits(usage, cfg.threshold, cfg.watch);

  if (mode === '--context') {
    let ctx = m.contextLabel(line, cfg.threshold);
    if (breached.length) {
      const action = cfg.guardAction || m.contextAction(cfg.handoff);
      ctx += ' ' + m.breach(breached.join(', '), action);
    }
    return JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: ctx } });
  }

  if (mode === '--stop') {
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
