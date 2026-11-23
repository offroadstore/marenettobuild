import { boolean, index, jsonb, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";

// Intentionally unrelated to generic leads, notifications, attachments and KPIs.
export const callRequestsTable = pgTable("call_requests", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  keyHash: text("key_hash").notNull().unique(),
  inputHash: text("input_hash").notNull(),
  data: jsonb("data").$type<Record<string, unknown>>().notNull(),
  consentAt: timestamp("consent_at", { withTimezone: true }).notNull().defaultNow(),
  privacyVersion: text("privacy_version").notNull(),
  consentLanguage: text("consent_language").notNull(),
  status: text("status").notNull().default("new"),
  notes: text("notes").notNull().default(""),
  acquiredCustomer: boolean("acquired_customer").notNull().default(false),
  isSynthetic: boolean("is_synthetic").notNull().default(false),
  ownerDelivery: text("owner_delivery").notNull().default("pending_provider"),
  customerDelivery: text("customer_delivery").notNull().default("pending_provider"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, t => [index("call_requests_retention_idx").on(t.acquiredCustomer, t.createdAt)]);
export const insertCallRequestSchema = createInsertSchema(callRequestsTable).omit({ id: true });
export type CallRequest = typeof callRequestsTable.$inferSelect;
