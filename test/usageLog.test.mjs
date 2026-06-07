import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendUsage, readUsageLog, summarize } from '../lib/usageLog.mjs';

const BASE = 1_700_000_000_000;
const DAY = 24 * 60 * 60 * 1000;

test('readUsageLog: parses JSONL, skips blank/garbage lines', () => {
  const raw = `${JSON.stringify({ ts: BASE, five_hour: 10 })}\n\nnot json\n${JSON.stringify({ ts: BASE + 1, five_hour: 20 })}\n`;
  const out = readUsageLog('x', () => raw);
  assert.deepEqual(out, [{ ts: BASE, five_hour: 10 }, { ts: BASE + 1, five_hour: 20 }]);
});

test('readUsageLog: missing file -> []', () => {
  assert.deepEqual(readUsageLog('x', () => { throw new Error('ENOENT'); }), []);
});

test('appendUsage: appends a line when enough time has passed', () => {
  let stored = `${JSON.stringify({ ts: BASE, five_hour: 10 })}\n`;
  const readFile = () => stored;
  const writeFile = (_p, d) => { stored = d; };
  const ok = appendUsage('x', { ts: BASE + 90000, five_hour: 20 }, BASE + 90000, { readFile, writeFile });
  assert.equal(ok, true);
  assert.equal(readUsageLog('x', () => stored).length, 2);
});

test('appendUsage: cheap-skips via recent file mtime without reading the whole log', () => {
  let readCalled = false;
  const ok = appendUsage('x', { ts: BASE, five_hour: 1 }, BASE, {
    statFile: () => BASE - 30000, // last modified 30s ago, under the 60s throttle
    readFile: () => { readCalled = true; return ''; },
    writeFile: () => {},
  });
  assert.equal(ok, false);
  assert.equal(readCalled, false); // did not parse the log at all
});

test('appendUsage: throttles within the minimum interval', () => {
  let stored = `${JSON.stringify({ ts: BASE, five_hour: 10 })}\n`;
  const readFile = () => stored;
  const writeFile = (_p, d) => { stored = d; };
  const ok = appendUsage('x', { ts: BASE + 30000, five_hour: 20 }, BASE + 30000, { readFile, writeFile });
  assert.equal(ok, false);
  assert.equal(readUsageLog('x', () => stored).length, 1);
});

test('appendUsage: prunes entries older than 7 days', () => {
  const old = JSON.stringify({ ts: BASE - 8 * DAY, five_hour: 99 });
  const recent = JSON.stringify({ ts: BASE - 1 * DAY, five_hour: 50 });
  let stored = `${old}\n${recent}\n`;
  const readFile = () => stored;
  const writeFile = (_p, d) => { stored = d; };
  appendUsage('x', { ts: BASE, five_hour: 60 }, BASE, { readFile, writeFile });
  const kept = readUsageLog('x', () => stored);
  assert.equal(kept.length, 2); // 8-day-old pruned; recent + new kept
  assert.equal(kept.some((l) => l.five_hour === 99), false);
});

test('appendUsage: never throws on write failure', () => {
  let r;
  assert.doesNotThrow(() => {
    r = appendUsage('x', { ts: BASE, five_hour: 1 }, BASE, { readFile: () => '', writeFile: () => { throw new Error('EACCES'); } });
  });
  assert.equal(r, false);
});

test('summarize: peaks, reset count and reading count', () => {
  const lines = [
    { ts: BASE, five_hour: 40, seven_day: 30 },
    { ts: BASE + 60000, five_hour: 90, seven_day: 35 },
    { ts: BASE + 120000, five_hour: 5, seven_day: 40 }, // five_hour reset (90 -> 5)
    { ts: BASE + 180000, five_hour: 20, seven_day: 42 },
  ];
  const s = summarize(lines, BASE + 180000);
  assert.equal(s.count, 4);
  assert.equal(s.peakFiveHour, 90);
  assert.equal(s.peakSevenDay, 42);
  assert.equal(s.resets, 1);
  assert.equal(s.sinceMs, BASE);
});

test('summarize: empty -> zeros/nulls', () => {
  const s = summarize([], BASE);
  assert.equal(s.count, 0);
  assert.equal(s.peakFiveHour, null);
  assert.equal(s.peakSevenDay, null);
  assert.equal(s.resets, 0);
});
