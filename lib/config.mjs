import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { makeDebug } from './debug.mjs';
import { readGlobalOptions } from './pluginSettings.mjs';

export const DEFAULT_CONFIG = {
  threshold: 95,
  warnBand: 80,
  watch: ['five_hour', 'seven_day'],
  handoff: '.claude/RESUME.md',
  locale: 'system',
  guardAction: null,
  timeFormat: 'system',
  style: 'auto',
  labelStyle: 'full',
};

const VALID_TIME_FORMATS = new Set(['system', '12', '24']);
const VALID_STYLES = new Set(['auto', 'emoji', 'ascii']);
const VALID_LABEL_STYLES = new Set(['full', 'short']);

// Read a plugin userConfig value exported by Claude Code as CLAUDE_PLUGIN_OPTION_<KEY>.
// Tolerates upper/lower/original casing of the key. Blank values are treated as unset.
function readOption(env, key) {
  for (const variant of [key, key.toUpperCase(), key.toLowerCase()]) {
    const v = env[`CLAUDE_PLUGIN_OPTION_${variant}`];
    if (v != null && v !== '') return v;
  }
  return undefined;
}

// Map a flat record of snake_case option names (values may be string OR native JSON
// types) to camelCase config overrides, applying the same validation/coercion for every
// source (env vars and settings.json alike). Blank/NaN values are treated as unset.
function optionsToConfig(opts) {
  const out = {};
  // Coerce to a finite number, treating null/array/blank (incl. whitespace) as unset,
  // so a hand-edited settings.json like `"threshold": ""` or `[]` doesn't become 0.
  const asNumber = (v) => {
    if (v == null || Array.isArray(v)) return undefined;
    const s = typeof v === 'string' ? v.trim() : v;
    if (s === '') return undefined;
    const n = Number(s);
    return Number.isNaN(n) ? undefined : n;
  };
  const threshold = asNumber(opts.threshold);
  if (threshold !== undefined) out.threshold = threshold;
  const warnBand = asNumber(opts.warn_band);
  if (warnBand !== undefined) out.warnBand = warnBand;
  if (opts.watch != null) {
    const list = (Array.isArray(opts.watch) ? opts.watch : String(opts.watch).split(','))
      .map((s) => String(s).trim())
      .filter(Boolean);
    if (list.length) out.watch = list;
  }
  if (opts.locale != null && opts.locale !== '') out.locale = String(opts.locale);
  if (opts.guard_action != null && opts.guard_action !== '') out.guardAction = String(opts.guard_action);
  if (opts.time_format != null && opts.time_format !== '') out.timeFormat = String(opts.time_format);
  if (opts.style != null && opts.style !== '') out.style = String(opts.style);
  if (opts.label_style != null && opts.label_style !== '') out.labelStyle = String(opts.label_style);
  return out;
}

// Options the user set in Claude Code's /config, passed to this subprocess as
// CLAUDE_PLUGIN_OPTION_<KEY> env vars (hooks and commands only).
function envOverrides(env) {
  const opts = {};
  for (const key of ['threshold', 'warn_band', 'watch', 'locale', 'guard_action', 'time_format', 'style', 'label_style']) {
    const v = readOption(env, key);
    if (v !== undefined) opts[key] = v;
  }
  return optionsToConfig(opts);
}

export function loadConfig(cwd, readFile = readFileSync, env = process.env, debug = makeDebug(env)) {
  // The injected readFile is used for both the per-project file and (via
  // readGlobalOptions) the global settings.json.
  let fileCfg = {};
  let raw;
  try {
    raw = readFile(join(cwd, '.claude', 'limit-guard.json'), 'utf8');
  } catch {
    raw = undefined; // a missing per-project file is the normal case — stay silent
  }
  if (raw !== undefined) {
    try {
      fileCfg = JSON.parse(raw);
    } catch {
      debug('ignoring malformed .claude/limit-guard.json');
      fileCfg = {};
    }
  }
  // Precedence (most specific wins): per-project file > Claude Code env option >
  // global settings.json options > default. Env is populated for hooks/commands; the
  // status line (a plain user setting) relies on the global settings.json layer.
  const globalCfg = optionsToConfig(readGlobalOptions(env, readFile, debug));
  const merged = { ...DEFAULT_CONFIG, ...globalCfg, ...envOverrides(env), ...fileCfg };
  merged.timeFormat = VALID_TIME_FORMATS.has(String(merged.timeFormat))
    ? String(merged.timeFormat)
    : 'system';
  merged.style = VALID_STYLES.has(String(merged.style)) ? String(merged.style) : 'auto';
  merged.labelStyle = VALID_LABEL_STYLES.has(String(merged.labelStyle)) ? String(merged.labelStyle) : 'full';
  return merged;
}
