import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const DEFAULT_CONFIG = {
  threshold: 95,
  watch: ['five_hour', 'seven_day'],
  handoff: '.claude/RESUME.md',
  locale: 'en-US',
  guardAction: null,
  timeFormat: 'system',
};

const VALID_TIME_FORMATS = new Set(['system', '12', '24']);

// Read a plugin userConfig value exported by Claude Code as CLAUDE_PLUGIN_OPTION_<KEY>.
// Tolerates upper/lower/original casing of the key. Blank values are treated as unset.
function readOption(env, key) {
  for (const variant of [key, key.toUpperCase(), key.toLowerCase()]) {
    const v = env[`CLAUDE_PLUGIN_OPTION_${variant}`];
    if (v != null && v !== '') return v;
  }
  return undefined;
}

// Settings the user can configure directly in Claude Code via the plugin's
// userConfig (surfaced in /config), passed to this subprocess as env vars.
function envOverrides(env) {
  const out = {};
  const threshold = readOption(env, 'threshold');
  if (threshold !== undefined && !Number.isNaN(Number(threshold))) out.threshold = Number(threshold);
  const locale = readOption(env, 'locale');
  if (locale !== undefined) out.locale = locale;
  const guardAction = readOption(env, 'guard_action');
  if (guardAction !== undefined) out.guardAction = guardAction;
  const timeFormat = readOption(env, 'time_format');
  if (timeFormat !== undefined) out.timeFormat = timeFormat;
  return out;
}

export function loadConfig(cwd, readFile = readFileSync, env = process.env) {
  let fileCfg = {};
  try {
    fileCfg = JSON.parse(readFile(join(cwd, '.claude', 'limit-guard.json'), 'utf8'));
  } catch {
    fileCfg = {};
  }
  // Precedence (most specific wins): per-project file > Claude Code option > default.
  const merged = { ...DEFAULT_CONFIG, ...envOverrides(env), ...fileCfg };
  merged.timeFormat = VALID_TIME_FORMATS.has(String(merged.timeFormat))
    ? String(merged.timeFormat)
    : 'system';
  return merged;
}
