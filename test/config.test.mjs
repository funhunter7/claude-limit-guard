import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadConfig, DEFAULT_CONFIG } from '../lib/config.mjs';

const noEnv = {};

test('loadConfig: returns defaults when file missing', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.deepEqual(loadConfig('/proj', readThrows, noEnv), DEFAULT_CONFIG);
});

test('loadConfig: merges project overrides over defaults', () => {
  const readFile = () => JSON.stringify({ threshold: 90, handoff: 'NOTES.md' });
  const cfg = loadConfig('/proj', readFile, noEnv);
  assert.equal(cfg.threshold, 90);
  assert.equal(cfg.handoff, 'NOTES.md');
  assert.deepEqual(cfg.watch, DEFAULT_CONFIG.watch);
});

test('loadConfig: malformed JSON -> defaults', () => {
  const readFile = () => '{ not json';
  assert.deepEqual(loadConfig('/proj', readFile, noEnv), DEFAULT_CONFIG);
});

test('loadConfig: malformed JSON triggers a debug log', () => {
  const readFile = () => '{ not json';
  const logged = [];
  loadConfig('/proj', readFile, noEnv, (...a) => logged.push(a.join(' ')));
  assert.ok(logged.some((l) => /limit-guard\.json/.test(l)), `expected a debug line about the bad file, got: ${JSON.stringify(logged)}`);
});

test('loadConfig: missing file does not debug-log (normal case)', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  const logged = [];
  loadConfig('/proj', readThrows, noEnv, (...a) => logged.push(a.join(' ')));
  assert.deepEqual(logged, []);
});

test('loadConfig: applies CLAUDE_PLUGIN_OPTION_* env options', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  const env = {
    CLAUDE_PLUGIN_OPTION_THRESHOLD: '90',
    CLAUDE_PLUGIN_OPTION_LOCALE: 'cs-CZ',
    CLAUDE_PLUGIN_OPTION_GUARD_ACTION: 'Ulož a vypni.',
  };
  const cfg = loadConfig('/proj', readThrows, env);
  assert.equal(cfg.threshold, 90); // parsed to number
  assert.equal(cfg.locale, 'cs-CZ');
  assert.equal(cfg.guardAction, 'Ulož a vypni.');
});

test('loadConfig: env option key is case-insensitive', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  const cfg = loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_threshold: '70' });
  assert.equal(cfg.threshold, 70);
});

test('loadConfig: ignores blank env options', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  const cfg = loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_LOCALE: '' });
  assert.equal(cfg.locale, DEFAULT_CONFIG.locale);
});

test('loadConfig: project file overrides env option (most specific wins)', () => {
  const readFile = () => JSON.stringify({ threshold: 80 });
  const cfg = loadConfig('/proj', readFile, { CLAUDE_PLUGIN_OPTION_THRESHOLD: '90' });
  assert.equal(cfg.threshold, 80);
});

test('loadConfig: timeFormat defaults to system', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, noEnv).timeFormat, 'system');
});

test('loadConfig: reads CLAUDE_PLUGIN_OPTION_TIME_FORMAT', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  const cfg = loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_TIME_FORMAT: '12' });
  assert.equal(cfg.timeFormat, '12');
});

test('loadConfig: project timeFormat overrides env', () => {
  const readFile = () => JSON.stringify({ timeFormat: '24' });
  const cfg = loadConfig('/proj', readFile, { CLAUDE_PLUGIN_OPTION_TIME_FORMAT: '12' });
  assert.equal(cfg.timeFormat, '24');
});

test('loadConfig: numeric project timeFormat coerced to string', () => {
  const readFile = () => JSON.stringify({ timeFormat: 12 });
  assert.equal(loadConfig('/proj', readFile, noEnv).timeFormat, '12');
});

test('loadConfig: invalid timeFormat falls back to system', () => {
  const readFile = () => JSON.stringify({ timeFormat: 'bogus' });
  assert.equal(loadConfig('/proj', readFile, noEnv).timeFormat, 'system');
});

test('loadConfig: style defaults to auto', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, noEnv).style, 'auto');
});

test('loadConfig: reads CLAUDE_PLUGIN_OPTION_STYLE', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_STYLE: 'ascii' }).style, 'ascii');
});

test('loadConfig: invalid style falls back to auto', () => {
  const readFile = () => JSON.stringify({ style: 'fancy' });
  assert.equal(loadConfig('/proj', readFile, noEnv).style, 'auto');
});

test('loadConfig: warnBand defaults to 80', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, noEnv).warnBand, 80);
});

