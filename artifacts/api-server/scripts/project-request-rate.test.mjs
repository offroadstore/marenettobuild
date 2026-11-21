import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { test } from 'node:test';
import { build } from 'esbuild';

// Exercise the actual rate limiter's key selection with synthetic values only.
// Stub the database so these tests cannot touch leads, queues or SMTP.
const { outputFiles } = await build({
  entryPoints: [fileURLToPath(new URL('../src/lib/project-request-rate.ts', import.meta.url))],
  bundle: true, write: false, platform: 'node', format: 'esm',
  plugins: [{
    name: 'isolated-database',
    setup(builder) {
      builder.onResolve({ filter: /^@workspace\/db$/ }, () => ({ path: 'db', namespace: 'fixture' }));
      builder.onLoad({ filter: /.*/, namespace: 'fixture' }, () => ({
        contents: 'export const db = {}; export const projectRequestAttemptsTable = {};',
      }));
    },
  }],
});
const { getProjectRequestIpKey } = await import(`data:text/javascript;base64,${Buffer.from(outputFiles[0].text).toString('base64')}`);
const session = 'synthetic-session-fixture-32-chars';
const salt = 'synthetic-dedicated-salt-32-chars!';

test('dedicated salt keeps precedence and existing IP hashes unchanged', () => {
  assert.equal(getProjectRequestIpKey({ PROJECT_REQUEST_IP_SALT: salt, SESSION_SECRET: session }), salt);
  assert.equal(getProjectRequestIpKey({ PROJECT_REQUEST_IP_SALT: salt }), salt);
});

test('production without dedicated salt derives a domain-separated HMAC-SHA256 key', () => {
  const environment = { NODE_ENV: 'production', SESSION_SECRET: session };
  const expected = createHmac('sha256', session).update('marenetto-project-request-ip-v1').digest();
  const actual = getProjectRequestIpKey(environment);
  assert.deepEqual(actual, expected);
  assert.deepEqual(getProjectRequestIpKey(environment), actual, 'stable across instances');
  assert.equal(actual.length, 32);
  assert.notDeepEqual(actual, Buffer.from(session), 'never reuse the raw session key');
});

test('empty dedicated salt uses the same secure fallback', () => {
  assert.deepEqual(
    getProjectRequestIpKey({ PROJECT_REQUEST_IP_SALT: '', SESSION_SECRET: session }),
    getProjectRequestIpKey({ SESSION_SECRET: session }),
  );
});

test('missing or short fallback secrets fail closed, including in production', () => {
  for (const SESSION_SECRET of [undefined, '', 'x'.repeat(31)]) {
    assert.throws(() => getProjectRequestIpKey({ NODE_ENV: 'production', SESSION_SECRET }), /at least 32 characters/);
  }
});

test('a malformed dedicated salt is rejected rather than silently replaced', () => {
  assert.throws(() => getProjectRequestIpKey({
    PROJECT_REQUEST_IP_SALT: 'too-short', SESSION_SECRET: session,
  }), /PROJECT_REQUEST_IP_SALT must contain/);
});

test('32-character session keys are accepted and rotation changes the derived key', () => {
  const first = getProjectRequestIpKey({ SESSION_SECRET: 'a'.repeat(32) });
  const second = getProjectRequestIpKey({ SESSION_SECRET: 'b'.repeat(32) });
  assert.notDeepEqual(first, second);
});
