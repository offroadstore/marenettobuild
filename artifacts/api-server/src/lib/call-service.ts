import { createHmac, randomBytes } from "node:crypto";
import { and, eq, lt, sql } from "drizzle-orm";
import { db, callRequestsTable as calls, type CallRequest } from "@workspace/db";
import { CreateCallRequestBody, type CallRequestInput } from "@workspace/api-zod";
import { getProjectRequestIpKey } from "./project-request-rate";
import { isArubaSmtpConfigured, sendArubaCallbackMail } from "./aruba-mailer";
import { callbackMail } from "./call-mail";
import { isCatalogPath } from "./editorial-store";

export const CALL_PRIVACY_VERSION = "call-2026-11-23";
export const callLiveApproved = () => process.env.NODE_ENV === "production" && process.env.MARENETTO_PRIVACY_APPROVED === "true" &&
  process.env.MARENETTO_PROVIDERS_APPROVED === "true" && process.env.MARENETTO_TESTING_APPROVED === "true";
export const callHash = (value: string) => createHmac("sha256", getProjectRequestIpKey()).update("callback-v1:" + value).digest("hex");
export function minimizeCallInput(input: CallRequestInput): CallRequestInput {
  const { companyWebsite: _trap, formOpenedAt: _clock, ...data } = input;
  const sourcePath = data.sourcePath?.split(/[?#]/)[0];
  data.sourcePath = sourcePath && isCatalogPath(sourcePath) && !/^\/(?:internal|__|api|sign-)/.test(sourcePath) ? sourcePath : undefined;
  data.utm = Object.fromEntries(Object.entries(data.utm ?? {}).filter(([k, v]) =>
    ["utm_source", "utm_medium", "utm_campaign"].includes(k) &&
    typeof v === "string" && /^[a-z][a-z0-9_-]{0,59}$/i.test(v) &&
    !/\d{7}|email|phone|password|token|secret/i.test(v)));
  data.firstName = data.firstName.trim(); data.lastName = data.lastName.trim();
  data.email = data.email.trim().toLowerCase();
  return data;
}
export function syntheticCall(input: CallRequestInput): CallRequestInput {
  return CreateCallRequestBody.parse({
    idempotencyKey: input.idempotencyKey, firstName: "Contatto", lastName: "Sintetico",
    email: "callback@example.invalid", mobile: "+390000000000", privacyAccepted: true,
    marketingAccepted: false, whatsapp: false, privacyVersion: CALL_PRIVACY_VERSION,
    consentLanguage: input.consentLanguage, preferredLanguage: input.consentLanguage,
    message: "Synthetic preview. Submitted personal data were discarded.",
  });
}
export type CallbackTransport = (message: { to: string; subject: string; text: string }) => Promise<void>;

// A row lock covers the send and result update. Deletion waits for an active send.
// A crash/ambiguous SMTP failure is never automatically retried, avoiding duplicate mail.
export async function deliverCall(id: number, testTransport?: CallbackTransport) {
  if (!testTransport && (!callLiveApproved() || process.env.NODE_ENV !== "production" || !isArubaSmtpConfigured())) return;
  for (const recipient of ["owner", "customer"] as const) {
    const field = recipient === "owner" ? "ownerDelivery" : "customerDelivery";
    // Claim in a committed transaction, so a crash leaves a durable "sending".
    const [claim] = await db.update(calls).set({ [field]: "sending", updatedAt: new Date() })
      .where(and(eq(calls.id, id), eq(calls[field], "pending_provider"), eq(calls.isSynthetic, Boolean(testTransport))))
      .returning({ id: calls.id });
    if (!claim) continue;
    await db.transaction(async tx => {
      const [row] = await tx.select().from(calls).where(eq(calls.id, id)).for("update");
      if (!row) return;
      try {
        await (testTransport ?? sendArubaCallbackMail)(callbackMail(row, recipient));
        await tx.update(calls).set({ [field]: testTransport ? "simulated" : "sent", updatedAt: new Date() }).where(eq(calls.id, id));
      } catch {
        await tx.update(calls).set({ [field]: "uncertain", updatedAt: new Date() }).where(eq(calls.id, id));
      }
    });
  }
}
export async function storeCall(input: CallRequestInput, live: boolean) {
  const canonical = minimizeCallInput(input);
  const keyHash = callHash(input.idempotencyKey);
  const inputHash = callHash(JSON.stringify(canonical));
  const data = live ? canonical : syntheticCall(input);
  data.idempotencyKey = keyHash;
  const [created] = await db.insert(calls).values({
    code: `CALL-${randomBytes(8).toString("hex").toUpperCase()}`, keyHash, inputHash,
    data: data as unknown as Record<string, unknown>, privacyVersion: CALL_PRIVACY_VERSION,
    consentLanguage: data.consentLanguage, isSynthetic: !live,
  }).onConflictDoNothing({ target: calls.keyHash }).returning();
  const row = created ?? (await db.select().from(calls).where(eq(calls.keyHash, keyHash)))[0];
  if (!row || row.inputHash !== inputHash || row.isSynthetic !== !live) return null;
  return { row, created: Boolean(created) };
}
export function callReceipt(row: CallRequest) {
  return { code: row.code, createdAt: row.createdAt, isSynthetic: row.isSynthetic,
    ownerDelivery: row.ownerDelivery, customerDelivery: row.customerDelivery };
}
export async function purgeExpiredCalls() {
  // PostgreSQL calendar months, not an approximation in days. Acquired is explicit.
  return db.delete(calls).where(and(eq(calls.acquiredCustomer, false),
    lt(calls.createdAt, sql`now() - interval '24 months'`))).returning({ id: calls.id });
}
export async function recoverCallDeliveries() {
  for (const field of ["ownerDelivery", "customerDelivery"] as const) {
    await db.update(calls).set({ [field]: "uncertain", updatedAt: new Date() })
      .where(and(eq(calls[field], "sending"), lt(calls.updatedAt, sql`now() - interval '10 minutes'`)));
  }
  if (!callLiveApproved() || process.env.NODE_ENV !== "production" || !isArubaSmtpConfigured()) return;
  const rows = await db.select({ id: calls.id }).from(calls).where(and(eq(calls.isSynthetic, false),
    sql`(${calls.ownerDelivery} = 'pending_provider' OR ${calls.customerDelivery} = 'pending_provider')`)).limit(20);
  for (const row of rows) await deliverCall(row.id);
}
export function csvCell(value: unknown) {
  const s = typeof value === "object" ? JSON.stringify(value) : String(value ?? "");
  return `"${(/^[\s\u0000-\u001f]*[=+\-@]/.test(s) ? "'" : "") + s.replaceAll('"', '""')}"`;
}
