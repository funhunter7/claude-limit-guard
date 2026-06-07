import { test } from 'node:test';
import assert from 'node:assert/strict';
import { appendReading, readHistory, projectMinutesToThreshold } from '../lib/history.mjs';

const BASE = 1_700_000_000_000;

test('projectMinutesToThreshold: rising ~1%/min from 82 reaches 90 in ~8 min', () => {
  const h = [
    { ts: BASE, five_hour: 80 },
    { ts: BASE + 60000, five_hour: 81 },
    { ts: BASE + 120000, five_hour: 82 },
  ];
  const m = projectMinutesToThreshold(h, 'five_hour', 90, BASE + 120000);
  assert.ok(Math.abs(m - 8) <= 1, `expected ~8, got ${m}`);
});

test('projectMinutesToThreshold: flat/declining -> null', () => {
  assert.equal(
    projectMinutesToThreshold(
      [{ ts: BASE, five_hour: 50 }, { ts: BASE + 60000, five_hour: 50 }],
      'five_hour', 90, BASE + 60000,
    ),
    null,
  );
  assert.equal(
    projectMinutesToThreshold(
      [{ ts: BASE, five_hour: 60 }, { ts: BASE + 60000, five_hour: 55 }],
      'five_hour', 90, BASE + 60000,
    ),
    null,
  );
});

test('projectMinutesToThreshold: fewer than 2 usable points -> null', () => {
  assert.equal(projectMinutesToThreshold([], 'five_hour', 90, BASE), null);
  assert.equal(projectMinutesToThreshold([{ ts: BASE, five_hour: 80 }], 'five_hour', 90, BASE), null);
  // points missing the requested key don't count
  assert.equal(
    projectMinutesToThreshold([{ ts: BASE, seven_day: 80 }, { ts: BASE + 60000, seven_day: 81 }], 'five_hour', 90, BASE + 60000),
    null,
  );
});

test('projectMinutesToThreshold: already at/above threshold -> null', () => {
  const h = [
    { ts: BASE, five_hour: 88 },
    { ts: BASE + 60000, five_hour: 89 },
    { ts: BASE + 120000, five_hour: 90 },
  ];
  assert.equal(projectMinutesToThreshold(h, 'five_hour', 90, BASE + 120000), null);
});

test('readHistory: missing/garbage file -> []', () => {
  assert.deepEqual(readHistory('x', () => { throw new Error('ENOENT'); }), []);
  assert.deepEqual(readHistory('x', () => 'not json'), []);
  assert.deepEqual(readHistory('x', () => '{"not":"array"}'), []);
});

test('appendReading: appends and trims to max most-recent readings', () => {
  let stored = JSON.stringify([{ ts: BASE, five_hour: 1 }, { ts: BASE + 1, five_hour: 2 }]);
  const readFile = () => stored;
  const writeFile = (_p, data) => { stored = data; };
  const ok = appendReading('x', { ts: BASE + 2, five_hour: 3 }, 2, { readFile, writeFile });
  assert.equal(ok, true);
  const after = JSON.parse(stored);
  assert.deepEqual(after, [{ ts: BASE + 1, five_hour: 2 }, { ts: BASE + 2, five_hour: 3 }]);
});

test('appendReading: never throws, returns false on write failure', () => {
  const readFile = () => '[]';
  const writeFile = () => { throw new Error('EACCES'); };
  let ok;
  assert.doesNotThrow(() => { ok = appendReading('x', { ts: BASE, five_hour: 1 }, 30, { readFile, writeFile }); });
  assert.equal(ok, false);
});

test('appendReading: throttles when the last reading is newer than minIntervalMs', () => {
  let stored = JSON.stringify([{ ts: BASE, five_hour: 1 }]);
  const readFile = () => stored;
  const writeFile = (_p, data) => { stored = data; };
  // 30s after the last reading, with a 60s throttle -> skipped, nothing written.
  const ok = appendReading('x', { ts: BASE + 30000, five_hour: 2 }, 30, { readFile, writeFile, minIntervalMs: 60000 });
  assert.equal(ok, false);
  assert.deepEqual(JSON.parse(stored), [{ ts: BASE, five_hour: 1 }]);
  // 90s after -> appended.
  const ok2 = appendReading('x', { ts: BASE + 90000, five_hour: 3 }, 30, { readFile, writeFile, minIntervalMs: 60000 });
  assert.equal(ok2, true);
  assert.equal(JSON.parse(stored).length, 2);
});

test('projectMinutesToThreshold: ignores readings before a window reset (large drop)', () => {
  // Old window climbs to 90, resets (90 -> 5), then climbs 1%/min from 5. Fit only the
  // post-reset segment: 7 -> 90 at ~1%/min ≈ 83 min, NOT a fit polluted by the pre-reset run.
  const h = [
    { ts: BASE, five_hour: 80 },
    { ts: BASE + 60000, five_hour: 85 },
    { ts: BASE + 120000, five_hour: 90 },
    { ts: BASE + 180000, five_hour: 5 }, // reset
    { ts: BASE + 240000, five_hour: 6 },
    { ts: BASE + 300000, five_hour: 7 },
  ];
  const m = projectMinutesToThreshold(h, 'five_hour', 90, BASE + 300000);
  assert.ok(m != null && Math.abs(m - 83) <= 2, `expected ~83, got ${m}`);
});

test('projectMinutesToThreshold: latest reading already at/above threshold -> null (no contradictory ETA)', () => {
  // A dip then a spike: the least-squares intercept lands below 90, but the most recent
  // actual reading is 91 — already over. Must not advertise a future ETA.
  const h = [
    { ts: BASE, five_hour: 85 },
    { ts: BASE + 60000, five_hour: 80 },
    { ts: BASE + 120000, five_hour: 91 },
  ];
  assert.equal(projectMinutesToThreshold(h, 'five_hour', 90, BASE + 120000), null);
});

test('projectMinutesToThreshold: too-short time span -> null (avoids noisy extrapolation)', () => {
  // Two readings only 30s apart, rising fast: span < 2 min -> refuse to project.
  const h = [{ ts: BASE, five_hour: 80 }, { ts: BASE + 30000, five_hour: 82 }];
  assert.equal(projectMinutesToThreshold(h, 'five_hour', 90, BASE + 30000), null);
});
