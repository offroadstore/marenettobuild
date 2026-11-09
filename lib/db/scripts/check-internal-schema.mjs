import pg from "pg";

// This is a read-only readiness check, not a migration or an approval gate.
const requiredColumns = {
  internal_members: ["id", "email", "role", "status", "invited_by", "created_at", "updated_at"],
  project_requests: ["id", "is_synthetic", "lead_status", "assigned_to", "internal_notes", "updated_at"],
  cms_pages: ["id", "slug", "locale", "title", "body", "status", "updated_by", "updated_at"],
  private_attachments: ["id", "project_request_id", "object_path", "file_name", "content_type", "size", "uploaded_by", "created_at"],
  internal_notifications: ["id", "type", "title", "message", "project_request_id", "is_read", "read_at", "created_at"],
};

if (!process.env.DATABASE_URL) {
  console.error("Internal schema check requires the application's DATABASE_URL.");
  process.exitCode = 1;
} else {
  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    connectionTimeoutMillis: 10_000,
    statement_timeout: 10_000,
  });
  try {
    const { rows } = await pool.query(
      "SELECT table_name, column_name FROM information_schema.columns WHERE table_schema = $1 AND table_name = ANY($2::text[])",
      ["public", Object.keys(requiredColumns)],
    );
    const present = new Set(rows.map(({ table_name, column_name }) => `${table_name}.${column_name}`));
    const missing = Object.entries(requiredColumns).flatMap(([table, columns]) =>
      columns.filter((column) => !present.has(`${table}.${column}`)).map((column) => `${table}.${column}`),
    );
    if (missing.length) {
      console.error(`Internal schema is incomplete: ${missing.join(", ")}.`);
      console.error("Apply the existing Drizzle schema to the development database before testing internal access.");
      process.exitCode = 1;
    } else {
      console.log("Internal access schema is ready: membership, leads, CMS, notifications and private attachments.");
    }
  } catch (error) {
    // Do not print connection strings or database error details containing identifiers.
    console.error(`Internal schema check could not query the database (${error?.code ?? "unknown database error"}).`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}
