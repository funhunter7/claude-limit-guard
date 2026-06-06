import { test } from 'node:test';
import assert from 'node:assert/strict';
import { coerceOptionValue, CONFIG_OPTIONS } from '../lib/configOptions.mjs';

test('coerceOptionValue: number within 0-100 passes', () => {
  assert.equal(coerceOptionValue('threshold', '90'), 90);
  assert.equal(coerceOptionValue('warn_band', '0'), 0);
  assert.equal(coerceOptionValue('threshold', '100'), 100);
});

test('coerceOptionValue: number out of range or non-numeric throws', () => {
  assert.throws(() => coerceOptionValue('threshold', '101'), /0.*100/);
  assert.throws(() => coerceOptionValue('threshold', '-1'), /0.*100/);
  assert.throws(() => coerceOptionValue('threshold', 'abc'), /number/i);
});

test('coerceOptionValue: enum must be a known choice', () => {
  assert.equal(coerceOptionValue('time_format', '24'), '24');
  assert.equal(coerceOptionValue('style', 'emoji'), 'emoji');
  assert.throws(() => coerceOptionValue('time_format', '36'), /system, 12, 24/);
  assert.throws(() => coerceOptionValue('style', 'fancy'), /auto, emoji, ascii/);
});

test('coerceOptionValue: list splits, validates choices, dedupes, preserves order', () => {
  assert.deepEqual(coerceOptionValue('watch', 'five_hour,seven_day'), ['five_hour', 'seven_day']);
  assert.deepEqual(coerceOptionValue('watch', ' seven_day , seven_day '), ['seven_day']);
  assert.throws(() => coerceOptionValue('watch', 'bogus'), /five_hour, seven_day/);
  assert.throws(() => coerceOptionValue('watch', '   '), /at least one/i);
});

test('coerceOptionValue: unknown option throws', () => {
  assert.throws(() => coerceOptionValue('nope', 'x'), /unknown option/i);
});

test('coerceOptionValue: locale is not configurable here (system-driven)', () => {
  // locale follows the OS automatically, so it is intentionally absent from the picker.
  assert.equal(CONFIG_OPTIONS.locale, undefined);
  assert.throws(() => coerceOptionValue('locale', 'cs-CZ'), /unknown option/i);
});

test('CONFIG_OPTIONS: maps each option to project (camelCase) and global (snake_case) keys', () => {
  assert.equal(CONFIG_OPTIONS.time_format.projectKey, 'timeFormat');
  assert.equal(CONFIG_OPTIONS.time_format.globalKey, 'time_format');
  assert.equal(CONFIG_OPTIONS.warn_band.projectKey, 'warnBand');
  assert.equal(CONFIG_OPTIONS.warn_band.globalKey, 'warn_band');
  assert.equal(CONFIG_OPTIONS.threshold.projectKey, 'threshold');
  assert.equal(CONFIG_OPTIONS.watch.projectKey, 'watch');
});

test('coerceOptionValue: label_style enum accepts full/short', () => {
  assert.equal(coerceOptionValue('label_style', 'full'), 'full');
  assert.equal(coerceOptionValue('label_style', 'short'), 'short');
  assert.throws(() => coerceOptionValue('label_style', 'tiny'), /full, short/);
});

test('CONFIG_OPTIONS: label_style maps to labelStyle / label_style', () => {
  assert.equal(CONFIG_OPTIONS.label_style.projectKey, 'labelStyle');
  assert.equal(CONFIG_OPTIONS.label_style.globalKey, 'label_style');
  assert.equal(CONFIG_OPTIONS.label_style.type, 'enum');
  assert.deepEqual(CONFIG_OPTIONS.label_style.choices, ['full', 'short']);
});
