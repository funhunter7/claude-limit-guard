import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMessages } from '../lib/messages.mjs';
import en from '../lib/messages/en.mjs';

const LOCALES = ['cs', 'de', 'es', 'fr', 'it', 'pl', 'sk', 'uk', 'ru', 'ja', 'zh', 'ko', 'pt', 'nl', 'tr'];

test('every locale defines the full en key set', async () => {
  const enKeys = Object.keys(en).sort();
  for (const lang of LOCALES) {
    const mod = (await import(`../lib/messages/${lang}.mjs`)).default;
    assert.deepEqual(Object.keys(mod).sort(), enKeys, `${lang} key set differs from en`);
  }
});

test('label sub-objects carry all window keys in every locale', async () => {
  const labelKeys = Object.keys(en.labels).sort();
  const shortKeys = Object.keys(en.labelsShort).sort();
  for (const lang of LOCALES) {
    const mod = (await import(`../lib/messages/${lang}.mjs`)).default;
    assert.deepEqual(Object.keys(mod.labels).sort(), labelKeys, `${lang} labels keys differ`);
    assert.deepEqual(Object.keys(mod.labelsShort).sort(), shortKeys, `${lang} labelsShort keys differ`);
  }
});

test('getMessages: de-DE -> german label (spot check)', () => {
  assert.equal(getMessages('de-DE').labels.five_hour, 'Sitzungslimit:');
});

test('notifyReset names the window', () => {
  assert.match(getMessages('en-US').notifyReset('five_hour'), /five_hour/);
  assert.match(getMessages('cs-CZ').notifyReset('five_hour'), /five_hour/);
});

test('snooze strings present in en/cs', () => {
  for (const loc of ['en-US', 'cs-CZ']) {
    const m = getMessages(loc);
    assert.match(m.snoozeSet('18:00'), /18:00/);
    assert.equal(typeof m.snoozeCleared, 'string');
    assert.equal(typeof m.snoozeNone, 'string');
  }
});

test('setup strings present in en/cs', () => {
  for (const loc of ['en-US', 'cs-CZ']) {
    const m = getMessages(loc);
    assert.equal(typeof m.setupWired, 'string');
    assert.equal(typeof m.setupAlreadyWired, 'string');
    assert.match(m.setupBackedUp('/p/settings.json.bak'), /settings\.json\.bak/);
  }
});

test('getMessages: en-US -> english', () => {
  assert.equal(getMessages('en-US').signIn, 'sign in');
  assert.match(getMessages('en-US').contextLabel('LINE', 95), /Threshold 95%/);
});

test('getMessages: cs-CZ -> czech (verbatim legacy strings)', () => {
  assert.equal(getMessages('cs-CZ').signIn, 'přihlas se');
  assert.match(getMessages('cs-CZ').breach('5h', 'ACT'), /PŘEKROČEN PRÁH \(5h\)\. ACT/);
});

test('getMessages: unknown locale falls back to english', () => {
  // is-IS (Icelandic) is intentionally not a supported locale.
  assert.equal(getMessages('is-IS').signIn, 'sign in');
  assert.equal(getMessages(undefined).signIn, 'sign in');
});

test('getMessages: builders interpolate handoff path', () => {
  assert.match(getMessages('en-US').resume('.claude/RESUME.md'), /\.claude\/RESUME\.md/);
  assert.match(getMessages('en-US').stopReason(95, '5h', 'ACT'), /over threshold 95% \(5h\)\. ACT/);
});

test('getMessages: notification strings name the window and band, both locales', () => {
  const en = getMessages('en-US');
  assert.match(en.notifyTitle, /claude-limit-guard/);
  assert.match(en.notifyWarn('five_hour'), /five_hour/);
  assert.match(en.notifyBreach('seven_day'), /seven_day/);
  const cs = getMessages('cs-CZ');
  assert.match(cs.notifyWarn('five_hour'), /five_hour/);
  assert.match(cs.notifyBreach('seven_day'), /seven_day/);
});

test('getMessages: toThreshold word (en "to" / cs "do")', () => {
  assert.equal(getMessages('en-US').toThreshold, 'to');
  assert.equal(getMessages('cs-CZ').toThreshold, 'do');
  assert.equal(getMessages('is-IS').toThreshold, 'to'); // fallback (unsupported locale)
});

test('getMessages: en handoff directives name branch, files and next step', () => {
  const en = getMessages('en-US');
  for (const directive of [en.stopAction('R.md'), en.contextAction('R.md')]) {
    assert.match(directive, /branch/i);
    assert.match(directive, /files/i);
    assert.match(directive, /next step/i);
  }
});

test('getMessages: cs handoff directives name branch, files and next step', () => {
  const cs = getMessages('cs-CZ');
  // Normalize both the directive and the accented needles to NFC so a composed/decomposed
  // mismatch (possible from cross-platform file editing) can't cause a false negative.
  const nfc = (s) => s.normalize('NFC');
  for (const directive of [nfc(cs.stopAction('R.md')), nfc(cs.contextAction('R.md'))]) {
    assert.match(directive, new RegExp(nfc('git větev'), 'i'));
    assert.match(directive, /soubor/i);
    assert.match(directive, new RegExp(nfc('další krok'), 'i'));
  }
});

test('every interpolated string preserves all its placeholders in every locale', async () => {
  const ALL = ['en', 'cs', 'de', 'es', 'fr', 'it', 'pl', 'sk', 'uk', 'ru', 'ja', 'zh', 'ko', 'pt', 'nl', 'tr'];
  // Keys whose en value is a function receive interpolated args; each arg must survive translation.
  const fnKeys = Object.keys(en).filter((k) => typeof en[k] === 'function');
  for (const lang of ALL) {
    const mod = (await import(`../lib/messages/${lang}.mjs`)).default;
    for (const key of fnKeys) {
      const fn = mod[key];
      assert.equal(typeof fn, 'function', `${lang}.${key} should be a function`);
      const arity = en[key].length; // param count of the canonical en builder
      const markers = Array.from({ length: arity }, (_, i) => `⟦MARK${i}⟧`);
      const out = String(fn(...markers));
      for (const m of markers) {
        assert.ok(out.includes(m), `${lang}.${key} dropped placeholder ${m}`);
      }
    }
  }
});
