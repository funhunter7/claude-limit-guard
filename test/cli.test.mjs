import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCli, parseCwd, parseStdin } from '../bin/usage.mjs';

test('parseCwd: workspace.current_dir wins over cwd', () => {
  const raw = JSON.stringify({ workspace: { current_dir: '/ws' }, cwd: '/other' });
  assert.equal(parseCwd(raw, '/fb'), '/ws');
});

test('parseCwd: falls back to cwd field when no workspace', () => {
  assert.equal(parseCwd(JSON.stringify({ cwd: '/here' }), '/fb'), '/here');
});

test('parseCwd: neither field -> fallback', () => {
  assert.equal(parseCwd(JSON.stringify({ unrelated: 1 }), '/fb'), '/fb');
});

test('parseCwd: invalid JSON -> fallback', () => {
  assert.equal(parseCwd('{ not json', '/fb'), '/fb');
});

test('parseCwd: empty input -> fallback', () => {
  assert.equal(parseCwd('', '/fb'), '/fb');
});

test('parseStdin: extracts cwd and rate_limits together', () => {
  const raw = JSON.stringify({
    workspace: { current_dir: '/ws' },
    rate_limits: { five_hour: { used_percentage: 12, resets_at: 1738425600 } },
  });
  assert.deepEqual(parseStdin(raw, '/fb'), {
    cwd: '/ws',
    rateLimits: { five_hour: { used_percentage: 12, resets_at: 1738425600 } },
  });
});

test('parseStdin: no rate_limits -> rateLimits undefined, cwd resolved', () => {
  assert.deepEqual(parseStdin(JSON.stringify({ cwd: '/here' }), '/fb'),
    { cwd: '/here', rateLimits: undefined });
});

test('parseStdin: invalid JSON -> fallback cwd, undefined rateLimits', () => {
  assert.deepEqual(parseStdin('{ not json', '/fb'), { cwd: '/fb', rateLimits: undefined });
});

const SAMPLE = { five_hour: { utilization: 72, resets_at: '2026-05-31T06:00:00+02:00' },
                 seven_day: { utilization: 39, resets_at: '2026-06-03T10:00:00+02:00' } };
const BREACH = { five_hour: { utilization: 96, resets_at: '2026-05-31T06:00:00+02:00' },
                 seven_day: { utilization: 39, resets_at: '2026-06-03T10:00:00+02:00' } };
const NOW = new Date('2026-05-31T01:00:00+02:00');

function deps(usage, { handoffExists = false, locale = 'en-US', guardAction = null, warnAction = null, warnBand = 80, timeFormat = '24', style = 'emoji', shouldBlockStop = () => true, stdinUsage = null, projectionDisplay = 'off', history = [], notifications = 'off', shouldNotify = () => true, snoozeUntil = () => null, watch = ['five_hour', 'seven_day'], threshold = 95, calls = {} } = {}) {
  calls.getUsage = 0;
  calls.wrote = null;
  calls.appended = null;
  calls.notified = [];
  return {
    loadConfig: () => ({
      threshold,
      warnBand,
      watch,
      handoff: '.claude/RESUME.md',
      locale,
      guardAction,
      warnAction,
      timeFormat,
      style,
      projectionDisplay,
      notifications,
    }),
    getUsage: async () => { calls.getUsage += 1; return usage; },
    handoffExists: () => handoffExists,
    shouldBlockStop,
    now: () => NOW,
    stdinUsage,
    writeCache: (_p, data) => { calls.wrote = data; return true; },
    cachePath: '/tmp/test-cache.json',
    // Inject history so tests never touch the real temp-dir ring buffer.
    appendReading: (_p, reading) => { calls.appended = reading; return true; },
    readHistory: () => history,
    historyPath: '/tmp/test-history.json',
    // Inject the notifier so tests capture toasts instead of spawning OS commands.
    notify: (title, message) => { calls.notified.push({ title, message }); },
    shouldNotify,
    // Inject the usage log so tests never write to ~/.claude.
    appendUsage: (_p, reading) => { calls.loggedUsage = reading; return true; },
    usageLogPath: '/tmp/test-usage.jsonl',
    // Inject the snooze gate so tests never read the real temp-dir marker.
    snoozeUntil,
  };
}

test('--statusline: plain emoji + percentages', async () => {
  const out = await runCli('--statusline', '/proj', deps(SAMPLE));
  assert.equal(out, '🟢 Limit session: 72% → 06:00 · 🟢 Week Limit: 39% → Wednesday 6/3/2026 10:00');
});

