#!/usr/bin/env node
import {
  setProjectGuard,
  clearProjectGuard,
  setGlobalGuard,
  clearGlobalGuard,
  setProjectWarn,
  clearProjectWarn,
  setGlobalWarn,
  clearGlobalWarn,
} from '../lib/guardConfig.mjs';

// Usage:
//   node bin/guard.mjs --scope project|global --action set --value "<text>"
//   node bin/guard.mjs --scope project|global --action clear
//   node bin/guard.mjs --scope project|global --action set --value "<text>" --kind warn
//   node bin/guard.mjs --scope project|global --action clear --kind warn
// --kind defaults to 'guard' for full back-compat.
function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--scope') out.scope = argv[++i];
    else if (a === '--action') out.action = argv[++i];
    else if (a === '--value') out.value = argv[++i];
    else if (a === '--kind') out.kind = argv[++i];
  }
  return out;
}

function main() {
  const { scope, action, value, kind = 'guard' } = parseArgs(process.argv.slice(2));
  if (!['project', 'global'].includes(scope)) throw new Error('--scope must be project|global');
  if (!['set', 'clear'].includes(action)) throw new Error('--action must be set|clear');
  if (!['guard', 'warn'].includes(kind)) throw new Error('--kind must be guard|warn');
  if (action === 'set' && (value == null || value === '')) throw new Error('--value required for set');

  let path;
  if (kind === 'warn') {
    if (scope === 'project') {
      path = action === 'set' ? setProjectWarn(process.cwd(), value) : clearProjectWarn(process.cwd());
    } else {
      path = action === 'set' ? setGlobalWarn(value) : clearGlobalWarn();
    }
    process.stdout.write(`OK: ${action} ${scope} warn action -> ${path}\n`);
  } else {
    if (scope === 'project') {
      path = action === 'set' ? setProjectGuard(process.cwd(), value) : clearProjectGuard(process.cwd());
    } else {
      path = action === 'set' ? setGlobalGuard(value) : clearGlobalGuard();
    }
    process.stdout.write(`OK: ${action} ${scope} guard action -> ${path}\n`);
  }
}

try {
  main();
} catch (e) {
  process.stderr.write(`ERROR: ${e.message}\n`);
  process.exit(1);
}
