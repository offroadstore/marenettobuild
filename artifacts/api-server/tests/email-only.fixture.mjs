import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { once } from 'node:events';
import router from '../src/routes/project-requests.ts';

test('email-only route never imports storage, confirms only SMTP acceptance, and fails closed in preview', async () => {
  // All values belong only to this child process; SMTP is entirely mocked.
  process.env.NODE_ENV = 'production';
  process.env.ARUBA_SMTP_USER = 'fixture';
  process.env.ARUBA_SMTP_PASSWORD = 'fixture';
  process.env.ARUBA_SMTP_FROM = 'fixture@example.invalid';
  globalThis.smtpMessages = []; globalThis.smtpMode = 'success'; globalThis.closed = 0;
  const logs = [];
  const app = express(); app.use(express.json());
  app.use((req, _res, next) => { req.log = { error: (...args) => logs.push(args) }; next(); });
  app.use(router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const input = { requestType: 'project', propertyType: 'house', service: 'renovation',
    location: 'Test', projectStage: 'planning', name: 'Synthetic Test', email: 'synthetic@example.invalid',
    preferredChannel: 'email', message: 'Synthetic email-only verification message.',
    preferredLanguage: 'it', needsAccommodation: false, needsMobility: true, privacyAccepted: true,
    idempotencyKey: 'email-only-fixture', formOpenedAt: Date.now() - 6000, companyWebsite: '' };
  async function submit(patch = {}, host = 'www.marenettobuild.com') {
    const response = await fetch(origin + '/project-requests', { method: 'POST',
      headers: { 'content-type': 'application/json', 'x-forwarded-host': host },
      body: JSON.stringify({ ...input, ...patch }) });
    return { status: response.status, data: await response.json() };
  }
  try {
    assert.equal((await submit({}, 'preview.invalid')).status, 503);
    assert.equal(globalThis.smtpMessages.length, 0);
    assert.equal((await submit({ privacyAccepted: false })).status, 400);
    assert.equal((await submit({ email: '', phone: '' })).status, 400);
    assert.equal((await submit({ companyWebsite: 'spam' })).status, 400);
    assert.equal((await submit({ formOpenedAt: Date.now() })).status, 400);
    const [a, b] = await Promise.all([submit(), submit()]);
    assert.deepEqual(a, { status: 200, data: { status: 'sent' } });
    assert.deepEqual(b, a); assert.equal(globalThis.smtpMessages.length, 1);
    assert.deepEqual(await submit(), a); assert.equal(globalThis.smtpMessages.length, 1);
    assert.equal((await submit({ name: 'changed' })).status, 409);
    const email = globalThis.smtpMessages[0];
    assert.equal(email.to, 'info@marenetto.com');
    for (const value of [input.name, input.email, input.message, input.location]) assert.ok(email.text.includes(value));
    assert.doesNotMatch(JSON.stringify(a), /code|synthetic|notification|lead/i);
    globalThis.smtpMode = 'rejected';
    const failed = await submit({ idempotencyKey: 'rejected-fixture' });
    assert.equal(failed.status, 503); assert.doesNotMatch(JSON.stringify(failed.data), /synthetic@example/);
    globalThis.smtpMode = 'failure';
    assert.equal((await submit({ idempotencyKey: 'failed-fixture' })).status, 503);
    globalThis.smtpMode = 'success';
    assert.equal((await submit({ idempotencyKey: 'failed-fixture' })).status, 200);
    assert.equal((await submit({ idempotencyKey: 'fifth-fixture' })).status, 200);
    assert.equal((await submit({ idempotencyKey: 'limited-fixture' })).status, 429);
    assert.ok(globalThis.closed >= 4);
    assert.doesNotMatch(JSON.stringify(logs), /synthetic|sensitive|@|Synthetic email/);
    process.env.NODE_ENV = 'development';
    assert.equal((await submit()).status, 503);
  } finally { server.closeAllConnections(); await new Promise(resolve => server.close(resolve)); }
});