test('--context: under threshold -> info, no guard directive', async () => {
  const out = JSON.parse(await runCli('--context', '/proj', deps(SAMPLE)));
  assert.equal(out.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(out.hookSpecificOutput.additionalContext, /Limit session: 72%/);
  assert.doesNotMatch(out.hookSpecificOutput.additionalContext, /PŘEKROČEN/);
});

test('--context: breach -> guard directive present', async () => {
  const out = JSON.parse(await runCli('--context', '/proj', deps(BREACH)));
  assert.match(out.hookSpecificOutput.additionalContext, /THRESHOLD EXCEEDED/);
  assert.match(out.hookSpecificOutput.additionalContext, /\.claude\/RESUME\.md/);
});

test('--context: custom guardAction overrides built-in directive', async () => {
  const d = deps(BREACH, { guardAction: 'Zavolej manželce a vypni server.' });
  const out = JSON.parse(await runCli('--context', '/proj', d));
  assert.match(out.hookSpecificOutput.additionalContext, /THRESHOLD EXCEEDED/);
  assert.match(out.hookSpecificOutput.additionalContext, /Zavolej manželce a vypni server\./);
});

test('--statusline: locale switches weekday language', async () => {
  const out = await runCli('--statusline', '/proj', deps(SAMPLE, { locale: 'cs-CZ' }));
  assert.equal(out, '🟢 Limit relace: 72% → 06:00 · 🟢 Týdenní limit: 39% → středa 3/6/2026 10:00');
});

test('--stop: breach + no handoff -> block to run guard', async () => {
  const out = JSON.parse(await runCli('--stop', '/proj', deps(BREACH, { handoffExists: false })));
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /guard/i);
});

test('--stop: 7d breach alone (5h under threshold) -> block', async () => {
  const breach7d = { five_hour: { utilization: 40, resets_at: '2026-05-31T06:00:00+02:00' },
                     seven_day: { utilization: 96, resets_at: '2026-06-03T10:00:00+02:00' } };
  const out = JSON.parse(await runCli('--stop', '/proj', deps(breach7d, { handoffExists: false })));
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /seven_day/);
});

test('--stop: custom guardAction appears in block reason', async () => {
  const d = deps(BREACH, { handoffExists: false, guardAction: 'Zavolej manželce a vypni server.' });
  const out = JSON.parse(await runCli('--stop', '/proj', d));
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /Zavolej manželce a vypni server\./);
});

test('--stop: breach + stale handoff present -> still blocks (a pre-existing handoff must not disable the guard; the per-window marker prevents loops)', async () => {
  const out = JSON.parse(await runCli('--stop', '/proj', deps(BREACH, { handoffExists: true })));
  assert.equal(out.decision, 'block');
});

test('--stop: under threshold -> allow stop', async () => {
  const out = JSON.parse(await runCli('--stop', '/proj', deps(SAMPLE)));
  assert.deepEqual(out, {});
});

test('--resume-check: handoff exists -> SessionStart context', async () => {
  const out = JSON.parse(await runCli('--resume-check', '/proj', deps(SAMPLE, { handoffExists: true })));
  assert.equal(out.hookSpecificOutput.hookEventName, 'SessionStart');
  assert.match(out.hookSpecificOutput.additionalContext, /RESUME\.md/);
});

test('--resume-check: no handoff -> empty object', async () => {
  const out = JSON.parse(await runCli('--resume-check', '/proj', deps(SAMPLE, { handoffExists: false })));
  assert.deepEqual(out, {});
});

test('--statusline: timeFormat 12 -> 12h same-day time', async () => {
  const sample = { five_hour: { utilization: 72, resets_at: '2026-05-31T05:00:00+02:00' },
                   seven_day: { utilization: 39, resets_at: '2026-06-03T10:00:00+02:00' } };
  const out = await runCli('--statusline', '/proj', deps(sample, { timeFormat: '12' }));
  assert.match(out.replace(/ /g, ' '), /Limit session: 72% → 5:00 AM/);
});

test('--statusline: authError -> key glyph', async () => {
  const out = await runCli('--statusline', '/proj', deps({ authError: 'no-token' }));
  assert.equal(out, '🔑 sign in');
});

test('--statusline: ascii style renders plain', async () => {
  const out = await runCli('--statusline', '/proj', deps(SAMPLE, { style: 'ascii' }));
  assert.match(out, /\[OK\] Limit session: 72% -> 06:00 \| \[OK\] Week Limit: 39% -> Wednesday 6\/3\/2026 10:00/);
});

