#!/usr/bin/env node
// Powers /limit-guard-setup: wires the status line into the global settings.json,
// backing up the previous file first. Idempotent: a no-op when already wired.
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadConfig } from '../lib/config.mjs';
import { resolveLocale } from '../lib/format.mjs';
import { getMessages } from '../lib/messages.mjs';
import { globalSettingsPath } from '../lib/pluginSettings.mjs';

// Pure: returns the settings object with statusLine pointing at our command, plus a
// `changed` flag. Other keys are preserved; an identical existing command is a no-op.
export function computeSettings(existing, command) {
  const cur = existing?.statusLine;
  if (cur && cur.type === 'command' && cur.command === command) {
    return { settings: existing, changed: false };
  }
  return { settings: { ...existing, statusLine: { type: 'command', command } }, changed: true };
}

function main(pluginRoot = process.argv[2] || process.cwd()) {
  const cfg = loadConfig(process.cwd());
  const m = getMessages(resolveLocale(cfg.locale));
  const settingsPath = globalSettingsPath(process.env);

  let raw = null;
  try { raw = readFileSync(settingsPath, 'utf8'); } catch { /* no global settings yet */ }
  let existing = {};
  if (raw != null) {
    try { existing = JSON.parse(raw); } catch { existing = {}; }
  }

  const command = `node "${join(pluginRoot, 'bin', 'usage.mjs')}" --statusline`;
  const { settings, changed } = computeSettings(existing, command);

  if (!changed) {
    process.stdout.write(m.setupAlreadyWired + '\n');
    return;
  }

  // Back up the previous settings (raw bytes) before overwriting, when one existed.
  if (raw != null) {
    const bak = settingsPath + '.bak-limitguard';
    try {
      writeFileSync(bak, raw, 'utf8');
      process.stdout.write(m.setupBackedUp(bak) + '\n');
    } catch { /* best-effort backup */ }
  }

  writeFileSync(settingsPath, JSON.stringify(settings, null, 2) + '\n', 'utf8');
  process.stdout.write(m.setupWired + '\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    main();
  } catch (e) {
    process.stderr.write(`ERROR: ${e.message}\n`);
    process.exit(1);
  }
}
