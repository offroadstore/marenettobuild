import { boolean, pgTable, serial, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const projectRequestsTable = pgTable(
  "project_requests",
  {
    id: serial("id").primaryKey(),
    code: text("code").notNull().unique(),
    idempotencyKey: text("idempotency_key").notNull(),
    requestType: text("request_type").notNull(),
    propertyType: text("property_type").notNull(),
    service: text("service").notNull(),
    location: text("location").notNull(),
    projectStage: text("project_stage").notNull(),
    message: text("message").notNull(),
    preferredLanguage: text("preferred_language").notNull(),
    name: text("name").notNull(),
    email: text("email"),
    phone: text("phone"),
    preferredChannel: text("preferred_channel").notNull(),
    budget: text("budget"),
    desiredPeriod: text("desired_period"),
    needsAccommodation: boolean("needs_accommodation").notNull().default(false),
    needsMobility: boolean("needs_mobility").notNull().default(false),
    privacyAccepted: boolean("privacy_accepted").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [uniqueIndex("project_requests_idempotency_key_idx").on(table.idempotencyKey)],
);

export type ProjectRequest = typeof projectRequestsTable.$inferSelect;
export type InsertProjectRequest = typeof projectRequestsTable.$inferInsert;
