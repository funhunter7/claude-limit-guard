import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

export function credentialsPath(env = process.env) {
  const base = env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude');
  return join(base, '.credentials.json');
}

export function getToken(env = process.env, readFile = readFileSync) {
  try {
    const obj = JSON.parse(readFile(credentialsPath(env), 'utf8'));
    return obj?.claudeAiOauth?.accessToken ?? null;
  } catch {
    return null;
  }
}
