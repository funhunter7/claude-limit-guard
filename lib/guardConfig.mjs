import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { PLUGIN_KEY, globalSettingsPath, resolveGlobalKey } from './pluginSettings.mjs';

export { PLUGIN_KEY };

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

// Generic per-project setter: writes obj[key] = value into .claude/limit-guard.json,
// preserving every other key. `key` is the camelCase project key; `value` may be any
// JSON-serializable value (number, string, array). Used by the /limit-guard-config command.
export function setProjectOption(cwd, key, value, deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, mkdir = mkdirSync } = deps;
  const path = projectPath(cwd);
  const obj = readJson(path, readFile);
  obj[key] = value;
  writeJson(path, obj, writeFile, mkdir);
  return path;
}

export function clearProjectOption(cwd, key, deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, mkdir = mkdirSync } = deps;
  const path = projectPath(cwd);
  const obj = readJson(path, readFile);
  delete obj[key];
  writeJson(path, obj, writeFile, mkdir);
  return path;
}

// Generic global setter: writes pluginConfigs[<key>].options[<optionKey>] = value in the
// global settings.json (where Claude Code's /config stores options), preserving siblings.
export function setGlobalOption(optionKey, value, deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, mkdir = mkdirSync, env = process.env } = deps;
  const path = globalSettingsPath(env);
  const obj = readJson(path, readFile);
  obj.pluginConfigs = obj.pluginConfigs || {};
  const key = resolveGlobalKey(obj, env);
  const entry = obj.pluginConfigs[key] = obj.pluginConfigs[key] || {};
  entry.options = entry.options || {};
  entry.options[optionKey] = value;
  writeJson(path, obj, writeFile, mkdir);
  return path;
}

export function clearGlobalOption(optionKey, deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, mkdir = mkdirSync, env = process.env } = deps;
  const path = globalSettingsPath(env);
  const obj = readJson(path, readFile);
  const key = resolveGlobalKey(obj, env);
  const entry = obj.pluginConfigs && obj.pluginConfigs[key];
  if (entry && entry.options) {
    delete entry.options[optionKey];
    if (Object.keys(entry.options).length === 0) delete entry.options;
  }
  writeJson(path, obj, writeFile, mkdir);
  return path;
}

// Warn-action setters — thin delegations to the generic option setters.
// Project key is camelCase (warnAction); global key is snake_case (warn_action).
// No legacy-flat-key migration needed: a flat warn_action never existed.
export const setProjectWarn = (cwd, text, deps) => setProjectOption(cwd, 'warnAction', text, deps);
export const clearProjectWarn = (cwd, deps) => clearProjectOption(cwd, 'warnAction', deps);
export const setGlobalWarn = (text, deps) => setGlobalOption('warn_action', text, deps);
export const clearGlobalWarn = (deps) => clearGlobalOption('warn_action', deps);

export function setGlobalGuard(text, deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, mkdir = mkdirSync, env = process.env } = deps;
  const path = globalSettingsPath(env);
  const obj = readJson(path, readFile);
  obj.pluginConfigs = obj.pluginConfigs || {};
  const key = resolveGlobalKey(obj, env);
  const entry = obj.pluginConfigs[key] = obj.pluginConfigs[key] || {};
  entry.options = entry.options || {};
  entry.options.guard_action = text;
  delete entry.guard_action; // drop any legacy flat copy
  writeJson(path, obj, writeFile, mkdir);
  return path;
}

export function clearGlobalGuard(deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, mkdir = mkdirSync, env = process.env } = deps;
  const path = globalSettingsPath(env);
  const obj = readJson(path, readFile);
  const key = resolveGlobalKey(obj, env);
  const entry = obj.pluginConfigs && obj.pluginConfigs[key];
  if (entry) {
    if (entry.options) {
      delete entry.options.guard_action;
      if (Object.keys(entry.options).length === 0) delete entry.options;
    }
    delete entry.guard_action; // legacy flat copy
  }
  writeJson(path, obj, writeFile, mkdir);
  return path;
}
