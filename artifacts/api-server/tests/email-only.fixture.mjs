import assert from 'node:assert/strict';
import { test } from 'node:test';
import express from 'express';
import { once } from 'node:events';
import { readFileSync } from 'node:fs';
import { CreateProjectRequestBody } from '@workspace/api-zod';
import router from '../src/routes/project-requests.ts';
import { sendProjectRequestEmail } from '../src/lib/project-request-email.ts';

const choices = {
  requestType: ['Tipo richiesta', {
    project: 'Progetto / lavori', maintenance: 'Manutenzione', purchase: 'Acquisto',
  }],
  propertyType: ['Proprietà', {
    apartment: 'Appartamento', house: 'Casa indipendente', commercial: 'Immobile commerciale', other: 'Altro',
  }],
  service: ['Servizio', {
    renovation: 'Ristrutturazione / lavori', maintenance: 'Manutenzione',
    property_care: 'Cura della proprietà', purchase: 'Acquisto / orientamento', other: 'Altro',
  }],
  projectStage: ['Fase', {
    planning: 'Sto raccogliendo informazioni', defined: 'Ho un’idea abbastanza definita',
    ready: 'Vorrei valutare i prossimi passi', ongoing: 'C’è un’esigenza in corso',
  }],
  preferredChannel: ['Canale preferito', { email: 'Email', phone: 'Telefono', whatsapp: 'WhatsApp' }],
  preferredLanguage: ['Lingua', {
    it: 'Italiano', en: 'Inglese', fr: 'Francese', de: 'Tedesco', nl: 'Olandese',
    es: 'Spagnolo', pt: 'Portoghese', ru: 'Russo', pl: 'Polacco', ro: 'Rumeno',
    uk: 'Ucraino', cs: 'Ceco', sk: 'Slovacco', sl: 'Sloveno', hr: 'Croato',
    sr: 'Serbo', bg: 'Bulgaro', bs: 'Bosniaco', mk: 'Macedone', be: 'Bielorusso',
    ar: 'Arabo', he: 'Ebraico', sv: 'Svedese', no: 'Norvegese', da: 'Danese',
    fi: 'Finlandese', hu: 'Ungherese', el: 'Greco', tr: 'Turco',
  }],
};

function setupSmtp() {
  // Synthetic values are process-local; the bundle replaces nodemailer entirely.
  Object.assign(process.env, { NODE_ENV: 'production', ARUBA_SMTP_USER: 'fixture',
    ARUBA_SMTP_PASSWORD: 'fixture', ARUBA_SMTP_FROM: 'fixture@example.invalid' });
  globalThis.smtpMessages = []; globalThis.smtpMode = 'success'; globalThis.closed = 0;
}

function emailFields(message) {
  return Object.fromEntries(message.text.split('\n\n').map(line => {
    const colon = line.indexOf(': ');
    return [line.slice(0, colon), line.slice(colon + 2)];
  }));
}