test('loadConfig: reads CLAUDE_PLUGIN_OPTION_WARN_BAND as number', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_WARN_BAND: '70' }).warnBand, 70);
});

test('loadConfig: invalid warn_band falls back to default', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_WARN_BAND: 'nope' }).warnBand, 80);
});

test('loadConfig: project warnBand overrides env', () => {
  const readFile = () => JSON.stringify({ warnBand: 60 });
  assert.equal(loadConfig('/proj', readFile, { CLAUDE_PLUGIN_OPTION_WARN_BAND: '70' }).warnBand, 60);
});

test('loadConfig: out-of-range threshold from a hand-edited file -> default', () => {
  const over = () => JSON.stringify({ threshold: 200 });
  assert.equal(loadConfig('/proj', over, noEnv).threshold, DEFAULT_CONFIG.threshold);
  const under = () => JSON.stringify({ threshold: -5 });
  assert.equal(loadConfig('/proj', under, noEnv).threshold, DEFAULT_CONFIG.threshold);
});

test('loadConfig: non-numeric threshold from a hand-edited file -> default', () => {
  const readFile = () => JSON.stringify({ threshold: 'high' });
  assert.equal(loadConfig('/proj', readFile, noEnv).threshold, DEFAULT_CONFIG.threshold);
});

test('loadConfig: out-of-range warnBand from a hand-edited file -> default', () => {
  const readFile = () => JSON.stringify({ warnBand: 101 });
  assert.equal(loadConfig('/proj', readFile, noEnv).warnBand, DEFAULT_CONFIG.warnBand);
});

test('loadConfig: reads CLAUDE_PLUGIN_OPTION_WATCH csv -> trimmed array', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  const cfg = loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_WATCH: ' five_hour , seven_day ' });
  assert.deepEqual(cfg.watch, ['five_hour', 'seven_day']);
});

test('loadConfig: blank watch entries are dropped', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  const cfg = loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_WATCH: 'five_hour,,' });
  assert.deepEqual(cfg.watch, ['five_hour']);
});

test('loadConfig: project watch (array) overrides env csv', () => {
  const readFile = () => JSON.stringify({ watch: ['seven_day'] });
  const cfg = loadConfig('/proj', readFile, { CLAUDE_PLUGIN_OPTION_WATCH: 'five_hour,seven_day' });
  assert.deepEqual(cfg.watch, ['seven_day']);
});

// --- global settings.json pluginConfigs (status-line / non-hook path) ---

const GENV = { CLAUDE_CONFIG_DIR: '/home/u/.claude' };

// readFile stub that dispatches by filename, so path separators don't matter.
function fakeRead(map) {
  return (p) => {
    const s = String(p);
    if (s.endsWith('settings.json')) {
      if (!('settings' in map)) { const e = new Error('ENOENT'); e.code = 'ENOENT'; throw e; }
      return map.settings;
    }
    if (s.endsWith('limit-guard.json')) {
      if (!('project' in map)) { const e = new Error('ENOENT'); e.code = 'ENOENT'; throw e; }
      return map.project;
    }
    const e = new Error('ENOENT'); e.code = 'ENOENT'; throw e;
  };
}

test('loadConfig: applies global pluginConfigs .options when env absent', () => {
  const read = fakeRead({ settings: JSON.stringify({
    pluginConfigs: { 'claude-limit-guard@claude-limit-guard': { options: { threshold: 90, locale: 'cs-CZ', time_format: '24' } } },
  }) });
  const cfg = loadConfig('/proj', read, GENV);
  assert.equal(cfg.threshold, 90);
  assert.equal(cfg.locale, 'cs-CZ');
  assert.equal(cfg.timeFormat, '24');
});

test('loadConfig: env option beats global settings', () => {
  const read = fakeRead({ settings: JSON.stringify({
    pluginConfigs: { 'claude-limit-guard@claude-limit-guard': { options: { threshold: 90 } } },
  }) });
  const cfg = loadConfig('/proj', read, { ...GENV, CLAUDE_PLUGIN_OPTION_THRESHOLD: '70' });
  assert.equal(cfg.threshold, 70);
});

test('loadConfig: project file beats global and env', () => {
  const read = fakeRead({
    settings: JSON.stringify({ pluginConfigs: { 'claude-limit-guard@claude-limit-guard': { options: { threshold: 90 } } } }),
    project: JSON.stringify({ threshold: 50 }),
  });
  const cfg = loadConfig('/proj', read, { ...GENV, CLAUDE_PLUGIN_OPTION_THRESHOLD: '70' });
  assert.equal(cfg.threshold, 50);
});

