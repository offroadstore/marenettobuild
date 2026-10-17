import { randomBytes } from "node:crypto";
import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, projectRequestsTable } from "@workspace/db";
import {
  CreateProjectRequestBody,
  CreateProjectRequestResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const rateWindowMs = 60_000;
const rateLimit = 6;
const recentRequests = new Map<string, number[]>();

function requestAddress(address: string | undefined): string {
  return address || "unknown";
}

function makeCode(): string {
  return `MB-${randomBytes(5).toString("hex").toUpperCase()}`;
}

router.post("/project-requests", async (req, res): Promise<void> => {
  const now = Date.now();
  const address = requestAddress(req.ip);
  const attempts = (recentRequests.get(address) ?? []).filter(
    (timestamp) => now - timestamp < rateWindowMs,
  );
  if (attempts.length >= rateLimit) {
    res.status(429).json({ error: "Too many requests. Please try again shortly." });
    return;
  }
  attempts.push(now);
  recentRequests.set(address, attempts);

  const parsed = CreateProjectRequestBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Please check the required fields and try again." });
    return;
  }

  const input = parsed.data;
  const contactMatchesChannel =
    (input.preferredChannel === "email" && Boolean(input.email)) ||
    (input.preferredChannel !== "email" && Boolean(input.phone));
  if (!contactMatchesChannel || input.privacyAccepted !== true) {
    res.status(400).json({ error: "A valid contact method and privacy confirmation are required." });
    return;
  }

  const existing = await db
    .select()
    .from(projectRequestsTable)
    .where(eq(projectRequestsTable.idempotencyKey, input.idempotencyKey))
    .limit(1);
  if (existing[0]) {
    res.status(200).json(
      CreateProjectRequestResponse.parse({
        code: existing[0].code,
        status: "received",
        createdAt: existing[0].createdAt.toISOString(),
        notificationStatus: "pending_provider",
      }),
    );
    return;
  }

  const [request] = await db
    .insert(projectRequestsTable)
    .values({
      code: makeCode(),
      ...input,
      email: input.email ?? null,
      phone: input.phone ?? null,
      budget: input.budget ?? null,
      desiredPeriod: input.desiredPeriod ?? null,
    })
    .onConflictDoNothing({ target: projectRequestsTable.idempotencyKey })
    .returning();

  // A concurrent retry can win the insert race; return that original receipt.
  const stored = request ?? (
    await db
      .select()
      .from(projectRequestsTable)
      .where(eq(projectRequestsTable.idempotencyKey, input.idempotencyKey))
      .limit(1)
  )[0];
  if (!stored) {
    req.log.error("Project request could not be stored");
    res.status(500).json({ error: "We could not save the request. Please try again." });
    return;
  }

  res.status(request ? 201 : 200).json(
    CreateProjectRequestResponse.parse({
      code: stored.code,
      status: "received",
      createdAt: stored.createdAt.toISOString(),
      notificationStatus: "pending_provider",
    }),
  );
});

export default router;
