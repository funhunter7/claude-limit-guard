import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

// Default settings key Claude Code uses for this plugin (plugin@marketplace),
// assuming the marketplace is registered under the same name as the plugin.
export const PLUGIN_KEY = 'claude-limit-guard@claude-limit-guard';

// Pick the pluginConfigs key to write under. The marketplace part may differ from the
// plugin name, so prefer an explicit env override, then any existing
// `claude-limit-guard@*` key already in settings, and only fall back to the default.
function resolveGlobalKey(settings, env) {
  if (env.CLAUDE_LIMIT_GUARD_PLUGIN_KEY) return env.CLAUDE_LIMIT_GUARD_PLUGIN_KEY;
  const existing = Object.keys(settings.pluginConfigs || {}).find((k) =>
    k.startsWith('claude-limit-guard@'),
  );
  return existing || PLUGIN_KEY;
}

// Read JSON: a missing file yields {}, but invalid JSON throws (never overwrite).
function readJson(path, readFile) {
  let raw;
  try {
    raw = readFile(path, 'utf8');
  } catch {
    return {};
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error(`Invalid JSON in ${path}; refusing to overwrite.`);
  }
}

function writeJson(path, obj, writeFile, mkdir) {
  mkdir(dirname(path), { recursive: true });
  writeFile(path, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function projectPath(cwd) {
  return join(cwd, '.claude', 'limit-guard.json');
}

export function setProjectGuard(cwd, text, deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, mkdir = mkdirSync } = deps;
  const path = projectPath(cwd);
  const obj = readJson(path, readFile);
  obj.guardAction = text;
  writeJson(path, obj, writeFile, mkdir);
  return path;
}

export function clearProjectGuard(cwd, deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, mkdir = mkdirSync } = deps;
  const path = projectPath(cwd);
  const obj = readJson(path, readFile);
  delete obj.guardAction;
  writeJson(path, obj, writeFile, mkdir);
  return path;
}

function globalPath(env) {
  const base = env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
  return join(base, 'settings.json');
}

export function setGlobalGuard(text, deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, mkdir = mkdirSync, env = process.env } = deps;
  const path = globalPath(env);
  const obj = readJson(path, readFile);
  obj.pluginConfigs = obj.pluginConfigs || {};
  const key = resolveGlobalKey(obj, env);
  obj.pluginConfigs[key] = obj.pluginConfigs[key] || {};
  obj.pluginConfigs[key].guard_action = text;
  writeJson(path, obj, writeFile, mkdir);
  return path;
}

export function clearGlobalGuard(deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, mkdir = mkdirSync, env = process.env } = deps;
  const path = globalPath(env);
  const obj = readJson(path, readFile);
  const key = resolveGlobalKey(obj, env);
  if (obj.pluginConfigs && obj.pluginConfigs[key]) {
    delete obj.pluginConfigs[key].guard_action;
  }
  writeJson(path, obj, writeFile, mkdir);
  return path;
}
