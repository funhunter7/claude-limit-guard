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

test('coerceOptionValue: reset_display enum accepts clock/relative/both', () => {
  assert.equal(coerceOptionValue('reset_display', 'clock'), 'clock');
  assert.equal(coerceOptionValue('reset_display', 'relative'), 'relative');
  assert.equal(coerceOptionValue('reset_display', 'both'), 'both');
  assert.throws(() => coerceOptionValue('reset_display', 'fancy'), /clock, relative, both/);
});

test('CONFIG_OPTIONS: reset_display maps to resetDisplay / reset_display', () => {
  assert.equal(CONFIG_OPTIONS.reset_display.projectKey, 'resetDisplay');
  assert.equal(CONFIG_OPTIONS.reset_display.globalKey, 'reset_display');
  assert.equal(CONFIG_OPTIONS.reset_display.type, 'enum');
  assert.deepEqual(CONFIG_OPTIONS.reset_display.choices, ['clock', 'relative', 'both']);
});

test('coerceOptionValue: projection_display enum accepts off/on', () => {
  assert.equal(coerceOptionValue('projection_display', 'off'), 'off');
  assert.equal(coerceOptionValue('projection_display', 'on'), 'on');
  assert.throws(() => coerceOptionValue('projection_display', 'maybe'), /off, on/);
});

test('CONFIG_OPTIONS: projection_display maps to projectionDisplay / projection_display', () => {
  assert.equal(CONFIG_OPTIONS.projection_display.projectKey, 'projectionDisplay');
  assert.equal(CONFIG_OPTIONS.projection_display.globalKey, 'projection_display');
  assert.equal(CONFIG_OPTIONS.projection_display.type, 'enum');
  assert.deepEqual(CONFIG_OPTIONS.projection_display.choices, ['off', 'on']);
});

test('coerceOptionValue: notifications enum accepts off/on', () => {
  assert.equal(coerceOptionValue('notifications', 'off'), 'off');
  assert.equal(coerceOptionValue('notifications', 'on'), 'on');
  assert.throws(() => coerceOptionValue('notifications', 'sometimes'), /off, on/);
});

test('CONFIG_OPTIONS: notifications maps to notifications / notifications', () => {
  assert.equal(CONFIG_OPTIONS.notifications.projectKey, 'notifications');
  assert.equal(CONFIG_OPTIONS.notifications.globalKey, 'notifications');
  assert.equal(CONFIG_OPTIONS.notifications.type, 'enum');
  assert.deepEqual(CONFIG_OPTIONS.notifications.choices, ['off', 'on']);
});

test('CONFIG_OPTIONS: watch choices include the per-model 7-day windows', () => {
  assert.deepEqual(CONFIG_OPTIONS.watch.choices, ['five_hour', 'seven_day', 'seven_day_opus', 'seven_day_sonnet']);
});

test('coerceOptionValue: watch=auto -> "auto"', () => {
  assert.equal(coerceOptionValue('watch', 'auto'), 'auto');
  assert.equal(coerceOptionValue('watch', ' AUTO '), 'auto');
});
