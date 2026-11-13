import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL non configurato');
  await pool.query(`CREATE TABLE IF NOT EXISTS monitoring_settings (
    environment text PRIMARY KEY, revision text NOT NULL, encrypted_tokens text,
    ga4_property text, search_console_property text,
    measurement_id text NOT NULL DEFAULT '', container_id text NOT NULL DEFAULT '',
    checks jsonb NOT NULL DEFAULT '{}', updated_at timestamptz NOT NULL DEFAULT now()
  );
  CREATE TABLE IF NOT EXISTS monitoring_oauth_states (
    hash text PRIMARY KEY, environment text NOT NULL, member_id integer NOT NULL,
    session_hash text NOT NULL, verifier text NOT NULL, revision text NOT NULL,
    expires_at timestamptz NOT NULL
  );
  ALTER TABLE monitoring_settings ADD COLUMN IF NOT EXISTS collection_enabled boolean NOT NULL DEFAULT false;
  ALTER TABLE monitoring_settings ADD COLUMN IF NOT EXISTS collection_check jsonb;`);
  console.log('Tabelle monitoraggio pronte; nessuna richiesta o configurazione precedente modificata.');
} finally { await pool.end(); }
