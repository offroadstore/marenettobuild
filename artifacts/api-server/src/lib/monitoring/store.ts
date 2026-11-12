import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import { db, monitoringSettingsTable as settings, monitoringOauthStatesTable as states, type MonitoringSettingsRecord } from "@workspace/db";
import type { GoogleReportService, MonitoringState } from "@workspace/api-zod";
import { decryptTokens, encryptTokens, environment, MonitoringError, type Tokens } from "./core";
import { exchangeToken } from "./google";
import { initialMeasurementId } from "./public-identifiers";

export async function getSettings(): Promise<MonitoringSettingsRecord> {
  const env = environment();
  await db.insert(settings).values({ environment: env, revision: randomUUID(), measurementId: initialMeasurementId }).onConflictDoNothing();
  const [row] = await db.select().from(settings).where(eq(settings.environment, env));
  return row!;
}
// All credential/config changes serialize per environment, including OAuth completion,
// refresh and disconnect. Network reports use a revision check before caching results.
export async function lockedSettings<T>(run: (tx: typeof db, row: MonitoringSettingsRecord) => Promise<T>): Promise<T> {
  await getSettings();
  return db.transaction(async tx => {
    const [row] = await tx.select().from(settings).where(eq(settings.environment, environment())).for("update");
    return run(tx as unknown as typeof db, row!);
  });
}
export async function savePatch(patch: Partial<typeof settings.$inferInsert>) {
  return lockedSettings(async (tx, row) => {
    await tx.update(settings).set({ ...patch, revision: randomUUID(), updatedAt: new Date() }).where(eq(settings.environment, row.environment));
  });
}
export async function accessToken(expectedRevision?: string): Promise<{ access: string; revision: string }> {
  return lockedSettings(async (tx, row) => {
    if (expectedRevision && row.revision !== expectedRevision) throw new MonitoringError("disconnected", "La configurazione è cambiata. Ricaricare i dati.", 409);
    if (!row.encryptedTokens) throw new MonitoringError("disconnected", "Nessun account Google collegato.", 409);
    let tokens = decryptTokens(row.encryptedTokens);
    if (tokens.expires <= Date.now() + 60000) {
      tokens = await exchangeToken({ grant_type: "refresh_token", refresh_token: tokens.refresh }, tokens);
      await tx.update(settings).set({ encryptedTokens: encryptTokens(tokens) }).where(eq(settings.environment, row.environment));
    }
    return { access: tokens.access, revision: row.revision };
  });
}
export async function setConnection(tx: typeof db, row: MonitoringSettingsRecord, tokens: Tokens) {
  await tx.update(settings).set({ encryptedTokens: encryptTokens(tokens), revision: randomUUID(), ga4Property: null, searchConsoleProperty: null, checks: {}, updatedAt: new Date() }).where(eq(settings.environment, row.environment));
  await tx.delete(states).where(eq(states.environment, row.environment));
}
export async function recordCheck(service: GoogleReportService, revision: string, state: MonitoringState, error: string | null) {
  const now = new Date().toISOString();
  const succeeded = ["ready", "empty", "delayed"].includes(state);
  // Atomic JSONB merge avoids losing parallel updates from the other service.
  await db.update(settings).set({
    checks: sql`jsonb_set(${settings.checks}, ARRAY[${service}], jsonb_build_object(
      'state', ${state}::text, 'checkedAt', ${now}::text,
      'successAt', CASE WHEN ${succeeded} THEN to_jsonb(${now}::text) ELSE COALESCE(${settings.checks}->${service}->'successAt', 'null'::jsonb) END,
      'error', ${error}::text))`,
  }).where(and(eq(settings.environment, environment()), eq(settings.revision, revision)));
}
