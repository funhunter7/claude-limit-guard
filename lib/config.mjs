import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const DEFAULT_CONFIG = {
  threshold: 95,
  watch: ['five_hour', 'seven_day'],
  handoff: '.claude/RESUME.md',
};

export function loadConfig(cwd, readFile = readFileSync) {
  let fileCfg = {};
  try {
    fileCfg = JSON.parse(readFile(join(cwd, '.claude', 'limit-guard.json'), 'utf8'));
  } catch {
    fileCfg = {};
  }
  return { ...DEFAULT_CONFIG, ...fileCfg };
}
