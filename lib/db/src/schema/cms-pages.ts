import {
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const cmsPagesTable = pgTable(
  "cms_pages",
  {
    id: serial("id").primaryKey(),
    slug: text("slug").notNull(),
    locale: text("locale").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    status: text("status").notNull().default("draft"),
    updatedBy: text("updated_by").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    uniqueIndex("cms_pages_slug_locale_idx").on(table.slug, table.locale),
  ],
);

export type CmsPage = typeof cmsPagesTable.$inferSelect;
