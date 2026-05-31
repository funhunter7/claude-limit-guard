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
