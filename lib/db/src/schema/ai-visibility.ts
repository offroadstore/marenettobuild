import { bigint, boolean, check, index, integer, jsonb, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export type VisibilityQuestion = { id: string; version: number; text: string; enabled: boolean };
export const aiVisibilitySettingsTable = pgTable("ai_visibility_settings", {
  environment: text("environment").primaryKey(),
  revision: text("revision").notNull(),
  budgetMicros: bigint("budget_micros", { mode: "number" }).notNull().default(0),
  weeklyEnabled: boolean("weekly_enabled").notNull().default(false),
  workerAt: timestamp("worker_at", { withTimezone: true }),
  lastStartAt: timestamp("last_start_at", { withTimezone: true }),
  questions: jsonb("questions").$type<VisibilityQuestion[]>().notNull(),
  bingProperty: text("bing_property"),
  bingRevision: text("bing_revision").notNull(),
}, table => [check("ai_visibility_settings_budget_micros_check", sql`${table.budgetMicros} >= 0`)]);
export const aiCampaignsTable = pgTable("ai_visibility_campaigns", {
  id: text("id").primaryKey(),
  environment: text("environment").notNull(),
  weekKey: text("week_key"),
  state: text("state").notNull(),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
}, table => [
  uniqueIndex("ai_visibility_week_unique").on(table.environment, table.weekKey).where(sql`${table.weekKey} IS NOT NULL`),
  index("ai_visibility_campaign_env").on(table.environment, table.at),
]);
export const aiJobsTable = pgTable("ai_visibility_jobs", {
  id: text("id").primaryKey(),
  campaignId: text("campaign_id").notNull().references(() => aiCampaignsTable.id),
  environment: text("environment").notNull(),
  question: jsonb("question").$type<VisibilityQuestion>().notNull(),
  provider: text("provider").notNull(),
  model: text("model").notNull(),
  method: text("method").notNull(),
  state: text("state").notNull(),
  month: text("month"),
  reservedMicros: bigint("reserved_micros", { mode: "number" }).notNull().default(0),
  chargedMicros: bigint("charged_micros", { mode: "number" }),
  claimedAt: timestamp("claimed_at", { withTimezone: true }),
  at: timestamp("at", { withTimezone: true }).notNull().defaultNow(),
  result: jsonb("result").$type<unknown>(),
  checkpoint: integer("checkpoint").notNull().default(0),
}, table => [
  index("ai_visibility_job_env").on(table.environment, table.at),
  index("ai_visibility_job_campaign").on(table.campaignId, table.state),
]);
