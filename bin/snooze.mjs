#!/usr/bin/env node
// Powers /limit-guard-snooze: temporarily suppress the guard/context directives until the
// next reset (or a 5h fallback). `--action set` snoozes; `--action clear` clears.
import { pathToFileURL } from 'node:url';
import { loadConfig } from '../lib/config.mjs';
import { CACHE_PATH } from '../lib/usage.mjs';
import { readCache } from '../lib/cache.mjs';
import { resolveLocale } from '../lib/format.mjs';
import { getMessages } from '../lib/messages.mjs';
import { setSnooze, clearSnooze } from '../lib/snoozeGuard.mjs';

// Soonest future reset (ms epoch) among the watched windows in the warm cache, or null.
// Accepts resets_at as an ISO string or an ms timestamp (both parse via Date).
export function soonestReset(usage, watch, now) {
  if (!usage) return null;
  let soonest = null;
  for (const key of watch) {
    const raw = usage[key]?.resets_at;
    if (raw == null) continue;
    const t = new Date(raw).getTime();
    if (Number.isNaN(t) || t <= now) continue;
    if (soonest == null || t < soonest) soonest = t;
  }
  return soonest;
}

function parseAction(argv) {
  const i = argv.indexOf('--action');
  return i >= 0 ? argv[i + 1] : 'set';
}

function main(argv = process.argv.slice(2)) {
  const cwd = process.cwd();
  const cfg = loadConfig(cwd);
  const locale = resolveLocale(cfg.locale);
  const m = getMessages(locale);

  if (parseAction(argv) === 'clear') {
    clearSnooze();
    process.stdout.write(m.snoozeCleared + '\n');
    return;
  }

  const now = Date.now();
  const usage = readCache(CACHE_PATH, Infinity);
  const until = soonestReset(usage, cfg.watch, now) ?? (now + 5 * 3600 * 1000);
  setSnooze(until);
  process.stdout.write(m.snoozeSet(new Date(until).toLocaleString(locale)) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (e) {
    process.stderr.write(`ERROR: ${e.message}\n`);
    process.exit(1);
  }
}