test('--context: czech locale keeps czech directive', async () => {
  const out = JSON.parse(await runCli('--context', '/proj', deps(BREACH, { locale: 'cs-CZ' })));
  assert.match(out.hookSpecificOutput.additionalContext, /PŘEKROČEN PRÁH/);
});

test('--stop: already blocked this window -> allow stop (no loop)', async () => {
  const out = JSON.parse(await runCli('--stop', '/proj', deps(BREACH, { handoffExists: false, shouldBlockStop: () => false })));
  assert.deepEqual(out, {});
});

test('--stop: window key is scoped to the project cwd', async () => {
  let seen;
  const sb = (k) => { seen = k; return true; };
  await runCli('--stop', '/projA', deps(BREACH, { handoffExists: false, shouldBlockStop: sb }));
  assert.match(seen, /^\/projA\|/);
  assert.match(seen, /2026-05-31T06:00:00/); // includes the breached limit's reset time
});

// Shape produced by usageFromRateLimits: utilization + resets_at as ms timestamps (not ISO strings).
const STDIN_FULL = { five_hour: { utilization: 72, resets_at: Date.parse('2026-05-31T06:00:00+02:00') },
                     seven_day: { utilization: 39, resets_at: Date.parse('2026-06-03T10:00:00+02:00') } };

test('--statusline: complete stdinUsage -> formats from stdin, writes cache, no getUsage', async () => {
  const calls = {};
  const out = await runCli('--statusline', '/proj', deps(undefined, { stdinUsage: STDIN_FULL, calls }));
  assert.equal(out, '🟢 Limit session: 72% → 06:00 · 🟢 Week Limit: 39% → Wednesday 6/3/2026 10:00');
  assert.equal(calls.getUsage, 0);
  assert.deepEqual(calls.wrote, STDIN_FULL);
});

test('--statusline: partial stdinUsage -> falls back to getUsage, no cache write', async () => {
  const calls = {};
  const partial = { five_hour: { utilization: 72, resets_at: Date.parse('2026-05-31T06:00:00+02:00') } };
  const out = await runCli('--statusline', '/proj', deps(SAMPLE, { stdinUsage: partial, calls }));
  assert.equal(out, '🟢 Limit session: 72% → 06:00 · 🟢 Week Limit: 39% → Wednesday 6/3/2026 10:00');
  assert.equal(calls.getUsage, 1);
  assert.equal(calls.wrote, null);
});

test('--statusline: stdin covers windows but one reset has passed -> re-queries getUsage, no cache write', async () => {
  const calls = {};
  // NOW = 2026-05-31T01:00; five_hour reset at 00:00 is already in the past => stale.
  const expired = { five_hour: { utilization: 60, resets_at: Date.parse('2026-05-31T00:00:00+02:00') },
                    seven_day: { utilization: 39, resets_at: Date.parse('2026-06-03T10:00:00+02:00') } };
  const out = await runCli('--statusline', '/proj', deps(SAMPLE, { stdinUsage: expired, calls }));
  assert.equal(out, '🟢 Limit session: 72% → 06:00 · 🟢 Week Limit: 39% → Wednesday 6/3/2026 10:00');
  assert.equal(calls.getUsage, 1);
  assert.equal(calls.wrote, null);
});

test('--statusline: no stdinUsage -> getUsage path (today behavior)', async () => {
  const calls = {};
  await runCli('--statusline', '/proj', deps(SAMPLE, { stdinUsage: null, calls }));
  assert.equal(calls.getUsage, 1);
  assert.equal(calls.wrote, null);
});

test('--stop: ignores stdinUsage, always uses getUsage', async () => {
  const calls = {};
  await runCli('--stop', '/proj', deps(BREACH, { handoffExists: false, stdinUsage: STDIN_FULL, calls }));
  assert.equal(calls.getUsage, 1);
  assert.equal(calls.wrote, null);
});

test('--context: ignores stdinUsage, always uses getUsage', async () => {
  const calls = {};
  await runCli('--context', '/proj', deps(SAMPLE, { stdinUsage: STDIN_FULL, calls }));
  assert.equal(calls.getUsage, 1);
  assert.equal(calls.wrote, null);
});

// --- warn_action / two-stage guard tests ---

// Usage at 84%: inside [warnBand=80, threshold=90) — should produce warn notice, no block
const WARN = { five_hour: { utilization: 84, resets_at: '2026-05-31T06:00:00+02:00' },
               seven_day: { utilization: 40, resets_at: '2026-06-03T10:00:00+02:00' } };

