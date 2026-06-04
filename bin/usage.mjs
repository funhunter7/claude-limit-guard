import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig as defaultLoadConfig } from '../lib/config.mjs';
import { getUsage as defaultGetUsage } from '../lib/usage.mjs';
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

  const usage = await getUsage();
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

// Extract the working directory from a Claude Code hook payload (JSON on stdin),
// preferring workspace.current_dir over a top-level cwd. Returns `fallback` on any
// missing field or malformed input. Pure/testable; the fd-0 read lives in the caller.
export function parseCwd(raw, fallback) {
  try {
    const j = JSON.parse(raw);
    return j?.workspace?.current_dir || j?.cwd || fallback;
  } catch {
    return fallback;
  }
}

// ---- real entrypoint (the fd-0 read itself is not exercised by unit tests) ----
function readCwdFromStdin() {
  if (process.stdin.isTTY) return process.cwd(); // no piped hook payload to read
  try {
    return parseCwd(readFileSync(0, 'utf8'), process.cwd()); // fd 0 = stdin
  } catch {
    return process.cwd();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] || '--statusline';
  const cwd = readCwdFromStdin();
  runCli(mode, cwd)
    .then((out) => process.stdout.write(out))
    .catch(() => process.stdout.write(mode === '--statusline' ? 'limit ?' : '{}'));
}