test('loadConfig: malformed global settings -> defaults, no throw', () => {
  const read = fakeRead({ settings: '{ not json' });
  const cfg = loadConfig('/proj', read, GENV);
  assert.equal(cfg.threshold, DEFAULT_CONFIG.threshold);
  assert.equal(cfg.locale, DEFAULT_CONFIG.locale);
});

test('loadConfig: legacy flat global option (no .options) is honored', () => {
  const read = fakeRead({ settings: JSON.stringify({
    pluginConfigs: { 'claude-limit-guard@claude-limit-guard': { locale: 'cs-CZ' } },
  }) });
  assert.equal(loadConfig('/proj', read, GENV).locale, 'cs-CZ');
});

test('loadConfig: global watch (csv string) and threshold (string) both coerce', () => {
  const read = fakeRead({ settings: JSON.stringify({
    pluginConfigs: { 'claude-limit-guard@claude-limit-guard': { options: { watch: 'five_hour', threshold: '88' } } },
  }) });
  const cfg = loadConfig('/proj', read, GENV);
  assert.deepEqual(cfg.watch, ['five_hour']);
  assert.equal(cfg.threshold, 88);
});

test('loadConfig: blank/array numeric values in global options are treated as unset', () => {
  for (const bad of ['', '   ', []]) {
    const read = fakeRead({ settings: JSON.stringify({
      pluginConfigs: { 'claude-limit-guard@claude-limit-guard': { options: { threshold: bad, warn_band: bad } } },
    }) });
    const cfg = loadConfig('/proj', read, GENV);
    assert.equal(cfg.threshold, DEFAULT_CONFIG.threshold, `threshold for ${JSON.stringify(bad)}`);
    assert.equal(cfg.warnBand, DEFAULT_CONFIG.warnBand, `warnBand for ${JSON.stringify(bad)}`);
  }
});

test('loadConfig: null values in global options are treated as unset', () => {
  const read = fakeRead({ settings: JSON.stringify({
    pluginConfigs: { 'claude-limit-guard@claude-limit-guard': { options: { threshold: null, warn_band: null, watch: null, locale: null, style: null } } },
  }) });
  const cfg = loadConfig('/proj', read, GENV);
  assert.equal(cfg.threshold, DEFAULT_CONFIG.threshold);
  assert.equal(cfg.warnBand, DEFAULT_CONFIG.warnBand);
  assert.deepEqual(cfg.watch, DEFAULT_CONFIG.watch);
  assert.equal(cfg.locale, DEFAULT_CONFIG.locale);
  assert.equal(cfg.style, DEFAULT_CONFIG.style);
});

test('loadConfig: labelStyle defaults to full', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, noEnv).labelStyle, 'full');
});

test('loadConfig: reads CLAUDE_PLUGIN_OPTION_LABEL_STYLE', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_LABEL_STYLE: 'short' }).labelStyle, 'short');
});

test('loadConfig: invalid labelStyle falls back to full', () => {
  const readFile = () => JSON.stringify({ labelStyle: 'tiny' });
  assert.equal(loadConfig('/proj', readFile, noEnv).labelStyle, 'full');
});

test('loadConfig: project labelStyle overrides env', () => {
  const readFile = () => JSON.stringify({ labelStyle: 'short' });
  assert.equal(loadConfig('/proj', readFile, { CLAUDE_PLUGIN_OPTION_LABEL_STYLE: 'full' }).labelStyle, 'short');
});

test('loadConfig: resetDisplay defaults to clock', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, noEnv).resetDisplay, 'clock');
});

test('loadConfig: reads CLAUDE_PLUGIN_OPTION_RESET_DISPLAY', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_RESET_DISPLAY: 'relative' }).resetDisplay, 'relative');
});

test('loadConfig: invalid resetDisplay falls back to clock', () => {
  const readFile = () => JSON.stringify({ resetDisplay: 'fancy' });
  assert.equal(loadConfig('/proj', readFile, noEnv).resetDisplay, 'clock');
});

test('loadConfig: project resetDisplay overrides env', () => {
  const readFile = () => JSON.stringify({ resetDisplay: 'both' });
  assert.equal(loadConfig('/proj', readFile, { CLAUDE_PLUGIN_OPTION_RESET_DISPLAY: 'relative' }).resetDisplay, 'both');
});

test('loadConfig: projectionDisplay defaults to off', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, noEnv).projectionDisplay, 'off');
});

test('loadConfig: reads CLAUDE_PLUGIN_OPTION_PROJECTION_DISPLAY', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_PROJECTION_DISPLAY: 'on' }).projectionDisplay, 'on');
});

