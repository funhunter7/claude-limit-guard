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

function deps(usage, { handoffExists = false, locale = 'en-US', guardAction = null, timeFormat = '24', style = 'emoji', shouldBlockStop = () => true, stdinUsage = null, calls = {} } = {}) {
  calls.getUsage = 0;
  calls.wrote = null;
  return {
    loadConfig: () => ({
      threshold: 95,
      watch: ['five_hour', 'seven_day'],
      handoff: '.claude/RESUME.md',
      locale,
      guardAction,
      timeFormat,
      style,
    }),
    getUsage: async () => { calls.getUsage += 1; return usage; },
    handoffExists: () => handoffExists,
    shouldBlockStop,
    now: () => NOW,
    stdinUsage,
    writeCache: (_p, data) => { calls.wrote = data; return true; },
    cachePath: '/tmp/test-cache.json',
  };
}

test('--statusline: plain emoji + percentages', async () => {
  const out = await runCli('--statusline', '/proj', deps(SAMPLE));
  assert.equal(out, '🟢 5h 72% →06:00 · 🟢 7d 39% →Wed');
});

test('--context: under threshold -> info, no guard directive', async () => {
  const out = JSON.parse(await runCli('--context', '/proj', deps(SAMPLE)));
  assert.equal(out.hookSpecificOutput.hookEventName, 'UserPromptSubmit');
  assert.match(out.hookSpecificOutput.additionalContext, /5h 72%/);
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
  assert.equal(out, '🟢 5h 72% →06:00 · 🟢 7d 39% →st');
});

test('--stop: breach + no handoff -> block to run guard', async () => {
  const out = JSON.parse(await runCli('--stop', '/proj', deps(BREACH, { handoffExists: false })));
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /guard/i);
});

test('--stop: custom guardAction appears in block reason', async () => {
  const d = deps(BREACH, { handoffExists: false, guardAction: 'Zavolej manželce a vypni server.' });
  const out = JSON.parse(await runCli('--stop', '/proj', d));
  assert.equal(out.decision, 'block');
  assert.match(out.reason, /Zavolej manželce a vypni server\./);
});

test('--stop: breach + handoff already exists -> allow stop (no loop)', async () => {
  const out = JSON.parse(await runCli('--stop', '/proj', deps(BREACH, { handoffExists: true })));
  assert.deepEqual(out, {});
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
  assert.match(out.replace(/ /g, ' '), /5h 72% →5:00 AM/);
});

test('--statusline: authError -> key glyph', async () => {
  const out = await runCli('--statusline', '/proj', deps({ authError: 'no-token' }));
  assert.equal(out, '🔑 sign in');
});

test('--statusline: ascii style renders plain', async () => {
  const out = await runCli('--statusline', '/proj', deps(SAMPLE, { style: 'ascii' }));
  assert.match(out, /\[OK\] 5h 72% ->06:00 \| \[OK\] 7d 39% ->Wed/);
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
  assert.equal(out, '🟢 5h 72% →06:00 · 🟢 7d 39% →Wed');
  assert.equal(calls.getUsage, 0);
  assert.deepEqual(calls.wrote, STDIN_FULL);
});

test('--statusline: partial stdinUsage -> falls back to getUsage, no cache write', async () => {
  const calls = {};
  const partial = { five_hour: { utilization: 72, resets_at: Date.parse('2026-05-31T06:00:00+02:00') } };
  const out = await runCli('--statusline', '/proj', deps(SAMPLE, { stdinUsage: partial, calls }));
  assert.equal(out, '🟢 5h 72% →06:00 · 🟢 7d 39% →Wed');
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
});;
