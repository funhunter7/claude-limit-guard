#!/usr/bin/env node
// Powers /limit-guard-status: prints resolved config + a quick health snapshot.
import { pathToFileURL } from 'node:url';
import { loadConfig } from '../lib/config.mjs';
import { readHistory, HISTORY_PATH } from '../lib/history.mjs';
import { resolveLocale } from '../lib/format.mjs';
import { getMessages } from '../lib/messages.mjs';
import { probeTokenPresent, probeStatusLineWired, probeCacheAge } from '../lib/health.mjs';

// Pure: takes a resolved config object and a health snapshot, returns a
// localized multi-line diagnostic string. No I/O, no Date.now().
//
// cfg    – resolved config (from loadConfig)
// health – { tokenPresent: bool, cacheAgeMs: number|null, statusLineWired: bool }
export function renderStatus(cfg, health) {
  const locale = resolveLocale(cfg.locale);
  const m = getMessages(locale);

  const { tokenPresent, cacheAgeMs, statusLineWired, historyCount } = health;

  const pct = (v) => (v != null ? v + '%' : '-');

  // --- config section ---
  const configLines = [
    `  threshold: ${cfg.threshold}%`,
    `  thresholdFiveHour: ${pct(cfg.thresholdFiveHour)}`,
    `  thresholdSevenDay: ${pct(cfg.thresholdSevenDay)}`,
    `  watch: ${(cfg.watch ?? []).join(', ')}`,
    `  warnBand: ${pct(cfg.warnBand)}`,
    `  labelStyle: ${cfg.labelStyle ?? '-'}`,
    `  resetDisplay: ${cfg.resetDisplay ?? '-'}`,
    `  projectionDisplay: ${cfg.projectionDisplay ?? '-'}`,
    `  style: ${cfg.style ?? '-'}`,
    `  timeFormat: ${cfg.timeFormat ?? '-'}`,
    `  locale: ${cfg.locale ?? '-'}`,
    `  guardAction: ${cfg.guardAction ? JSON.stringify(cfg.guardAction) : `(${m.statusGuardActionDefault})`}`,
    `  warnAction: ${cfg.warnAction ? JSON.stringify(cfg.warnAction) : `(${m.statusGuardActionDefault})`}`,
  ];

  // --- health section ---
  const tokenLine = tokenPresent ? m.statusTokenOk : m.statusTokenMissing;
  const cacheLine = cacheAgeMs == null
    ? m.statusCacheNone
    : m.statusCacheFresh(Math.round(cacheAgeMs / 1000));
  const statusLineLine = statusLineWired ? m.statusLineWired : m.statusLineNotWired;
  const historyLine = historyCount
    ? m.statusHistoryReadings(historyCount)
    : m.statusHistoryNone;

  const healthLines = [
    `  ${tokenLine}`,
    `  ${cacheLine}`,
    `  ${statusLineLine}`,
    `  ${historyLine}`,
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

function main() {
  const cwd = process.cwd();
  const cfg = loadConfig(cwd);

  const tokenPresent = probeTokenPresent();
  const cacheAgeMs = probeCacheAge();
  const statusLineWired = probeStatusLineWired();
  const historyCount = readHistory(HISTORY_PATH).length;

  const health = { tokenPresent, cacheAgeMs, statusLineWired, historyCount };
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
