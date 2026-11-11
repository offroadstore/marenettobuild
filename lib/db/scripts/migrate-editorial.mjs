import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL non configurato');
  await pool.query(`CREATE TABLE IF NOT EXISTS editorial_editions (
    id text PRIMARY KEY, identity text NOT NULL, locale text NOT NULL,
    path text NOT NULL UNIQUE, kind text NOT NULL CHECK (kind IN ('article','page')),
    version integer NOT NULL DEFAULT 1 CHECK (version > 0), data jsonb NOT NULL,
    CONSTRAINT editorial_identity_locale UNIQUE(identity,locale)
  )`);
  console.log('Migrazione editoriale additiva applicata; nessun contenuto esistente modificato.');
} finally { await pool.end(); }
