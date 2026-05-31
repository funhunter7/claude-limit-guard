import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig as defaultLoadConfig } from '../lib/config.mjs';
import { getUsage as defaultGetUsage } from '../lib/usage.mjs';
import { formatStatusLine } from '../lib/format.mjs';
import { breachedLimits } from '../lib/threshold.mjs';

export async function runCli(mode, cwd, deps = {}) {
  const {
    loadConfig = defaultLoadConfig,
    getUsage = defaultGetUsage,
    handoffExists,
    now = () => new Date(),
  } = deps;

  const cfg = loadConfig(cwd);
  const handoffPath = join(cwd, cfg.handoff);
  const hoExists = handoffExists ? handoffExists() : existsSync(handoffPath);

  if (mode === '--resume-check') {
    if (!hoExists) return '{}';
    return JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext:
          `Nalezen handoff soubor ${cfg.handoff} z dřívější práce přerušené limitem. ` +
          `Nabídni uživateli navázat a přečti jej jako výchozí kontext.`,
      },
    });
  }

  const usage = await getUsage();
  const line = formatStatusLine(usage, cfg.threshold, cfg.watch, now(), cfg.locale);

  if (mode === '--statusline') return line;

  const breached = breachedLimits(usage, cfg.threshold, cfg.watch);

  if (mode === '--context') {
    let ctx = `Limit předplatného (claude-limit-guard): ${line}. Práh ${cfg.threshold}%.`;
    if (breached.length) {
      const action = cfg.guardAction
        ? cfg.guardAction
        : `Spusť guard rutinu: dokonči atomický krok, ulož handoff do ${cfg.handoff} ` +
          `(co hotovo, co zbývá, dotčené soubory, další kroky, čas resetu), ` +
          `oznam uživateli že může vypnout PC, přestaň brát nové úkoly. ` +
          `Pokud existuje .claude/limit-guard.md, řiď se jím.`;
      ctx += ` PŘEKROČEN PRÁH (${breached.join(', ')}). ${action}`;
    }
    return JSON.stringify({ hookSpecificOutput: { hookEventName: 'UserPromptSubmit', additionalContext: ctx } });
  }

  if (mode === '--stop') {
    if (breached.length && !hoExists) {
      const action = cfg.guardAction
        ? cfg.guardAction
        : `Nepřestávej — spusť guard rutinu: dokonči atomický krok, ulož handoff do ${cfg.handoff}, ` +
          `oznam uživateli že může vypnout PC. Řiď se .claude/limit-guard.md pokud existuje.`;
      return JSON.stringify({
        decision: 'block',
        reason: `claude-limit-guard: limit přes práh ${cfg.threshold}% (${breached.join(', ')}). ${action}`,
      });
    }
    return '{}';
  }

  return '{}';
}

// ---- real entrypoint (not exercised by unit tests) ----
function readCwdFromStdin() {
  if (process.stdin.isTTY) return process.cwd(); // no piped hook payload to read
  try {
    const raw = readFileSync(0, 'utf8'); // fd 0 = stdin
    const j = JSON.parse(raw);
    return j?.workspace?.current_dir || j?.cwd || process.cwd();
  } catch {
    return process.cwd();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const mode = process.argv[2] || '--statusline';
  const cwd = readCwdFromStdin();
  runCli(mode, cwd)
    .then((out) => process.stdout.write(out))
    .catch(() => process.stdout.write(mode === '--statusline' ? '⚪ limit ?' : '{}'));
}
