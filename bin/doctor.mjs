#!/usr/bin/env node
// Powers /limit-guard-doctor: runs a handful of self-checks and prints a localized report.
import { readFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { dirname, join } from 'node:path';
import { loadConfig } from '../lib/config.mjs';
import { resolveLocale } from '../lib/format.mjs';
import { getMessages } from '../lib/messages.mjs';
import { probeTokenPresent, probeStatusLineWired, probeCacheAge } from '../lib/health.mjs';

// Pure renderer: takes an array of { key, ok, hint?, note? } checks and a locale, returns a
// localized multi-line report. ✅ for ok, ❌ for not-ok (with an indented hint), and a neutral
// line carrying a (note) when a check could not be determined.
export function renderDoctor(checks, opts = {}) {
  const m = getMessages(resolveLocale(opts.locale));
  const lines = [`=== ${m.doctorHeader} ===`, ''];
  for (const c of checks) {
    const label = m['doctor_' + c.key] ?? c.key;
    let line = `${c.ok ? '✅' : '❌'} ${label}`;
    if (c.note) line += ` (${c.note})`;
    lines.push(line);
    if (!c.ok && c.hint) lines.push(`   → ${c.hint}`);
  }
  return lines.join('\n');
}

// Best-effort latest-release lookup. Returns the tag_name or null on any error/timeout.
async function fetchLatestTag(signal) {
  try {
    const res = await fetch('https://api.github.com/repos/funhunter7/claude-limit-guard/releases/latest', { signal });
    if (!res.ok) return null;
    const j = await res.json();
    return typeof j.tag_name === 'string' ? j.tag_name : null;
  } catch {
    return null;
  }
}

function pluginVersion() {
  try {
    const here = dirname(fileURLToPath(import.meta.url));
    return JSON.parse(readFileSync(join(here, '..', '.claude-plugin', 'plugin.json'), 'utf8')).version;
  } catch {
    return null;
  }
}

async function main() {
  const cfg = loadConfig(process.cwd());
  const m = getMessages(resolveLocale(cfg.locale));
  const checks = [];

  const nodeMajor = parseInt(process.versions.node, 10);
  checks.push({ key: 'node', ok: nodeMajor >= 18, hint: m.doctorHint_node, note: `v${process.versions.node}` });

  checks.push({ key: 'token', ok: probeTokenPresent(), hint: m.doctorHint_token });
  checks.push({ key: 'statusline', ok: probeStatusLineWired(), hint: m.doctorHint_statusline });

  const ageMs = probeCacheAge();
  checks.push({ key: 'cache', ok: ageMs != null && ageMs < 5 * 60_000, hint: m.doctorHint_cache });

  // Version-vs-latest: neutral on any error so an offline run never shows a false ❌.
  const version = pluginVersion();
  const latest = await fetchLatestTag(AbortSignal.timeout(2500));
  if (latest == null) {
    checks.push({ key: 'version', ok: true, note: `v${version ?? '?'} (${m.doctorVersionUnknown})` });
  } else {
    const latestNorm = latest.replace(/^v/, '');
    checks.push({ key: 'version', ok: latestNorm === version, note: `v${version ?? '?'} → ${latest}`, hint: m.doctorHint_version });
  }

  process.stdout.write(renderDoctor(checks, { locale: cfg.locale }) + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((e) => {
    process.stderr.write(`ERROR: ${e.message}\n`);
    process.exit(1);
  });
}