test('loadConfig: invalid projectionDisplay falls back to off', () => {
  const readFile = () => JSON.stringify({ projectionDisplay: 'maybe' });
  assert.equal(loadConfig('/proj', readFile, noEnv).projectionDisplay, 'off');
});

test('loadConfig: notifications defaults to off', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, noEnv).notifications, 'off');
});

test('loadConfig: reads CLAUDE_PLUGIN_OPTION_NOTIFICATIONS', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_NOTIFICATIONS: 'on' }).notifications, 'on');
});

test('loadConfig: invalid notifications falls back to off', () => {
  const readFile = () => JSON.stringify({ notifications: 'sometimes' });
  assert.equal(loadConfig('/proj', readFile, noEnv).notifications, 'off');
});

// --- per-window thresholds ---

test('loadConfig: thresholdFiveHour/thresholdSevenDay default to null', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  const cfg = loadConfig('/proj', readThrows, noEnv);
  assert.equal(cfg.thresholdFiveHour, null);
  assert.equal(cfg.thresholdSevenDay, null);
});

test('loadConfig: reads CLAUDE_PLUGIN_OPTION_THRESHOLD_FIVE_HOUR as number', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_THRESHOLD_FIVE_HOUR: '80' }).thresholdFiveHour, 80);
});

test('loadConfig: reads CLAUDE_PLUGIN_OPTION_THRESHOLD_SEVEN_DAY as number', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_THRESHOLD_SEVEN_DAY: '70' }).thresholdSevenDay, 70);
});

test('loadConfig: out-of-range threshold_five_hour (>100) falls back to null', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_THRESHOLD_FIVE_HOUR: '150' }).thresholdFiveHour, null);
});

test('loadConfig: negative threshold_seven_day falls back to null', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_THRESHOLD_SEVEN_DAY: '-5' }).thresholdSevenDay, null);
});

test('loadConfig: non-numeric threshold_five_hour (NaN) falls back to null', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  // asNumber("nope") -> undefined -> thresholdFiveHour stays null from DEFAULT_CONFIG
  assert.equal(loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_THRESHOLD_FIVE_HOUR: 'nope' }).thresholdFiveHour, null);
});

test('loadConfig: project thresholdFiveHour overrides env', () => {
  const readFile = () => JSON.stringify({ thresholdFiveHour: 75 });
  assert.equal(loadConfig('/proj', readFile, { CLAUDE_PLUGIN_OPTION_THRESHOLD_FIVE_HOUR: '80' }).thresholdFiveHour, 75);
});

test('loadConfig: project thresholdSevenDay overrides env', () => {
  const readFile = () => JSON.stringify({ thresholdSevenDay: 65 });
  assert.equal(loadConfig('/proj', readFile, { CLAUDE_PLUGIN_OPTION_THRESHOLD_SEVEN_DAY: '70' }).thresholdSevenDay, 65);
});

test('loadConfig: out-of-range thresholdFiveHour in project file falls back to null', () => {
  const readFile = () => JSON.stringify({ thresholdFiveHour: 120 });
  assert.equal(loadConfig('/proj', readFile, noEnv).thresholdFiveHour, null);
});

test('loadConfig: global pluginConfigs threshold_five_hour is parsed', () => {
  const read = fakeRead({ settings: JSON.stringify({
    pluginConfigs: { 'claude-limit-guard@claude-limit-guard': { options: { threshold_five_hour: 85, threshold_seven_day: 70 } } },
  }) });
  const cfg = loadConfig('/proj', read, GENV);
  assert.equal(cfg.thresholdFiveHour, 85);
  assert.equal(cfg.thresholdSevenDay, 70);
});

// --- watch: auto sentinel (model-aware default) ---

test('loadConfig: default watch is "auto"', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, {}).watch, 'auto');
});

test('loadConfig: CLAUDE_PLUGIN_OPTION_WATCH=auto -> "auto"', () => {
  const readThrows = () => { throw new Error('ENOENT'); };
  assert.equal(loadConfig('/proj', readThrows, { CLAUDE_PLUGIN_OPTION_WATCH: 'auto' }).watch, 'auto');
});

test('loadConfig: invalid watch entries fall back to default "auto"', () => {
  const readFile = () => JSON.stringify({ watch: ['bogus', 42] });
  assert.equal(loadConfig('/proj', readFile, {}).watch, 'auto');
});

test('loadConfig: project watch csv string is coerced to a valid array', () => {
  const readFile = () => JSON.stringify({ watch: 'five_hour, seven_day_opus' });
  assert.deepEqual(loadConfig('/proj', readFile, {}).watch, ['five_hour', 'seven_day_opus']);
});
