import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { db, pool, callRequestsTable as calls } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import router from "../src/routes/call-requests";
import { CALL_PRIVACY_VERSION, callLiveApproved, csvCell, deliverCall, minimizeCallInput, purgeExpiredCalls, recoverCallDeliveries, storeCall } from "../src/lib/call-service";
import { callbackMail } from "../src/lib/call-mail";
import { reserveProjectRequest } from "../src/lib/project-request-rate";
import { CreateCallRequestBody } from "@workspace/api-zod";

const valid = (overrides: Record<string, unknown> = {}) => ({
  idempotencyKey: randomUUID(), firstName: "Synthetic", lastName: "Callback",
  email: "callback@example.invalid", mobile: "+393330000001", whatsapp: false,
  privacyAccepted: true, marketingAccepted: false, consentLanguage: "it",
  privacyVersion: CALL_PRIVACY_VERSION, companyWebsite: "", formOpenedAt: Date.now() - 6000,
  ...overrides,
});
const input = (overrides = {}) => CreateCallRequestBody.parse(valid(overrides));
let server: ReturnType<express.Express["listen"]>, origin: string;
const request = (path: string, method = "GET", body?: unknown, role?: string) =>
  fetch(origin + "/api" + path, { method, headers: {
    "content-type": "application/json", ...(role ? { "x-fixture-role": role } : {}),
  }, ...(body ? { body: JSON.stringify(body) } : {}) });
const post = (body = valid()) => request("/call-requests", "POST", body);
const count = async () => (await db.select({ n: sql<number>`count(*)::int` }).from(calls))[0].n;
before(async () => {
  const app = express();
  app.use(express.json(), (req, _res, next) => { req.log = { error() {} } as never; next(); });
  app.use("/api", router);
  server = app.listen(0, "127.0.0.1"); await once(server, "listening");
  const address = server.address(); assert.ok(address && typeof address === "object");
  origin = `http://127.0.0.1:${address.port}`;
});
after(async () => { await new Promise<void>(resolve => server.close(() => resolve())); await pool.end(); });

