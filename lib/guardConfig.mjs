import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join, dirname } from 'node:path';

// Settings key Claude Code uses for this plugin (plugin@marketplace).
// Assumes the marketplace is registered under the same name as the plugin.
export const PLUGIN_KEY = 'claude-limit-guard@claude-limit-guard';

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
  obj.pluginConfigs[PLUGIN_KEY] = obj.pluginConfigs[PLUGIN_KEY] || {};
  obj.pluginConfigs[PLUGIN_KEY].guard_action = text;
  writeJson(path, obj, writeFile, mkdir);
  return path;
}

export function clearGlobalGuard(deps = {}) {
  const { readFile = readFileSync, writeFile = writeFileSync, mkdir = mkdirSync, env = process.env } = deps;
  const path = globalPath(env);
  const obj = readJson(path, readFile);
  if (obj.pluginConfigs && obj.pluginConfigs[PLUGIN_KEY]) {
    delete obj.pluginConfigs[PLUGIN_KEY].guard_action;
  }
  writeJson(path, obj, writeFile, mkdir);
  return path;
}