test('--context: warn band hit -> warn notice appended, no decision:block', async () => {
  const out = JSON.parse(await runCli('--context', '/proj', deps(WARN, { warnBand: 80 })));
  assert.equal(out.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(out.hookSpecificOutput.additionalContext, /APPROACHING LIMIT/);
  assert.match(out.hookSpecificOutput.additionalContext, /five_hour/); // raw window key intentionally passed — mirrors breach() behaviour
  // decision:block must NOT appear in context output
  assert.doesNotMatch(JSON.stringify(out), /decision.*block/);
});

test('--context: warn band hit -> custom warnAction overrides default', async () => {
  const d = deps(WARN, { warnBand: 80, warnAction: 'Custom warn directive here.' });
  const out = JSON.parse(await runCli('--context', '/proj', d));
  assert.match(out.hookSpecificOutput.additionalContext, /Custom warn directive here\./);
});

test('--context: warn band hit -> czech locale uses czech warn message', async () => {
  const out = JSON.parse(await runCli('--context', '/proj', deps(WARN, { warnBand: 80, locale: 'cs-CZ' })));
  assert.match(out.hookSpecificOutput.additionalContext, /BLÍŽÍ SE LIMIT/);
});

test('--context: breach (>=threshold) -> breach path, no warn notice added on top', async () => {
  const out = JSON.parse(await runCli('--context', '/proj', deps(BREACH)));
  assert.match(out.hookSpecificOutput.additionalContext, /THRESHOLD EXCEEDED/);
  assert.doesNotMatch(out.hookSpecificOutput.additionalContext, /APPROACHING LIMIT/);
});

test('--stop: only in warn band (84% < threshold 90) -> {} (unchanged)', async () => {
  const out = JSON.parse(await runCli('--stop', '/proj', deps(WARN, { warnBand: 80 })));
  assert.deepEqual(out, {});
});

// --- B3: burn-rate projection ---
test('runCli --statusline: appends a history reading with watched utilizations', async () => {
  const calls = {};
  const out = await runCli('--statusline', '/proj', deps(SAMPLE, { stdinUsage: SAMPLE, calls }));
  assert.equal(calls.appended.ts, NOW.getTime());
  assert.equal(calls.appended.five_hour, 72);
  assert.equal(calls.appended.seven_day, 39);
  assert.doesNotMatch(out, /📈/); // projection off by default
});

test('runCli --statusline: also records the reading in the long-lived usage log', async () => {
  const calls = {};
  await runCli('--statusline', '/proj', deps(SAMPLE, { stdinUsage: SAMPLE, calls }));
  assert.equal(calls.loggedUsage.ts, NOW.getTime());
  assert.equal(calls.loggedUsage.five_hour, 72);
});

test('runCli --statusline: projection on appends trend segment from rising history', async () => {
  const now = NOW.getTime();
  const history = [
    { ts: now - 120000, five_hour: 70 },
    { ts: now - 60000, five_hour: 71 },
    { ts: now, five_hour: 72 },
  ];
  const out = await runCli('--statusline', '/proj', deps(SAMPLE, { stdinUsage: SAMPLE, projectionDisplay: 'on', history }));
  // 72 -> 95 at ~1%/min ≈ 23 min
  assert.match(out, /📈 ~23m to 95%$/);
});

test('runCli --statusline: projection on but flat history -> no trend segment', async () => {
  const now = NOW.getTime();
  const history = [{ ts: now - 60000, five_hour: 72 }, { ts: now, five_hour: 72 }];
  const out = await runCli('--statusline', '/proj', deps(SAMPLE, { stdinUsage: SAMPLE, projectionDisplay: 'on', history }));
  assert.doesNotMatch(out, /📈/);
});

// --- C1: OS notifications ---
test('runCli --statusline: notifications on + breach -> breach toast fired', async () => {
  const calls = {};
  await runCli('--statusline', '/proj', deps(BREACH, { stdinUsage: BREACH, notifications: 'on', calls }));
  assert.equal(calls.notified.length, 1);
  assert.match(calls.notified[0].message, /five_hour/);
  assert.match(calls.notified[0].message, /threshold/i);
});

test('runCli --statusline: notifications on + warn band -> warn toast fired', async () => {
  const calls = {};
  await runCli('--statusline', '/proj', deps(WARN, { stdinUsage: WARN, notifications: 'on', calls }));
  assert.equal(calls.notified.length, 1);
  assert.match(calls.notified[0].message, /five_hour/);
  assert.match(calls.notified[0].message, /Approaching/i);
});

test('runCli --statusline: notifications on but all green -> no toast', async () => {
  const calls = {};
  await runCli('--statusline', '/proj', deps(SAMPLE, { stdinUsage: SAMPLE, notifications: 'on', calls }));
  assert.equal(calls.notified.length, 0);
});

test('runCli --statusline: notifications off -> no toast even on breach', async () => {
  const calls = {};
  await runCli('--statusline', '/proj', deps(BREACH, { stdinUsage: BREACH, notifications: 'off', calls }));
  assert.equal(calls.notified.length, 0);
});

test('runCli --statusline: shouldNotify false (already notified) -> no repeat toast', async () => {
  const calls = {};
  await runCli('--statusline', '/proj', deps(BREACH, { stdinUsage: BREACH, notifications: 'on', shouldNotify: () => false, calls }));
  assert.equal(calls.notified.length, 0);
});

test('runCli --statusline: notifications on + a window reset -> reset toast', async () => {
  // previous reading high (88), current stdin low (5) => five_hour reset
  const reset = { five_hour: { utilization: 5, resets_at: '2026-05-31T06:00:00+02:00' },
                  seven_day: { utilization: 39, resets_at: '2026-06-03T10:00:00+02:00' } };
  const history = [{ ts: 1, five_hour: 88, seven_day: 39 }];
  const calls = {};
  await runCli('--statusline', '/proj', deps(reset, { stdinUsage: reset, notifications: 'on', history, calls }));
  assert.ok(calls.notified.some((n) => /reset|obnovil/i.test(n.message) && /five_hour/.test(n.message)));
});

test('runCli --statusline: notifications on, no prior history -> no reset toast', async () => {
  const reset = { five_hour: { utilization: 5, resets_at: '2026-05-31T06:00:00+02:00' },
                  seven_day: { utilization: 39, resets_at: '2026-06-03T10:00:00+02:00' } };
  const calls = {};
  await runCli('--statusline', '/proj', deps(reset, { stdinUsage: reset, notifications: 'on', history: [], calls }));
  assert.equal(calls.notified.length, 0);
});

// --- E4: snooze gating ---
test('--stop: snoozed -> does not block even on breach', async () => {
  const out = JSON.parse(await runCli('--stop', '/proj', deps(BREACH, { handoffExists: false, snoozeUntil: () => 9_999_999_999_999 })));
  assert.deepEqual(out, {});
});

test('--context: snoozed -> no breach directive', async () => {
  const out = JSON.parse(await runCli('--context', '/proj', deps(BREACH, { snoozeUntil: () => 9_999_999_999_999 })));
  assert.doesNotMatch(out.hookSpecificOutput.additionalContext, /THRESHOLD EXCEEDED|PŘEKROČEN/);
});

test('--context: not snoozed -> breach directive still present', async () => {
  const out = JSON.parse(await runCli('--context', '/proj', deps(BREACH)));
  assert.match(out.hookSpecificOutput.additionalContext, /THRESHOLD EXCEEDED/);
});

// --- auto watch mode (model-aware, usage-driven) ---

const OPUS_USED = { five_hour: { utilization: 10, resets_at: '2026-05-31T06:00:00+02:00' },
                    seven_day: { utilization: 20, resets_at: '2026-06-03T10:00:00+02:00' },
                    seven_day_opus: { utilization: 60, resets_at: '2026-06-03T10:00:00+02:00' } };

test('--statusline: auto shows the opus window when it is in use', async () => {
  const out = await runCli('--statusline', '/proj', deps(OPUS_USED, { watch: 'auto' }));
  assert.match(out, /Opus/); // the seven_day_opus label is rendered under auto
});

test('--stop: auto breaches on a per-model window over threshold', async () => {
  const opusBreach = { five_hour: { utilization: 10, resets_at: '2026-05-31T06:00:00+02:00' },
                       seven_day: { utilization: 20, resets_at: '2026-06-03T10:00:00+02:00' },
                       seven_day_opus: { utilization: 96, resets_at: '2026-06-03T10:00:00+02:00' } };
  const out = JSON.parse(await runCli('--stop', '/proj', deps(opusBreach, { watch: 'auto', threshold: 90, handoffExists: false })));
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /seven_day_opus/);
});

test('--stop: auto does NOT breach on an unused per-model window (utilization 0)', async () => {
  const unused = { five_hour: { utilization: 10, resets_at: '2026-05-31T06:00:00+02:00' },
                   seven_day: { utilization: 20, resets_at: '2026-06-03T10:00:00+02:00' },
                   seven_day_opus: { utilization: 0, resets_at: '2026-06-03T10:00:00+02:00' } };
  const out = JSON.parse(await runCli('--stop', '/proj', deps(unused, { watch: 'auto', threshold: 90, handoffExists: false })));
  assert.deepEqual(out, {});
});