test("required contacts, international mobile and explicit current privacy acknowledgement", async () => {
  for (const change of [
    { mobile: "3330000001" }, { mobile: "+00123" }, { firstName: " " }, { lastName: "" },
    { email: "broken" }, { privacyAccepted: false }, { privacyVersion: "old" }, { consentLanguage: "xx" },
  ]) assert.equal((await post(valid(change))).status, 400);
  assert.equal(await count(), 0);
});
test("honeypot and too-fast requests never create rows or fake saved receipts", async () => {
  for (const change of [{ companyWebsite: "spam" }, { formOpenedAt: Date.now() }]) assert.equal((await post(valid(change))).status, 400);
  assert.equal(await count(), 0);
});
test("concurrent idempotency, durable consent evidence, preview minimization, conflict", async () => {
  const body = valid({ firstName: "Discard this personal input", utm: { utm_source: "newsletter" } });
  const responses = await Promise.all([post(body), post(body)]);
  assert.deepEqual(responses.map(r => r.status).sort(), [200, 201]);
  const [a, b] = await Promise.all(responses.map(r => r.json()));
  assert.equal(a.code, b.code); assert.equal(a.ownerDelivery, "pending_provider");
  assert.equal(await count(), 1);
  const [row] = await db.select().from(calls);
  assert.equal(row.privacyVersion, body.privacyVersion); assert.equal(row.consentLanguage, "it");
  assert.ok(Math.abs(row.consentAt.getTime() - Date.now()) < 10000);
  if (!callLiveApproved()) { assert.equal(row.data.firstName, "Contatto"); assert.equal(row.data.marketingAccepted, false); }
  assert.equal((await post({ ...body, lastName: "Changed" })).status, 409);
  for (const table of ["project_requests", "internal_notifications"]) assert.equal((await pool.query(`SELECT count(*)::int n FROM ${table}`)).rows[0].n, 0);
});
test("401/403 protect list, CSV, update and delete independently of menu", async () => {
  const [row] = await db.select().from(calls);
  for (const role of [undefined, "editor", "viewer"]) for (const [path, method, body] of [
    ["/internal/call-requests", "GET"], ["/internal/call-requests/export", "GET"],
    [`/internal/call-requests/${row.id}`, "PATCH", { notes: "forbidden" }],
    [`/internal/call-requests/${row.id}`, "DELETE"],
  ] as const) assert.equal((await request(path, method, body, role)).status, role ? 403 : 401);
});
test("owner filters, notes, acquired marker and status persist; CSV resists formulas", async () => {
  const [row] = await db.select().from(calls);
  const changed = await request(`/internal/call-requests/${row.id}`, "PATCH", { status: "closed", notes: "\n =HYPERLINK(\"bad\")", acquiredCustomer: true }, "owner");
  assert.equal(changed.status, 200);
  const list = await request("/internal/call-requests?status=closed&language=it", "GET", undefined, "owner");
  assert.equal(list.status, 200); const rows = await list.json();
  assert.equal(rows.length, 1); assert.equal(rows[0].acquiredCustomer, true); assert.equal(rows[0].notes, "\n =HYPERLINK(\"bad\")");
  assert.equal((await request("/internal/call-requests?status=new", "GET", undefined, "owner").then(r => r.json())).length, 0);
  assert.equal((await request("/internal/call-requests?project=construction", "GET", undefined, "owner").then(r => r.json())).length, 0);
  const today = new Date().toISOString().slice(0, 10);
  for (const dateQuery of [`start=${today}`, `end=${today}`, `start=${today}&end=${today}`]) {
    const filtered = await request(`/internal/call-requests?${dateQuery}`, "GET", undefined, "owner");
    assert.equal(filtered.status, 200); assert.equal((await filtered.json()).length, 1);
    const csv = await request(`/internal/call-requests/export?${dateQuery}`, "GET", undefined, "owner");
    assert.equal(csv.status, 200); assert.ok((await csv.text()).includes(row.code));
  }
  assert.equal((await request("/internal/call-requests?end=1999-01-01", "GET", undefined, "owner").then(r => r.json())).length, 0);
  for (const q of ["start=2026-02-30", "start=2026-12-01&end=2026-01-01", "language=xx", "status=bad"]) {
    assert.equal((await request("/internal/call-requests?" + q, "GET", undefined, "owner")).status, 400);
  }
  const exported = await request("/internal/call-requests/export?status=closed", "GET", undefined, "owner");
  assert.equal(exported.status, 200); assert.match(exported.headers.get("cache-control")!, /no-store/);
  assert.match(await exported.text(), /"'\n =HYPERLINK/);
  for (const value of ["=1+1", "+393330000000", "-1", "@SUM", "\t=2", "\r\n+2"]) assert.ok(csvCell(value).startsWith(`"'`));
});
test("persistent shared per-IP limit is serialized and stored only as hash", async () => {
  const statuses = await Promise.all(Array.from({ length: 8 }, () => reserveProjectRequest("192.0.2.91")));
  assert.equal(statuses.filter(Boolean).length, 5);
  const attempts = await pool.query("SELECT * FROM project_request_attempts");
  assert.ok(attempts.rows.every(row => /^[a-f0-9]{64}$/.test(row.ip_hash)));
  assert.equal(await reserveProjectRequest("192.0.2.91"), false);
  assert.equal(await reserveProjectRequest("192.0.2.92"), true);
  // Three previous valid HTTP attempts used this address; failures did not.
  assert.equal((await post()).status, 201);
  assert.equal((await post()).status, 201);
  assert.equal((await post()).status, 429);
});
test("allowed provenance only, no sensitive query parameters or raw external URLs", () => {
  const data = minimizeCallInput(input({ sourcePath: "/servizi?email=private@example.invalid#secret",
    utm: { utm_source: "newsletter", utm_medium: "email@example.invalid", utm_campaign: "password_123" } }));
  assert.equal(data.sourcePath, "/servizi"); assert.deepEqual(data.utm, { utm_source: "newsletter" });
  for (const path of ["/internal", "/unknown-person-name", "https://external.invalid/person"]) assert.equal(minimizeCallInput(input({ sourcePath: path })).sourcePath, undefined);
});
test("both transactional emails are simulated once across concurrent delivery/retries in 13 languages", async () => {
  for (const lang of ["it", "en", "de", "fr", "es", "nl", "pt", "pl", "ru", "sv", "no", "da", "ar"]) {
    const saved = await storeCall(input({ consentLanguage: lang }), false); assert.ok(saved);
    const messages: { to: string; subject: string; text: string }[] = [];
    const transport = async (m: typeof messages[number]) => { messages.push(m); };
    await Promise.all([deliverCall(saved.row.id, transport), deliverCall(saved.row.id, transport)]);
    await deliverCall(saved.row.id, transport);
    assert.equal(messages.length, 2); assert.equal(messages[0].to, "info@marenetto.com");
    assert.match(messages[0].text, /https:\/\/wa.me\//);
    assert.equal(messages[1].to, "callback@example.invalid"); assert.ok(messages[1].subject.length > 10);
    const [row] = await db.select().from(calls).where(eq(calls.id, saved.row.id));
    assert.equal(row.ownerDelivery, "simulated"); assert.equal(row.customerDelivery, "simulated");
  }
});
test("SMTP errors are visible and not retried; stale claims become uncertain without resending", async () => {
  const saved = await storeCall(input(), false); assert.ok(saved);
  let sends = 0;
  const fail = async () => { sends++; throw new Error("simulated failure"); };
  await deliverCall(saved.row.id, fail); await deliverCall(saved.row.id, fail); assert.equal(sends, 2);
  let [row] = await db.select().from(calls).where(eq(calls.id, saved.row.id));
  assert.equal(row.ownerDelivery, "uncertain"); assert.equal(row.customerDelivery, "uncertain");
  await db.update(calls).set({ ownerDelivery: "sending", updatedAt: new Date(Date.now() - 660000) }).where(eq(calls.id, row.id));
  await recoverCallDeliveries();
  [row] = await db.select().from(calls).where(eq(calls.id, row.id)); assert.equal(row.ownerDelivery, "uncertain");
});
test("calendar retention removes closed prospects but preserves explicitly acquired clients", async () => {
  const prospect = await storeCall(input(), false), acquired = await storeCall(input(), false);
  assert.ok(prospect && acquired);
  const recent = await storeCall(input(), false);
  assert.ok(recent);
  await db.update(calls).set({ createdAt: sql`now() - interval '13 months'`, status: "closed" }).where(eq(calls.id, prospect.row.id));
  await db.update(calls).set({ createdAt: sql`now() - interval '11 months'` }).where(eq(calls.id, recent.row.id));
  await db.update(calls).set({ createdAt: new Date("2020-01-01"), acquiredCustomer: true }).where(eq(calls.id, acquired.row.id));
  const preview = await purgeExpiredCalls();
  assert.ok(preview.some(r => r.id === prospect.row.id), "preview identifies expired synthetic prospect");
  assert.ok(!preview.some(r => r.id === recent.row.id), "eleven-month enquiry is retained");
  assert.ok((await db.select().from(calls).where(eq(calls.id, prospect.row.id))).length, "preview never deletes");
  const removed = await purgeExpiredCalls({ execute: true });
  assert.ok(removed.some(row => row.id === prospect.row.id)); assert.ok(!removed.some(row => row.id === acquired.row.id));
});
test("owner deletion removes the request, notes, consent and delivery state", async () => {
  const response = await request("/internal/call-requests", "GET", undefined, "owner");
  const rows = await response.json(); assert.ok(rows.length);
  const id = rows[0].id;
  assert.equal((await request(`/internal/call-requests/${id}`, "DELETE", undefined, "owner")).status, 204);
  assert.deepEqual(await db.select().from(calls).where(eq(calls.id, id)), []);
});
test("live persistence keeps optional fields, independent consents and preferred confirmation language", async () => {
  const data = input({ firstName: "Synthetic live fixture", project: "construction",
    preferredLanguage: "de", whatsapp: true, marketingAccepted: true,
    sourcePath: "/servizi", utm: { utm_source: "newsletter" }, location: "Synthetic property",
    budget: "Synthetic range", startWhen: "Synthetic timing", timeSlot: "afternoon", message: "Synthetic message" });
  const saved = await storeCall(data, true); assert.ok(saved);
  assert.equal(saved.row.data.firstName, data.firstName);
  for (const k of ["project", "preferredLanguage", "whatsapp", "marketingAccepted", "location", "budget", "startWhen", "timeSlot", "message"]) {
    assert.deepEqual(saved.row.data[k], data[k as keyof typeof data]);
  }
  assert.equal(saved.row.consentLanguage, "it"); assert.equal(saved.row.isSynthetic, false);
  assert.equal(callbackMail(saved.row, "customer").subject, "Rückrufanfrage erhalten");
  const mail = callbackMail(saved.row, "owner");
  for (const k of ["sourcePath", "utm_source", "marketingAccepted", "whatsapp", "budget", "timeSlot"]) assert.ok(mail.text.includes(k));
  assert.equal(mail.to, "info@marenetto.com");
});

test("Atelier country, Arabic acknowledgement and consent survive storage, private filters, CSV and simulated transport", async () => {
  // All content is synthetic and the complete run uses a disposable schema.
  const data = input({ firstName: "Contatto", lastName: "Sintetico",
    project: "atelier_international", country: " Paese sintetico ", location: "Località sintetica",
    preferredLanguage: "ar", consentLanguage: "ar", whatsapp: false, marketingAccepted: false });
  const saved = await storeCall(data, false); assert.ok(saved);
  assert.equal(saved.row.data.project, "atelier_international");
  assert.equal(saved.row.data.country, "Synthetic destination", "preview discards submitted destination");
  assert.equal(saved.row.consentLanguage, "ar");
  assert.equal(saved.row.privacyVersion, CALL_PRIVACY_VERSION);
  // Test live persistence with exclusively synthetic fields without SMTP.
  const live = await storeCall(input({ ...data, idempotencyKey: randomUUID() }), true); assert.ok(live);
  assert.equal(live.row.data.country, "Paese sintetico");
  assert.equal(live.row.data.location, "Località sintetica");
  assert.equal(live.row.data.budget, undefined);
  assert.equal(live.row.data.whatsapp, false);
  assert.equal(live.row.data.marketingAccepted, false);
  assert.ok(live.row.consentAt instanceof Date);
  const mail = callbackMail(live.row, "customer");
  assert.match(mail.subject, /[\u0600-\u06ff]/);
  assert.match(mail.text, /[\u0600-\u06ff]/);
  assert.doesNotMatch(mail.text, /We have recorded/);
  const owner = callbackMail(live.row, "owner");
  assert.match(owner.text, /Atelier internazionale/);
  assert.match(owner.text, /Paese di destinazione: Paese sintetico/);
  assert.match(owner.text, /WhatsApp NON autorizzato/);
  const query = "?project=atelier_international&language=ar&country=synthetic%20destination";
  const filtered = await request("/internal/call-requests" + query, "GET", undefined, "owner");
  assert.equal(filtered.status, 200);
  assert.ok((await filtered.json()).some((r: { id: number }) => r.id === saved.row.id));
  for (const role of [undefined, "editor", "viewer"]) {
    assert.equal((await request("/internal/call-requests/export" + query, "GET", undefined, role)).status, role ? 403 : 401);
  }
  const csv = await request("/internal/call-requests/export" + query, "GET", undefined, "owner");
  assert.equal(csv.status, 200); const text = await csv.text();
  for (const value of ['"country"', '"atelier_international"', '"Synthetic destination"', '"ar"', saved.row.code]) assert.ok(text.includes(value), value);
  const none = await request("/internal/call-requests" + query.replace("synthetic%20destination", "other"), "GET", undefined, "owner");
  assert.deepEqual(await none.json(), []);
  const sent: { to: string; subject: string; text: string }[] = [];
  await deliverCall(saved.row.id, async message => { sent.push(message); });
  await deliverCall(saved.row.id, async message => { sent.push(message); });
  assert.equal(sent.length, 2); assert.match(sent[1].subject, /[\u0600-\u06ff]/);
  assert.equal(CreateCallRequestBody.safeParse({ ...data, country: "x".repeat(101) }).success, false);
  for (const country of [undefined, "", " "]) {
    assert.equal((await post(valid({ project: "atelier_international", country }))).status, 400);
  }
  assert.ok(CreateCallRequestBody.safeParse(valid({ privacyVersion: "call-2026-11-23" })).success, "historical records remain readable");
});

const professional = (overrides: Record<string, unknown> = {}) => ({
  studio: "Studio sintetico", projectType: "villa", phase: "Da definire",
  product: "Piano sintetico", material: "Da definire",
  dimensions: "Descrizione sintetica, nessun disegno allegato", deadline: "Da definire",
  intents: ["samples", "block_selection"], ...overrides,
});

test("professional conditional validation rejects missing, blank, oversized or hidden briefs without storing data", async () => {
  const before = await count();
  for (const change of [
    { professional: undefined }, { country: undefined }, { country: " " },
    { professional: professional({ studio: " " }) }, { professional: professional({ phase: "" }) },
    { professional: professional({ dimensions: " " }) }, { professional: professional({ deadline: " " }) },
    { professional: professional({ material: " " }) }, { professional: professional({ product: " " }) },
    { professional: professional({ studio: "x".repeat(181) }) },
    { professional: professional({ dimensions: "x".repeat(3001) }) },
    { professional: professional({ projectType: "fake-project" }) },
    { professional: professional({ intents: [] }) },
    { professional: professional({ intents: ["samples", "samples"] }) },
    { professional: professional({ intents: ["upload"] }) },
    { professional: professional({ intents: ["samples", "block_selection", "samples"] }) },
    { project: "other", professional: professional() },
    { privacyVersion: "call-2026-11-25-atelier" },
  ]) {
    const response = await post(valid({ project: "professional_studio", country: "Synthetic country", professional: professional(), ...change }));
    assert.equal(response.status, 400, JSON.stringify(change));
  }
  assert.equal(await count(), before);
});

test("professional text, both intents and consents survive real storage path in disposable schema, never SMTP", async () => {
  const body = input({ project: "professional_studio", country: " Synthetic country ",
    professional: professional({ studio: " Studio sintetico ", dimensions: "=synthetic formula\n120 x 80, da definire" }),
    budget: "Facoltativo", consentLanguage: "ar", preferredLanguage: "fr",
    sourcePath: "/servizi", utm: { utm_source: "professional" }, whatsapp: false, marketingAccepted: false });
  const saved = await storeCall(body, true); assert.ok(saved);
  assert.equal(saved.row.isSynthetic, false);
  const brief = saved.row.data.professional as ReturnType<typeof professional>;
  assert.equal(saved.row.data.country, "Synthetic country");
  assert.equal(brief.studio, "Studio sintetico");
  assert.equal(brief.dimensions, body.professional!.dimensions);
  assert.deepEqual(brief.intents, ["block_selection", "samples"]);
  assert.equal(saved.row.data.budget, "Facoltativo");
  assert.equal(saved.row.data.whatsapp, false); assert.equal(saved.row.data.marketingAccepted, false);
  assert.equal(saved.row.privacyVersion, CALL_PRIVACY_VERSION);
  assert.equal(saved.row.consentLanguage, "ar"); assert.ok(saved.row.consentAt instanceof Date);
  const retry = await storeCall(body, true); assert.ok(retry);
  assert.equal(retry.row.id, saved.row.id);
  // Checkbox order is not a different enquiry.
  const reordered = await storeCall({ ...body, professional: { ...body.professional!, intents: ["block_selection", "samples"] } }, true);
  assert.equal(reordered?.row.id, saved.row.id);
  const owner = callbackMail(saved.row, "owner");
  for (const expected of ["Studio sintetico", "Synthetic country", "villa", "Da definire", "Piano sintetico",
    "120 x 80", "Facoltativo", "campioni", "selezione del blocco", "24 ore lavorative", "WhatsApp NON autorizzato"]) {
    assert.ok(owner.text.includes(expected), expected);
  }
  const customer = callbackMail(saved.row, "customer");
  assert.equal(customer.subject, "Demande professionnelle reçue");
  assert.match(customer.text, /automatique/); assert.match(customer.text, /24 heures ouvrées/);
  // No submitted personal data or textual brief survives preview minimization.
  const preview = await storeCall({ ...body, idempotencyKey: randomUUID() }, false); assert.ok(preview);
  assert.equal((preview.row.data.professional as typeof brief).studio, "Synthetic studio");
  assert.ok(!JSON.stringify(preview.row.data).includes("Studio sintetico"));
  assert.deepEqual((preview.row.data.professional as typeof brief).intents, ["samples", "block_selection"]);
  const sent: { to: string; subject: string; text: string }[] = [];
  await deliverCall(preview.row.id, async message => { sent.push(message); });
  await deliverCall(preview.row.id, async message => { sent.push(message); });
  assert.equal(sent.length, 2);
  assert.equal(sent[0].to, "info@marenetto.com"); assert.equal(sent[1].to, "callback@example.invalid");
  assert.equal(sent[1].subject, "تم استلام طلبكم المهني", "preview uses consent locale, never submitted contact preferences");
});

test("professional API, private filters and flattened CSV preserve intent and project categories", async () => {
  // This disposable fixture schema is independent of the development app.
  await pool.query("DELETE FROM project_request_attempts");
  const body = valid({ project: "professional_studio", country: "Discarded country", professional: professional() });
  const created = await post(body); assert.equal(created.status, 201);
  const receipt = await created.json(); assert.equal(receipt.isSynthetic, true);
  assert.equal((await post(body)).status, 200);
  assert.equal((await post({ ...body, professional: professional({ phase: "Changed" }) })).status, 409);
  for (const intent of ["samples", "block_selection"]) {
    const query = `?project=professional_studio&intent=${intent}&professionalProjectType=villa&country=synthetic%20destination`;
    const list = await request("/internal/call-requests" + query, "GET", undefined, "owner");
    assert.equal(list.status, 200);
    const rows = await list.json();
    assert.ok(rows.some((row: { code: string }) => row.code === receipt.code));
    for (const role of [undefined, "editor", "viewer"]) {
      assert.equal((await request("/internal/call-requests" + query, "GET", undefined, role)).status, role ? 403 : 401);
      assert.equal((await request("/internal/call-requests/export" + query, "GET", undefined, role)).status, role ? 403 : 401);
    }
    const csv = await request("/internal/call-requests/export" + query, "GET", undefined, "owner");
    assert.equal(csv.status, 200);
    const text = await csv.text();
    for (const field of ["studio", "professionalProjectType", "phase", "product", "material", "dimensions", "deadline", "intents"]) {
      assert.ok(text.split("\r\n")[0].includes(`"${field}"`), field);
    }
    assert.ok(text.includes(receipt.code)); assert.ok(text.includes("Synthetic studio"));
    assert.ok(text.includes("block_selection")); assert.ok(text.includes("samples"));
  }
  for (const q of ["intent=upload", "professionalProjectType=unknown"]) {
    assert.equal((await request("/internal/call-requests?" + q, "GET", undefined, "owner")).status, 400);
  }
  const none = await request("/internal/call-requests?professionalProjectType=hotel", "GET", undefined, "owner");
  assert.deepEqual(await none.json(), []);
  const list = await request("/internal/call-requests?project=professional_studio", "GET", undefined, "owner");
  const rows = await list.json(); const row = rows.find((r: { code: string }) => r.code === receipt.code);
  assert.ok(row);
  const note = await request(`/internal/call-requests/${row.id}`, "PATCH", { notes: "Synthetic professional note" }, "owner");
  assert.equal(note.status, 200); assert.ok((await note.json()).data.professional.studio);
  const removed = await request(`/internal/call-requests/${row.id}`, "DELETE", undefined, "owner");
  assert.equal(removed.status, 204);
  assert.deepEqual(await db.select().from(calls).where(eq(calls.id, row.id)), []);
});

test("professional acknowledgements are localized in every supported language with no fabricated quote or delivery", () => {
  const subjects = new Set<string>();
  for (const lang of ["it", "en", "de", "fr", "es", "nl", "pt", "pl", "ru", "sv", "no", "da", "ar"]) {
    const mail = callbackMail({
      code: "CALL-SYNTHETIC", createdAt: new Date(),
      data: input({ project: "professional_studio", country: "Synthetic country", professional: professional(),
        consentLanguage: lang, preferredLanguage: lang }),
    } as never, "customer");
    assert.ok(mail.subject.length > 10); assert.ok(mail.text.includes("24"));
    assert.ok(mail.text.includes("info@marenetto.com"));
    assert.ok(!subjects.has(mail.subject), lang); subjects.add(mail.subject);
    if (lang !== "en") assert.ok(!mail.text.includes("automatic acknowledgement"), lang);
  }
});

test("all professional project types and individual intents remain distinguishable, including other", async () => {
  for (const projectType of ["villa", "hotel", "resort", "yacht", "other"]) {
    for (const intent of ["samples", "block_selection"]) {
      const data = input({ project: "professional_studio", country: "Synthetic country",
        professional: professional({ projectType, intents: [intent] }) });
      const saved = await storeCall(data, true); assert.ok(saved);
      const brief = saved.row.data.professional as ReturnType<typeof professional>;
      assert.equal(brief.projectType, projectType); assert.deepEqual(brief.intents, [intent]);
      assert.equal(saved.row.data.budget, undefined);
    }
  }
});

test("professional CSV cells are formula-safe and expired briefs are removed with the same retention rule", async () => {
  const saved = await storeCall(input({ project: "professional_studio", country: "Synthetic country",
    professional: professional({ projectType: "yacht" }) }), false); assert.ok(saved);
  // Deliberately mark this synthetic row with synthetic formula-shaped text.
  const data = { ...saved.row.data, professional: professional({ studio: "=SYNTHETIC()", phase: "\t+SYNTHETIC",
    product: "-SYNTHETIC", material: "@SYNTHETIC", dimensions: "\n=SYNTHETIC", deadline: "=SYNTHETIC" }) };
  await db.update(calls).set({ data }).where(eq(calls.id, saved.row.id));
  const csv = await request("/internal/call-requests/export?project=professional_studio", "GET", undefined, "owner");
  const text = await csv.text(); assert.equal(csv.status, 200);
  for (const expected of ["\"'=SYNTHETIC()", "\"'\t+SYNTHETIC", "\"'-SYNTHETIC", "\"'@SYNTHETIC", "\"'\n=SYNTHETIC"]) {
    assert.ok(text.includes(expected), JSON.stringify(expected));
  }
  await db.update(calls).set({ createdAt: sql`now() - interval '13 months'` }).where(eq(calls.id, saved.row.id));
  const removed = await purgeExpiredCalls({ execute: true });
  assert.ok(removed.some(row => row.id === saved.row.id));
  assert.deepEqual(await db.select().from(calls).where(eq(calls.id, saved.row.id)), []);
});
