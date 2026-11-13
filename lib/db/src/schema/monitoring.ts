import { boolean, jsonb, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Only encrypted token envelopes live here. Never export this table in API responses.
export const monitoringSettingsTable = pgTable("monitoring_settings", {
  environment: text("environment").primaryKey(),
  revision: text("revision").notNull(),
  encryptedTokens: text("encrypted_tokens"),
  ga4Property: text("ga4_property"),
  searchConsoleProperty: text("search_console_property"),
  measurementId: text("measurement_id").notNull().default(""),
  containerId: text("container_id").notNull().default(""),
  collectionEnabled: boolean("collection_enabled").notNull().default(false),
  collectionCheck: jsonb("collection_check").$type<{
    fingerprint: string; stream: string; checkedAt: string;
    realtimeCheckedAt?: string; realtimeReceivedAt?: string;
  }>(),
  checks: jsonb("checks").$type<Record<string, { state: string; checkedAt: string; successAt: string | null; error: string | null }>>().notNull().default({}),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
export const monitoringOauthStatesTable = pgTable("monitoring_oauth_states", {
  hash: text("hash").primaryKey(),
  environment: text("environment").notNull(),
  memberId: integer("member_id").notNull(),
  sessionHash: text("session_hash").notNull(),
  verifier: text("verifier").notNull(),
  revision: text("revision").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});
export const insertMonitoringSchema = createInsertSchema(monitoringSettingsTable);
export type MonitoringSettingsRecord = typeof monitoringSettingsTable.$inferSelect;
