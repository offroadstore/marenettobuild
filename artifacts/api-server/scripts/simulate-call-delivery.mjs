// Explicit development-only helper for the browser test. Never sends SMTP.
import { build } from "esbuild";
import path from "node:path";
import { mkdir } from "node:fs/promises";
import { pathToFileURL } from "node:url";
if (process.env.NODE_ENV === "production" || process.env.REPLIT_DEPLOYMENT === "1") throw new Error("Development only");
const code = process.argv[2];
if (!/^CALL-[A-F0-9]{16}$/.test(code ?? "")) throw new Error("An exact synthetic callback receipt is required");
const root = path.resolve(import.meta.dirname, "../../..");
const directory = path.join(root, "generated-artifacts/callbacks");
await mkdir(directory, { recursive: true });
const outfile = path.join(directory, "simulate-delivery.mjs");
await build({
  stdin: { contents: `
    import { db, pool, callRequestsTable as calls } from "@workspace/db";
    import { eq } from "drizzle-orm";
    import { deliverCall } from "./src/lib/call-service";
    export async function simulate(code) {
      try {
        const [row] = await db.select().from(calls).where(eq(calls.code, code));
        if (!row?.isSynthetic) throw new Error("Only a known synthetic fixture can be simulated");
        let messages = 0;
        await deliverCall(row.id, async () => { messages++; });
        const [updated] = await db.select().from(calls).where(eq(calls.id, row.id));
        return { id: row.id, code, simulatedMessages: messages, ownerDelivery: updated.ownerDelivery, customerDelivery: updated.customerDelivery };
      } finally { await pool.end(); }
    }
  `, resolveDir: path.join(root, "artifacts/api-server"), loader: "ts" },
  outfile, bundle: true, platform: "node", format: "esm", external: ["pg-native", "nodemailer"],
  banner: { js: `import {createRequire} from "node:module";const require=createRequire(${JSON.stringify(path.join(root, "artifacts/api-server/package.json"))});` },
  plugins: [{
    name: "synthetic-mail-only", setup(b) {
      b.onResolve({ filter: /\/aruba-mailer$/ }, () => ({ path: "mail", namespace: "fixture" }));
      b.onResolve({ filter: /\/editorial-store$/ }, () => ({ path: "paths", namespace: "fixture" }));
      b.onLoad({ filter: /.*/, namespace: "fixture" }, args => ({ contents: args.path === "mail"
        ? `export const isArubaSmtpConfigured=()=>false;export async function sendArubaCallbackMail(){throw new Error("SMTP forbidden");}`
        : `export const isCatalogPath=()=>false;` }));
    },
  }],
});
const { simulate } = await import(pathToFileURL(outfile).href);
console.log(JSON.stringify(await simulate(code)));
