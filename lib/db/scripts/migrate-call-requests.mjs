import pg from 'pg';
export const migration = `
CREATE TABLE IF NOT EXISTS call_requests (
 id serial PRIMARY KEY, code text NOT NULL UNIQUE,
 key_hash text NOT NULL UNIQUE, input_hash text NOT NULL, data jsonb NOT NULL,
 consent_at timestamptz NOT NULL DEFAULT now(), privacy_version text NOT NULL,
 consent_language text NOT NULL, status text NOT NULL DEFAULT 'new',
 notes text NOT NULL DEFAULT '', acquired_customer boolean NOT NULL DEFAULT false,
 is_synthetic boolean NOT NULL DEFAULT false,
 owner_delivery text NOT NULL DEFAULT 'pending_provider',
 customer_delivery text NOT NULL DEFAULT 'pending_provider',
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS call_requests_retention_idx ON call_requests (acquired_customer, created_at);
`;
if (process.argv[1] && import.meta.url === new URL(process.argv[1], 'file:').href) {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL required');
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  try { await pool.query(migration); console.log('Call request schema ready; existing requests unchanged.'); }
  finally { await pool.end(); }
}
