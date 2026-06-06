#!/usr/bin/env node
// Powers /limit-guard-status: prints resolved config + a quick health snapshot.
import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { loadConfig } from '../lib/config.mjs';
import { getToken } from '../lib/credentials.mjs';
import { CACHE_PATH } from '../lib/usage.mjs';
import { globalSettingsPath } from '../lib/pluginSettings.mjs';
import { resolveLocale } from '../lib/format.mjs';
import { getMessages } from '../lib/messages.mjs';

// Pure: takes a resolved config object and a health snapshot, returns a
// localized multi-line diagnostic string. No I/O, no Date.now().
//
// cfg    – resolved config (from loadConfig)
// health – { tokenPresent: bool, cacheAgeMs: number|null, statusLineWired: bool }
export function renderStatus(cfg, health) {
  const locale = resolveLocale(cfg.locale);
  const m = getMessages(locale);

  const { tokenPresent, cacheAgeMs, statusLineWired } = health;

  // --- config section ---
  const configLines = [
    `  threshold: ${cfg.threshold}%`,
    `  watch: ${(cfg.watch ?? []).join(', ')}`,
    `  warnBand: ${cfg.warnBand != null ? cfg.warnBand + '%' : '-'}`,
    `  labelStyle: ${cfg.labelStyle ?? '-'}`,
    `  resetDisplay: ${cfg.resetDisplay ?? '-'}`,
    `  style: ${cfg.style ?? '-'}`,
    `  timeFormat: ${cfg.timeFormat ?? '-'}`,
    `  locale: ${cfg.locale ?? '-'}`,
    `  guardAction: ${cfg.guardAction ? JSON.stringify(cfg.guardAction) : `(${m.statusGuardActionDefault})`}`,
  ];

  // --- health section ---
  const tokenLine = tokenPresent ? m.statusTokenOk : m.statusTokenMissing;
  const cacheLine = cacheAgeMs == null
    ? m.statusCacheNone
    : m.statusCacheFresh(Math.round(cacheAgeMs / 1000));
  const statusLineLine = statusLineWired ? m.statusLineWired : m.statusLineNotWired;

  const healthLines = [
    `  ${tokenLine}`,
    `  ${cacheLine}`,
    `  ${statusLineLine}`,
  ];

  return [
    `=== ${m.statusHeader} ===`,
    '',
    `${m.statusConfig}:`,
    ...configLines,
    '',
    `${m.statusHealth}:`,
    ...healthLines,
  ].join('\n');
}

// Probe whether the status-line is wired to this plugin. Looks for a
// settings.json statusLine.command that references bin/usage.mjs. Best-effort;
// returns false on any error.
function probeStatusLineWired(env = process.env, readFile = readFileSync) {
  try {
    const raw = readFile(globalSettingsPath(env), 'utf8');
    const settings = JSON.parse(raw);
    const cmd = settings?.statusLine?.command;
    return typeof cmd === 'string' && cmd.includes('usage.mjs');
  } catch {
    return false;
  }
}

// Probe the cache age. Reads the raw cache file to get its `ts` field, then
// returns (now - ts) in ms. Returns null when the file is absent or malformed.
function probeCacheAge(cachePath = CACHE_PATH, now = Date.now(), readFile = readFileSync) {
  try {
    const obj = JSON.parse(readFile(cachePath, 'utf8'));
    if (typeof obj.ts !== 'number') return null;
    return Math.max(0, now - obj.ts);
  } catch {
    return null;
  }
}

function main() {
  const cwd = process.cwd();
  const cfg = loadConfig(cwd);

  const tokenPresent = getToken() !== null;
  const cacheAgeMs = probeCacheAge();
  const statusLineWired = probeStatusLineWired();

  const health = { tokenPresent, cacheAgeMs, statusLineWired };
  process.stdout.write(renderStatus(cfg, health) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (e) {
    process.stderr.write(`ERROR: ${e.message}\n`);
    process.exit(1);
  }
}