test('Italian email labels cover every contract enum, form choice and language', async () => {
  setupSmtp();
  const form = readFileSync('artifacts/marenetto-build/src/App.tsx', 'utf8');
  for (const field of ['requestType', 'preferredChannel']) {
    assert.deepEqual(Object.keys(choices[field][1]).sort(), [...CreateProjectRequestBody.shape[field].options].sort());
  }
  for (const field of ['propertyType', 'service', 'projectStage', 'preferredChannel']) {
    const select = form.split(`selectField('${field}',`)[1].split(']])}')[0];
    const codes = [...select.matchAll(/\['([^']+)',/g)].map(match => match[1]);
    assert.deepEqual(Object.keys(choices[field][1]).sort(), codes.sort(), field);
  }
  const locales = JSON.parse(readFileSync('artifacts/marenetto-build/src/localization/locales.json', 'utf8'));
  assert.deepEqual(Object.keys(choices.preferredLanguage[1]).sort(), locales.map(locale => locale.code).sort());

  const base = { name: 'Synthetic Test', email: 'synthetic@example.invalid', phone: '+00 123',
    location: 'Cefalù', message: 'Texte libre en français : maintenance',
    budget: 'Da concordare: 20–30 mila', desiredPeriod: 'Printemps',
    needsAccommodation: false, needsMobility: true, privacyAccepted: true,
    ...Object.fromEntries(Object.entries(choices).map(([field, [, options]]) => [field, Object.keys(options)[0]])) };
  for (const [field, [label, options]] of Object.entries(choices)) {
    for (const [code, expected] of Object.entries(options)) {
      const input = Object.freeze({ ...base, preferredLanguage: 'fr', [field]: code });
      const before = JSON.stringify(input);
      await sendProjectRequestEmail(input);
      const fields = emailFields(globalThis.smtpMessages.at(-1));
      assert.equal(fields[label], expected, `${field}=${code}`);
      for (const [other, [otherLabel, otherOptions]] of Object.entries(choices)) {
        assert.equal(fields[otherLabel], otherOptions[input[other]]);
      }
      for (const [label, key] of [['Nome', 'name'], ['Email', 'email'], ['Telefono / WhatsApp', 'phone'],
        ['Località', 'location'], ['Messaggio', 'message'], ['Budget', 'budget'], ['Periodo', 'desiredPeriod']]) {
        assert.equal(fields[label], input[key]);
      }
      assert.equal(fields.Alloggio, 'No');
      assert.equal(fields['Accessibilità / mobilità'], 'Sì');
      assert.equal(fields['Privacy accettata'], 'Sì');
      assert.equal(JSON.stringify(input), before);
    }
  }
  assert.equal(globalThis.closed, globalThis.smtpMessages.length);
});

test('missing values use a dash and unknown codes are never assigned another option', async () => {
  setupSmtp();
  for (const value of [undefined, null, '', 'unexpected-code', 'constructor', '__proto__', 'toString']) {
    const input = Object.fromEntries(Object.keys(choices).map(field => [field, value]));
    await sendProjectRequestEmail(input);
    const fields = emailFields(globalThis.smtpMessages.at(-1));
    for (const [label] of Object.values(choices)) assert.equal(fields[label], value || '—');
    for (const label of ['Nome', 'Email', 'Telefono / WhatsApp', 'Località', 'Budget', 'Periodo',
      'Alloggio', 'Accessibilità / mobilità', 'Privacy accettata', 'Messaggio']) {
      assert.equal(fields[label], '—');
    }
  }
  await sendProjectRequestEmail({ needsAccommodation: true, needsMobility: false, privacyAccepted: false });
  const fields = emailFields(globalThis.smtpMessages.at(-1));
  assert.equal(fields.Alloggio, 'Sì');
  assert.equal(fields['Accessibilità / mobilità'], 'No');
  assert.equal(fields['Privacy accettata'], 'No');
});

test('email-only route never imports storage, confirms only SMTP acceptance, and fails closed in preview', async () => {
  // All values belong only to this child process; SMTP is entirely mocked.
  setupSmtp();
  const logs = [];
  const app = express(); app.use(express.json());
  app.use((req, _res, next) => { req.log = { error: (...args) => logs.push(args) }; next(); });
  app.use(router);
  const server = app.listen(0, '127.0.0.1'); await once(server, 'listening');
  const origin = `http://127.0.0.1:${server.address().port}`;
  const input = { requestType: 'project', propertyType: 'house', service: 'renovation',
    location: 'Test', projectStage: 'planning', name: 'Synthetic Test', email: 'synthetic@example.invalid',
    preferredChannel: 'email', message: 'Synthetic email-only verification message.',
    preferredLanguage: 'ar', needsAccommodation: false, needsMobility: true, privacyAccepted: true,
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
    assert.equal(email.subject, 'Nuova richiesta dal sito Marenetto Build');
    const fields = emailFields(email);
    for (const [field, [label, options]] of Object.entries(choices)) assert.equal(fields[label], options[input[field]]);
    for (const label of ['Telefono / WhatsApp', 'Budget', 'Periodo']) assert.equal(fields[label], '—');
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
