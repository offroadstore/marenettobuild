import { index, pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const projectRequestAttemptsTable = pgTable("project_request_attempts", {
  id: serial("id").primaryKey(),
  ipHash: text("ip_hash").notNull(),
  attemptedAt: timestamp("attempted_at", { withTimezone: true }).notNull().defaultNow(),
}, (table) => [
  index("project_request_attempts_ip_time_idx").on(table.ipHash, table.attemptedAt),
  index("project_request_attempts_time_idx").on(table.attemptedAt),
]);
