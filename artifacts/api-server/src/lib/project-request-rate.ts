import { createHmac } from "node:crypto";
import { db, projectRequestAttemptsTable as attempts } from "@workspace/db";
import { and, eq, gt, lte, sql } from "drizzle-orm";

const tenMinutesMs = 10 * 60_000;
const dayMs = 24 * 60 * 60_000;

export function isSpamSubmission(body: unknown, now: number): boolean {
  if (!body || typeof body !== "object") return false;
  if ("companyWebsite" in body && body.companyWebsite !== undefined && body.companyWebsite !== "") return true;
  return "formOpenedAt" in body && typeof body.formOpenedAt === "number" &&
    body.formOpenedAt > now - 4000;
}

export async function reserveProjectRequest(address: string): Promise<boolean> {
  const salt = process.env.PROJECT_REQUEST_IP_SALT ??
    (process.env.NODE_ENV === "production" ? undefined : process.env.SESSION_SECRET);
  if (!salt || salt.length < 32) throw new Error("PROJECT_REQUEST_IP_SALT is not configured.");
  const ipHash = createHmac("sha256", salt)
    .update(address.replace(/^::ffff:/i, "").toLowerCase())
    .digest("hex");
  return db.transaction(async (tx) => {
    // Serialize reservations per address across all API instances. A lock
    // collision can serialize two addresses but never merges their counts.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtextextended(${ipHash}, 0))`);
    const { rows: [clock] } = await tx.execute<{ now: Date }>(sql`select clock_timestamp() as now`);
    const now = new Date(clock.now);
    const [counts] = await tx.select({
      day: sql<number>`count(*)::int`,
      tenMinutes: sql<number>`(count(*) filter (where ${attempts.attemptedAt} > ${new Date(now.getTime() - tenMinutesMs).toISOString()}::timestamptz))::int`,
    }).from(attempts).where(and(eq(attempts.ipHash, ipHash), gt(attempts.attemptedAt, new Date(now.getTime() - dayMs))));
    if (counts.tenMinutes >= 5 || counts.day >= 20) return false;
    await tx.insert(attempts).values({ ipHash, attemptedAt: now });
    return true;
  });
}

export async function cleanProjectRequestAttempts() {
  await db.delete(attempts).where(lte(attempts.attemptedAt, sql`now() - interval '24 hours'`));
}
