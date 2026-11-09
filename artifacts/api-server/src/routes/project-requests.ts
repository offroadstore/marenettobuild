import { randomBytes } from "node:crypto";
import { Router, type IRouter, type Request } from "express";
import { and, eq } from "drizzle-orm";
import {
  db,
  notificationsTable,
  projectRequestsTable,
} from "@workspace/db";
import {
  CreateProjectRequestBody,
  CreateProjectRequestResponse,
} from "@workspace/api-zod";
import {
  isArubaSmtpConfigured,
  sendArubaLeadNotification,
  type LeadEmailStatus,
} from "../lib/aruba-mailer";

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

function liveDataApproved(): boolean {
  return (
    process.env.MARENETTO_PRIVACY_APPROVED === "true" &&
    process.env.MARENETTO_PROVIDERS_APPROVED === "true" &&
    process.env.MARENETTO_TESTING_APPROVED === "true"
  );
}

const syntheticPreviewLead = {
  idempotencyKey: "marenetto-preview-synthetic-lead-v1",
  requestType: "project",
  propertyType: "Casa dimostrativa",
  service: "Manutenzione preventiva",
  location: "Cefalù (dato sintetico)",
  projectStage: "Valutazione iniziale",
  message: "Richiesta sintetica per collaudare il flusso in anteprima.",
  preferredLanguage: "it",
  name: "Contatto dimostrativo",
  email: "demo@example.invalid",
  phone: null,
  preferredChannel: "email",
  budget: null,
  desiredPeriod: null,
  needsAccommodation: false,
  needsMobility: false,
  privacyAccepted: true,
  isSynthetic: true,
};

async function ensureLeadNotification(
  leadId: number,
  code: string,
  isSynthetic: boolean,
): Promise<{ id: number; emailStatus: LeadEmailStatus }> {
  const [inserted] = await db
    .insert(notificationsTable)
    .values({
      type: "lead",
      title: isSynthetic ? "Lead dimostrativo" : `Nuova richiesta ${code}`,
      message: isSynthetic
        ? "È stato creato un lead sintetico per provare la gestione interna."
        : `È arrivata una nuova richiesta (${code}).`,
      projectRequestId: leadId,
    })
    .onConflictDoNothing()
    .returning({
      id: notificationsTable.id,
      emailStatus: notificationsTable.emailStatus,
    });

  if (inserted) {
    return {
      id: inserted.id,
      emailStatus: inserted.emailStatus as LeadEmailStatus,
    };
  }

  const [existing] = await db
    .select({
      id: notificationsTable.id,
      emailStatus: notificationsTable.emailStatus,
    })
    .from(notificationsTable)
    .where(eq(notificationsTable.projectRequestId, leadId))
    .limit(1);

  if (!existing) {
    throw new Error("Lead notification could not be persisted.");
  }
  return {
    id: existing.id,
    emailStatus: existing.emailStatus as LeadEmailStatus,
  };
}

async function deliverLeadNotification(
  lead: typeof projectRequestsTable.$inferSelect,
  notificationId: number,
  req: Request,
): Promise<LeadEmailStatus> {
  if (
    lead.isSynthetic ||
    !liveDataApproved() ||
    !isArubaSmtpConfigured()
  ) {
    return "pending_provider";
  }

  const [claimed] = await db
    .update(notificationsTable)
    .set({
      emailStatus: "sending",
      emailAttemptedAt: new Date(),
    })
    .where(
      and(
        eq(notificationsTable.id, notificationId),
        eq(notificationsTable.emailStatus, "pending_provider"),
      ),
    )
    .returning({ id: notificationsTable.id });

  if (!claimed) {
    const [current] = await db
      .select({ emailStatus: notificationsTable.emailStatus })
      .from(notificationsTable)
      .where(eq(notificationsTable.id, notificationId))
      .limit(1);
    return (current?.emailStatus as LeadEmailStatus | undefined) ?? "failed";
  }

  try {
    await sendArubaLeadNotification(lead);
    await db
      .update(notificationsTable)
      .set({ emailStatus: "sent" })
      .where(eq(notificationsTable.id, notificationId));
    return "sent";
  } catch {
    req.log.error(
      { leadId: lead.id, notificationId },
      "Aruba lead notification email failed",
    );
    try {
      await db
        .update(notificationsTable)
        .set({ emailStatus: "failed" })
        .where(eq(notificationsTable.id, notificationId));
    } catch {
      req.log.error(
        { leadId: lead.id, notificationId },
        "Could not update Aruba email delivery status",
      );
    }
    return "failed";
  }
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
  if (input.privacyAccepted !== true) {
    res.status(400).json({ error: "A valid contact method and privacy confirmation are required." });
    return;
  }

  const liveMode = liveDataApproved();
  const storedInput = liveMode ? input : syntheticPreviewLead;
  const contactMatchesChannel =
    (storedInput.preferredChannel === "email" && Boolean(storedInput.email)) ||
    (storedInput.preferredChannel !== "email" && Boolean(storedInput.phone));
  if (!contactMatchesChannel) {
    res.status(400).json({ error: "A valid contact method is required." });
    return;
  }

  const existing = await db
    .select()
    .from(projectRequestsTable)
    .where(eq(projectRequestsTable.idempotencyKey, storedInput.idempotencyKey))
    .limit(1);
  if (existing[0]) {
    const notification = await ensureLeadNotification(
      existing[0].id,
      existing[0].code,
      existing[0].isSynthetic,
    );
    const notificationStatus = await deliverLeadNotification(
      existing[0],
      notification.id,
      req,
    );
    res.status(200).json(
      CreateProjectRequestResponse.parse({
        code: existing[0].code,
        status: "received",
        createdAt: existing[0].createdAt.toISOString(),
        notificationStatus,
        isSynthetic: existing[0].isSynthetic,
      }),
    );
    return;
  }

  const [request] = await db
    .insert(projectRequestsTable)
    .values({
      code: liveMode ? makeCode() : "DEMO-MB-001",
      ...storedInput,
      email: storedInput.email ?? null,
      phone: storedInput.phone ?? null,
      budget: storedInput.budget ?? null,
      desiredPeriod: storedInput.desiredPeriod ?? null,
      isSynthetic: !liveMode,
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

  const notification = await ensureLeadNotification(
    stored.id,
    stored.code,
    stored.isSynthetic,
  );
  const notificationStatus = await deliverLeadNotification(
    stored,
    notification.id,
    req,
  );

  res.status(request ? 201 : 200).json(
    CreateProjectRequestResponse.parse({
      code: stored.code,
      status: "received",
      createdAt: stored.createdAt.toISOString(),
      notificationStatus,
      isSynthetic: stored.isSynthetic,
    }),
  );
});

export default router;
