#!/usr/bin/env node
// Powers /limit-guard-stats: summarizes the rolling ~7-day usage log.
import { pathToFileURL } from 'node:url';
import { loadConfig } from '../lib/config.mjs';
import { readUsageLog, summarize, USAGE_LOG_PATH } from '../lib/usageLog.mjs';
import { resolveLocale } from '../lib/format.mjs';
import { getMessages } from '../lib/messages.mjs';

// Pure: render a summary object (from usageLog.summarize) as a localized multi-line string.
export function renderStats(summary, opts = {}) {
  const { locale } = opts;
  const m = getMessages(locale);
  if (!summary || !summary.count) {
    return [`=== ${m.statsHeader} ===`, m.statsNoData].join('\n');
  }
  const pct = (v) => (v != null ? Math.round(v) + '%' : '-');
  return [
    `=== ${m.statsHeader} ===`,
    `  ${m.statsReadings(summary.count)}`,
    `  ${m.statsPeakFiveHour(pct(summary.peakFiveHour))}`,
    `  ${m.statsPeakSevenDay(pct(summary.peakSevenDay))}`,
    `  ${m.statsResets(summary.resets)}`,
  ].join('\n');
}

function main() {
  const cfg = loadConfig(process.cwd());
  const locale = resolveLocale(cfg.locale);
  const summary = summarize(readUsageLog(USAGE_LOG_PATH), Date.now());
  process.stdout.write(renderStats(summary, { locale }) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (e) {
    process.stderr.write(`ERROR: ${e.message}\n`);
    process.exit(1);
  }
}
