import { after, before, test } from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { randomUUID } from "node:crypto";
import { once } from "node:events";
import { db, pool, callRequestsTable as calls } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import router from "../src/routes/call-requests";
import { callLiveApproved, csvCell, deliverCall, minimizeCallInput, purgeExpiredCalls, recoverCallDeliveries, storeCall } from "../src/lib/call-service";
import { callbackMail } from "../src/lib/call-mail";
import { reserveProjectRequest } from "../src/lib/project-request-rate";
import { CreateCallRequestBody } from "@workspace/api-zod";

const valid = (overrides: Record<string, unknown> = {}) => ({
  idempotencyKey: randomUUID(), firstName: "Synthetic", lastName: "Callback",
  email: "callback@example.invalid", mobile: "+393330000001", whatsapp: false,
  privacyAccepted: true, marketingAccepted: false, consentLanguage: "it",
  privacyVersion: "call-2026-11-23", companyWebsite: "", formOpenedAt: Date.now() - 6000,
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
test("both transactional emails are simulated once across concurrent delivery/retries in 12 languages", async () => {
  for (const lang of ["it", "en", "de", "fr", "es", "nl", "pt", "pl", "ru", "sv", "no", "da"]) {
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
  await db.update(calls).set({ createdAt: new Date("2020-01-01"), status: "closed" }).where(eq(calls.id, prospect.row.id));
  await db.update(calls).set({ createdAt: new Date("2020-01-01"), acquiredCustomer: true }).where(eq(calls.id, acquired.row.id));
  const removed = await purgeExpiredCalls();
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
