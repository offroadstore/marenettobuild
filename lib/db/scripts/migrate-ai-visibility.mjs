import pg from 'pg';
import { readFile } from 'node:fs/promises';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL non configurato');
  await pool.query(await readFile(new URL('./ai-visibility.sql', import.meta.url), 'utf8'));
  console.log('Struttura visibilità IA pronta; budget e calendario esistenti non modificati.');
} finally { await pool.end(); }
