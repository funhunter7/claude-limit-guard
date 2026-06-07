// Options the interactive `/limit-guard-config` command can set, mapped to the storage key
// for each scope. Project files use camelCase keys (spread straight into the config object);
// global settings.json uses the snake_case option names Claude Code's /config writes under
// `pluginConfigs[...].options`. `locale`, `time_format`, and `style` default to OS/terminal
// detection, so the always-on /config dialog omits them — but time_format/style remain
// overridable here on demand. `locale` is fully system-driven and intentionally absent.
export const CONFIG_OPTIONS = {
  threshold: { projectKey: 'threshold', globalKey: 'threshold', type: 'number' },
  warn_band: { projectKey: 'warnBand', globalKey: 'warn_band', type: 'number' },
  threshold_five_hour: { projectKey: 'thresholdFiveHour', globalKey: 'threshold_five_hour', type: 'number' },
  threshold_seven_day: { projectKey: 'thresholdSevenDay', globalKey: 'threshold_seven_day', type: 'number' },
  watch: { projectKey: 'watch', globalKey: 'watch', type: 'list', choices: ['five_hour', 'seven_day'] },
  guard_action: { projectKey: 'guardAction', globalKey: 'guard_action', type: 'string' },
  warn_action: { projectKey: 'warnAction', globalKey: 'warn_action', type: 'string' },
  time_format: { projectKey: 'timeFormat', globalKey: 'time_format', type: 'enum', choices: ['system', '12', '24'] },
  style: { projectKey: 'style', globalKey: 'style', type: 'enum', choices: ['auto', 'emoji', 'ascii'] },
  label_style: { projectKey: 'labelStyle', globalKey: 'label_style', type: 'enum', choices: ['full', 'short'] },
  reset_display: { projectKey: 'resetDisplay', globalKey: 'reset_display', type: 'enum', choices: ['clock', 'relative', 'both'] },
  projection_display: { projectKey: 'projectionDisplay', globalKey: 'projection_display', type: 'enum', choices: ['off', 'on'] },
  notifications: { projectKey: 'notifications', globalKey: 'notifications', type: 'enum', choices: ['off', 'on'] },
};

// Validate and coerce a raw string value for an option to its stored form (number, string,
// or array). Throws an Error with a user-facing message (listing valid choices) on bad input.
export function coerceOptionValue(name, raw) {
  const def = CONFIG_OPTIONS[name];
  if (!def) throw new Error(`unknown option: ${name}`);
  const s = String(raw ?? '').trim();

  if (def.type === 'number') {
    const n = Number(s);
    if (s === '' || Number.isNaN(n)) throw new Error(`${name} must be a number between 0 and 100`);
    if (n < 0 || n > 100) throw new Error(`${name} must be between 0 and 100`);
    return n;
  }

  if (def.type === 'enum') {
    if (!def.choices.includes(s)) throw new Error(`${name} must be one of: ${def.choices.join(', ')}`);
    return s;
  }

  if (def.type === 'list') {
    const seen = new Set();
    const list = [];
    for (const part of s.split(',').map((x) => x.trim()).filter(Boolean)) {
      if (!def.choices.includes(part)) throw new Error(`${name} entries must be one of: ${def.choices.join(', ')}`);
      if (!seen.has(part)) { seen.add(part); list.push(part); }
    }
    if (!list.length) throw new Error(`${name} needs at least one of: ${def.choices.join(', ')}`);
    return list;
  }

  // type === 'string'
  if (s === '') throw new Error(`${name} must not be empty`);
  return s;
}
