import { test } from 'node:test';
import assert from 'node:assert/strict';
import { runCli } from '../bin/usage.mjs';

const SAMPLE = { five_hour: { utilization: 72, resets_at: '2026-05-31T06:00:00+02:00' },
                 seven_day: { utilization: 39, resets_at: '2026-06-03T10:00:00+02:00' } };
const BREACH = { five_hour: { utilization: 96, resets_at: '2026-05-31T06:00:00+02:00' },
                 seven_day: { utilization: 39, resets_at: '2026-06-03T10:00:00+02:00' } };
const NOW = new Date('2026-05-31T01:00:00+02:00');

function deps(usage, { handoffExists = false, locale = 'en-US', guardAction = null, timeFormat = '24' } = {}) {
  return {
    loadConfig: () => ({
      threshold: 95,
      watch: ['five_hour', 'seven_day'],
      handoff: '.claude/RESUME.md',
      locale,
      guardAction,
      timeFormat,
    }),
    getUsage: async () => usage,
    handoffExists: () => handoffExists,
    now: () => NOW,
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
  assert.match(out.hookSpecificOutput.additionalContext, /PŘEKROČEN PRÁH/);
  assert.match(out.hookSpecificOutput.additionalContext, /\.claude\/RESUME\.md/);
});

test('--context: custom guardAction overrides built-in directive', async () => {
  const d = deps(BREACH, { guardAction: 'Zavolej manželce a vypni server.' });
  const out = JSON.parse(await runCli('--context', '/proj', d));
  assert.match(out.hookSpecificOutput.additionalContext, /PŘEKROČEN PRÁH/);
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
