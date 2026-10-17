import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const internalMembersTable = pgTable(
  "internal_members",
  {
    id: serial("id").primaryKey(),
    email: text("email").notNull(),
    role: text("role").notNull().default("viewer"),
    status: text("status").notNull().default("invited"),
    invitedBy: text("invited_by"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [uniqueIndex("internal_members_email_idx").on(table.email)],
);

export type InternalMember = typeof internalMembersTable.$inferSelect;
