import { pgTable, text, integer, jsonb, unique, check } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";

// One locked aggregate per edition: immutable revision/event arrays and a separate
// active pointer. Appending a draft can never overwrite the public revision.
export const editorialEditionsTable = pgTable("editorial_editions", {
  id: text("id").primaryKey(),
  identity: text("identity").notNull(),
  locale: text("locale").notNull(),
  path: text("path").notNull().unique("editorial_editions_path_key"),
  kind: text("kind").notNull(),
  version: integer("version").notNull().default(1),
  data: jsonb("data").notNull(),
}, table => [
  unique("editorial_identity_locale").on(table.identity, table.locale),
  check("editorial_editions_kind_check", sql`${table.kind} IN ('article','page')`),
  check("editorial_editions_version_check", sql`${table.version} > 0`),
]);
export const insertEditorialEditionSchema = createInsertSchema(editorialEditionsTable);
export type EditorialEdition = typeof editorialEditionsTable.$inferSelect;
