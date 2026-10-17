import {
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { projectRequestsTable } from "./project-requests";

export const attachmentsTable = pgTable(
  "private_attachments",
  {
    id: serial("id").primaryKey(),
    projectRequestId: integer("project_request_id").references(
      () => projectRequestsTable.id,
      { onDelete: "set null" },
    ),
    objectPath: text("object_path").notNull(),
    fileName: text("file_name").notNull(),
    contentType: text("content_type").notNull(),
    size: integer("size").notNull(),
    uploadedBy: text("uploaded_by").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("private_attachments_object_path_idx").on(table.objectPath),
  ],
);

export type PrivateAttachment = typeof attachmentsTable.$inferSelect;
