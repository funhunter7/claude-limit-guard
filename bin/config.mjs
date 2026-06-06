#!/usr/bin/env node
import { CONFIG_OPTIONS, coerceOptionValue } from '../lib/configOptions.mjs';
import {
  setProjectOption,
  clearProjectOption,
  setGlobalOption,
  clearGlobalOption,
} from '../lib/guardConfig.mjs';

// Usage:
//   node bin/config.mjs --scope project|global --option <name> --value "<v>"
//   node bin/config.mjs --scope project|global --option <name> --clear
// <name> is one of CONFIG_OPTIONS (threshold, warn_band, watch, time_format, style).
// For list options (watch) pass a comma-separated --value. Powers /limit-guard-config.
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--scope') out.scope = argv[++i];
    else if (a === '--option') out.option = argv[++i];
    else if (a === '--value') out.value = argv[++i];
    else if (a === '--clear') out.clear = true;
  }
  return out;
}

function main() {
  const { scope, option, value, clear } = parseArgs(process.argv.slice(2));
  if (!['project', 'global'].includes(scope)) throw new Error('--scope must be project|global');
  const def = CONFIG_OPTIONS[option];
  if (!def) throw new Error(`--option must be one of: ${Object.keys(CONFIG_OPTIONS).join(', ')}`);

  let path;
  if (clear) {
    path = scope === 'project'
      ? clearProjectOption(process.cwd(), def.projectKey)
      : clearGlobalOption(def.globalKey);
    process.stdout.write(`OK: cleared ${scope} ${option} -> ${path}\n`);
    return;
  }

  const coerced = coerceOptionValue(option, value); // throws with a user-facing message
  path = scope === 'project'
    ? setProjectOption(process.cwd(), def.projectKey, coerced)
    : setGlobalOption(def.globalKey, coerced);
  process.stdout.write(`OK: set ${scope} ${option} = ${JSON.stringify(coerced)} -> ${path}\n`);
}

try {
  main();
} catch (e) {
  process.stderr.write(`ERROR: ${e.message}\n`);
  process.exit(1);
}
