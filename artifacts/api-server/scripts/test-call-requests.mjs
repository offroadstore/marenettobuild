import { build } from "esbuild";
import { createRequire } from "node:module";
import { randomBytes } from "node:crypto";
import { mkdir } from "node:fs/promises";
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { migration } from "../../../lib/db/scripts/migrate-call-requests.mjs";
const { Pool } = createRequire(new URL("../../../lib/db/package.json", import.meta.url))("pg");
if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT === "1") throw new Error("Development database only");
const root = path.resolve(import.meta.dirname, "../../..");
const schema = `test_callbacks_${randomBytes(8).toString("hex")}`;
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const connection = new URL(process.env.DATABASE_URL);
connection.searchParams.set("options", `-c search_path=${schema}`);
const out = path.join(root, "generated-artifacts/callbacks");
await mkdir(out, { recursive: true });
await build({
  entryPoints: [path.join(root, "artifacts/api-server/tests/call-requests.fixture.ts")],
  outfile: path.join(out, "callbacks.test.mjs"), bundle: true, platform: "node", format: "esm",
  external: ["pg-native"],
  banner: { js: "import {createRequire} from 'node:module';const require=createRequire(" + JSON.stringify(path.join(root, "lib/db/package.json")) + ");" },
  plugins: [{
    name: "callback-test-boundaries", setup(b) {
      b.onResolve({ filter: /middlewares\/internalAccess$/ }, () => ({ path: "fixture-auth", namespace: "fixture" }));
      b.onResolve({ filter: /\/aruba-mailer$/ }, () => ({ path: "fixture-mail", namespace: "fixture" }));
      b.onResolve({ filter: /\/editorial-store$/ }, () => ({ path: "fixture-paths", namespace: "fixture" }));
      b.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents:
        args.path === "fixture-auth" ? `export function requireInternalAccess(req,res,next){ const role=req.headers["x-fixture-role"]; if(!["owner","editor","viewer"].includes(role)){res.sendStatus(401);return;} req.internalMember={id:1,email:"fixture@example.invalid",role}; next(); }` :
        args.path === "fixture-mail" ? `export const isArubaSmtpConfigured=()=>false; export async function sendArubaCallbackMail(){throw new Error("Real SMTP forbidden in tests");}` :
        `export const isCatalogPath=p=>["/","/servizi","/en","/synthetic-article"].includes(p);`
      }));
    },
  }],
});
await build({
  entryPoints: [path.join(root, "artifacts/marenetto-build/scripts/call-conversions.test.mjs")],
  outfile: path.join(out, "conversions.test.mjs"), bundle: true, platform: "node", format: "esm",
});
await build({
  entryPoints: [path.join(root, "artifacts/marenetto-build/tests/call-requests.fixture.tsx")],
  outfile: path.join(out, "callback-ui.test.mjs"), bundle: true, platform: "node", format: "esm", jsx: "automatic",
  loader: { ".css": "empty" }, define: { "import.meta.env.BASE_URL": '"/"' },
  banner: { js: "import {createRequire} from 'node:module';const require=createRequire(import.meta.url);" },
});
try {
  await pool.query(`CREATE SCHEMA ${schema}`);
  const client = await pool.connect();
  try {
    await client.query(`SET search_path TO ${schema}`);
    await client.query(migration);
    await client.query(`CREATE TABLE project_request_attempts (id serial PRIMARY KEY, ip_hash text NOT NULL, attempted_at timestamptz NOT NULL DEFAULT now())`);
    // Generic surfaces are kept empty; the new flow cannot write to them.
    await client.query(`CREATE TABLE project_requests (id serial PRIMARY KEY); CREATE TABLE internal_notifications (id serial PRIMARY KEY)`);
  } finally { client.release(); }
  const child = spawn(process.execPath, ["--test", path.join(out, "callbacks.test.mjs"), path.join(out, "conversions.test.mjs"), path.join(out, "callback-ui.test.mjs")], {
    stdio: "inherit", env: { ...process.env, DATABASE_URL: connection.toString() },
  });
  const [code] = await once(child, "exit");
  process.exitCode = code ?? 1;
} finally { await pool.query(`DROP SCHEMA IF EXISTS ${schema} CASCADE`); await pool.end(); }
