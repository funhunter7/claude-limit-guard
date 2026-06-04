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
    if (entry.options) delete entry.options.guard_action;
    delete entry.guard_action; // legacy flat copy
  }
  writeJson(path, obj, writeFile, mkdir);
  return path;
}
