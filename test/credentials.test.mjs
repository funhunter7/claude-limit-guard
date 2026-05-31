import { test } from 'node:test';
import assert from 'node:assert/strict';
import { join } from 'node:path';
import { credentialsPath, getToken } from '../lib/credentials.mjs';

test('credentialsPath: uses CLAUDE_CONFIG_DIR when set', () => {
  assert.equal(credentialsPath({ CLAUDE_CONFIG_DIR: '/x' }), join('/x', '.credentials.json'));
});

test('getToken: reads claudeAiOauth.accessToken', () => {
  const readFile = () => JSON.stringify({ claudeAiOauth: { accessToken: 'tok-123' } });
  assert.equal(getToken({ CLAUDE_CONFIG_DIR: '/x' }, readFile), 'tok-123');
});

test('getToken: missing file or key -> null', () => {
  const throws = () => { throw new Error('ENOENT'); };
  assert.equal(getToken({ CLAUDE_CONFIG_DIR: '/x' }, throws), null);
  assert.equal(getToken({ CLAUDE_CONFIG_DIR: '/x' }, () => '{}'), null);
});
