import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderStatus } from '../bin/status.mjs';

// --- basic config + health display ---

test('renderStatus: shows resolved config and health', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour', 'seven_day'], locale: 'cs-CZ' },
    { tokenPresent: true, cacheAgeMs: 1200, statusLineWired: true },
  );
  assert.match(out, /threshold.*90/);
  assert.match(out, /token.*ok/i);
  // cs-only: Czech config section header and default guard-action label
  assert.match(out, /Konfigurace/);
  assert.match(out, /výchozí/);
});

// --- token present / missing ---

test('renderStatus (en): token present -> ok wording', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'en-US' },
    { tokenPresent: true, cacheAgeMs: null, statusLineWired: false },
  );
  assert.match(out, /token/i);
  assert.match(out, /ok/i);
});

test('renderStatus (en): token missing -> missing wording', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'en-US' },
    { tokenPresent: false, cacheAgeMs: null, statusLineWired: false },
  );
  assert.match(out, /token/i);
  assert.match(out, /missing/i);
});

test('renderStatus (cs): token present -> ok wording in Czech', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'cs-CZ' },
    { tokenPresent: true, cacheAgeMs: null, statusLineWired: false },
  );
  assert.match(out, /token/i);
  // Czech "ok" is the same, but we assert something locale-specific too
  assert.match(out, /ok/i);
  // cs-only: Czech health section header and default guard-action label
  assert.match(out, /Zdraví/);
  assert.match(out, /výchozí/);
});

test('renderStatus (cs): token missing -> Czech missing wording', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'cs-CZ' },
    { tokenPresent: false, cacheAgeMs: null, statusLineWired: false },
  );
  assert.match(out, /token/i);
  assert.match(out, /chybí/i);
});

// --- statusLine wired / not wired ---

test('renderStatus (en): statusLine wired -> wired wording', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'en-US' },
    { tokenPresent: true, cacheAgeMs: null, statusLineWired: true },
  );
  assert.match(out, /status.?line/i);
  assert.match(out, /wired/i);
});

test('renderStatus (en): statusLine not wired -> not wired wording', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'en-US' },
    { tokenPresent: true, cacheAgeMs: null, statusLineWired: false },
  );
  assert.match(out, /status.?line/i);
  assert.match(out, /not wired/i);
});

test('renderStatus (cs): statusLine wired -> Czech wired wording', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'cs-CZ' },
    { tokenPresent: true, cacheAgeMs: null, statusLineWired: true },
  );
  assert.match(out, /status.?line/i);
  assert.match(out, /zapoj/i); // "zapojena"
});

test('renderStatus (cs): statusLine not wired -> Czech not wired wording', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'cs-CZ' },
    { tokenPresent: true, cacheAgeMs: null, statusLineWired: false },
  );
  assert.match(out, /status.?line/i);
  assert.match(out, /nezapoj/i); // "nezapojena"
});

// --- cacheAgeMs: fresh value vs null ---

test('renderStatus (en): cacheAgeMs fresh -> shows age in seconds', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'en-US' },
    { tokenPresent: true, cacheAgeMs: 5000, statusLineWired: true },
  );
  assert.match(out, /cache/i);
  assert.match(out, /5s/);
});

test('renderStatus (en): cacheAgeMs null -> no cache wording', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'en-US' },
    { tokenPresent: true, cacheAgeMs: null, statusLineWired: true },
  );
  assert.match(out, /cache/i);
  assert.match(out, /no cache/i);
});

test('renderStatus (cs): cacheAgeMs fresh -> Czech age wording', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'cs-CZ' },
    { tokenPresent: true, cacheAgeMs: 5000, statusLineWired: true },
  );
  assert.match(out, /cache/i);
  assert.match(out, /5s/);
});

test('renderStatus (cs): cacheAgeMs null -> Czech no-cache wording', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'cs-CZ' },
    { tokenPresent: true, cacheAgeMs: null, statusLineWired: true },
  );
  assert.match(out, /cache/i);
  assert.match(out, /žádná/i); // "žádná cache"
});

// --- watch windows shown ---

test('renderStatus: shows watched windows in output', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour', 'seven_day'], locale: 'en-US' },
    { tokenPresent: true, cacheAgeMs: null, statusLineWired: true },
  );
  assert.match(out, /five_hour/);
  assert.match(out, /seven_day/);
});

// --- v0.8 options shown ---

test('renderStatus: shows warnAction, per-window thresholds and projectionDisplay', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour', 'seven_day'], locale: 'en-US',
      warnAction: 'Wrap up the step.', thresholdFiveHour: 80, thresholdSevenDay: null,
      projectionDisplay: 'on' },
    { tokenPresent: true, cacheAgeMs: null, statusLineWired: true },
  );
  assert.match(out, /warnAction.*Wrap up the step/);
  assert.match(out, /thresholdFiveHour.*80/);
  assert.match(out, /thresholdSevenDay.*-/);
  assert.match(out, /projectionDisplay.*on/);
});

test('renderStatus: default warnAction shows the localized default label', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'cs-CZ', warnAction: null },
    { tokenPresent: true, cacheAgeMs: null, statusLineWired: true },
  );
  assert.match(out, /warnAction.*výchozí/);
});

// --- history health line ---

test('renderStatus (en): history readings count shown', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'en-US' },
    { tokenPresent: true, cacheAgeMs: null, statusLineWired: true, historyCount: 7 },
  );
  assert.match(out, /history.*7/i);
});

test('renderStatus (en): no history -> no-data wording', () => {
  const out = renderStatus(
    { threshold: 90, watch: ['five_hour'], locale: 'en-US' },
    { tokenPresent: true, cacheAgeMs: null, statusLineWired: true, historyCount: 0 },
  );
  assert.match(out, /history.*no data/i);
});
