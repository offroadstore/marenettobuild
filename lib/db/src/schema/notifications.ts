import {
  boolean,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { projectRequestsTable } from "./project-requests";

export const notificationsTable = pgTable(
  "internal_notifications",
  {
    id: serial("id").primaryKey(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    projectRequestId: integer("project_request_id").references(
      () => projectRequestsTable.id,
      { onDelete: "set null" },
    ),
    isRead: boolean("is_read").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("internal_notifications_project_request_id_idx")
      .on(table.projectRequestId)
      .where(sql`${table.projectRequestId} IS NOT NULL`),
  ],
);

export type InternalNotification = typeof notificationsTable.$inferSelect;
