import { test } from 'node:test';
import assert from 'node:assert/strict';
import { getMessages } from '../lib/messages.mjs';

test('getMessages: en-US -> english', () => {
  assert.equal(getMessages('en-US').signIn, 'sign in');
  assert.match(getMessages('en-US').contextLabel('LINE', 95), /Threshold 95%/);
});

test('getMessages: cs-CZ -> czech (verbatim legacy strings)', () => {
  assert.equal(getMessages('cs-CZ').signIn, 'přihlas se');
  assert.match(getMessages('cs-CZ').breach('5h', 'ACT'), /PŘEKROČEN PRÁH \(5h\)\. ACT/);
});

test('getMessages: unknown locale falls back to english', () => {
  assert.equal(getMessages('de-DE').signIn, 'sign in');
  assert.equal(getMessages(undefined).signIn, 'sign in');
});

test('getMessages: builders interpolate handoff path', () => {
  assert.match(getMessages('en-US').resume('.claude/RESUME.md'), /\.claude\/RESUME\.md/);
  assert.match(getMessages('en-US').stopReason(95, '5h', 'ACT'), /over threshold 95% \(5h\)\. ACT/);
});

test('getMessages: toThreshold word (en "to" / cs "do")', () => {
  assert.equal(getMessages('en-US').toThreshold, 'to');
  assert.equal(getMessages('cs-CZ').toThreshold, 'do');
  assert.equal(getMessages('de-DE').toThreshold, 'to'); // fallback
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
