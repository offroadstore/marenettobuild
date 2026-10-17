import { Readable } from "node:stream";
import { Router, type IRouter, type NextFunction, type Request, type Response } from "express";
import { and, asc, desc, eq } from "drizzle-orm";
import {
  CreateCmsPageBody,
  CreateCmsPageResponse,
  FinalizeInternalAttachmentBody,
  FinalizeInternalAttachmentResponse,
  GetInternalSessionResponse,
  InviteInternalMemberBody,
  InviteInternalMemberResponse,
  LeadStatus,
  ListCmsPagesResponse,
  ListInternalAttachmentsResponse,
  ListInternalLeadsResponse,
  ListInternalLeadsQueryParams,
  ListInternalMembersResponse,
  ListInternalNotificationsResponse,
  RequestInternalAttachmentUploadBody,
  RequestInternalAttachmentUploadResponse,
  UpdateCmsPageResponse,
  UpdateCmsPageBody,
  UpdateInternalLeadResponse,
  UpdateInternalLeadBody,
  UpdateInternalMemberBody,
  UpdateInternalMemberResponse,
  UpdateInternalNotificationBody,
  UpdateInternalNotificationResponse,
} from "@workspace/api-zod";
import {
  attachmentsTable,
  cmsPagesTable,
  db,
  internalMembersTable,
  notificationsTable,
  projectRequestsTable,
} from "@workspace/db";
import {
  permissionsForRole,
  requireInternalAccess,
  requirePermission,
} from "../middlewares/internalAccess";
import {
  ObjectNotFoundError,
  ObjectStorageService,
} from "../lib/objectStorage";

const router: IRouter = Router();
const objectStorage = new ObjectStorageService();
const allowedContentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);
const maxAttachmentSize = 15 * 1024 * 1024;

function isLiveDataApproved(): boolean {
  return (
    process.env.MARENETTO_PRIVACY_APPROVED === "true" &&
    process.env.MARENETTO_PROVIDERS_APPROVED === "true" &&
    process.env.MARENETTO_TESTING_APPROVED === "true"
  );
}

function requireLiveData(_req: Request, res: Response, next: NextFunction): void {
  if (!isLiveDataApproved()) {
    res.status(403).json({
      error: "This action is disabled until privacy, provider, and testing approvals are complete.",
    });
    return;
  }
  next();
}

function parseId(value: unknown): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null;
  const id = Number(value);
  return Number.isSafeInteger(id) ? id : null;
}

function safeFileName(value: string): string {
  const trimmed = value.trim().replace(/[\\/\r\n"]/g, "_");
  return trimmed.slice(0, 255) || "attachment";
}

async function leadIsInCurrentMode(id: number): Promise<boolean> {
  const [lead] = await db
    .select({ id: projectRequestsTable.id })
    .from(projectRequestsTable)
    .where(
      and(
        eq(projectRequestsTable.id, id),
        eq(projectRequestsTable.isSynthetic, !isLiveDataApproved()),
      ),
    )
    .limit(1);
  return Boolean(lead);
}

router.use("/internal", requireInternalAccess);

router.get(
  "/cms/pages/:locale/:slug",
  async (req, res): Promise<void> => {
    if (!isLiveDataApproved()) {
      res.status(404).json({ error: "Published page not found." });
      return;
    }
    const locale = req.params.locale;
    const slug = req.params.slug;
    if (
      typeof locale !== "string" ||
      !/^[a-z]{2}(?:-[A-Za-z0-9]+)?$/i.test(locale) ||
      typeof slug !== "string" ||
      !/^[a-z0-9-]{1,160}$/i.test(slug)
    ) {
      res.status(404).json({ error: "Published page not found." });
      return;
    }
    const [page] = await db
      .select()
      .from(cmsPagesTable)
      .where(
        and(
          eq(cmsPagesTable.locale, locale.toLowerCase()),
          eq(cmsPagesTable.slug, slug),
          eq(cmsPagesTable.status, "published"),
        ),
      )
      .limit(1);
    if (!page) {
      res.status(404).json({ error: "Published page not found." });
      return;
    }
    res.json(CreateCmsPageResponse.parse(page));
  },
);

router.get("/internal/session", (req, res): void => {
  const member = req.internalMember;
  if (!member) {
    res.status(401).json({ error: "Sign in is required." });
    return;
  }
  res.json(
    GetInternalSessionResponse.parse({
      email: member.email,
      role: member.role,
      dataMode: isLiveDataApproved() ? "live" : "synthetic",
      permissions: permissionsForRole(member.role),
    }),
  );
});

router.get(
  "/internal/leads",
  requirePermission("leads:read"),
  async (req, res): Promise<void> => {
    const parsedQuery = ListInternalLeadsQueryParams.safeParse({
      status: req.query.status,
    });
    if (!parsedQuery.success) {
      res.status(400).json({ error: "Invalid lead status." });
      return;
    }
    const status = parsedQuery.data.status;
    const modeCondition = eq(
      projectRequestsTable.isSynthetic,
      !isLiveDataApproved(),
    );
    const filter = status
      ? and(modeCondition, eq(projectRequestsTable.leadStatus, status))
      : modeCondition;
    const leads = await db
      .select()
      .from(projectRequestsTable)
      .where(filter)
      .orderBy(desc(projectRequestsTable.updatedAt));
    res.json(ListInternalLeadsResponse.parse(leads));
  },
);

router.patch(
  "/internal/leads/:leadId",
  requirePermission("leads:write"),
  requireLiveData,
  async (req, res): Promise<void> => {
    const id = parseId(req.params.leadId);
    const parsed = UpdateInternalLeadBody.safeParse(req.body);
    if (!id || !parsed.success || Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "Invalid lead update." });
      return;
    }
    const [lead] = await db
      .update(projectRequestsTable)
      .set(parsed.data)
      .where(
        and(
          eq(projectRequestsTable.id, id),
          eq(projectRequestsTable.isSynthetic, !isLiveDataApproved()),
        ),
      )
      .returning();
    if (!lead) {
      res.status(404).json({ error: "Enquiry not found." });
      return;
    }
    res.json(UpdateInternalLeadResponse.parse(lead));
  },
);

router.get(
  "/internal/cms/pages",
  requirePermission("cms:read"),
  async (req, res): Promise<void> => {
    if (!isLiveDataApproved()) {
      res.json(ListCmsPagesResponse.parse([]));
      return;
    }
    const locale = typeof req.query.locale === "string"
      ? req.query.locale.slice(0, 10)
      : undefined;
    const pages = await db
      .select()
      .from(cmsPagesTable)
      .where(locale ? eq(cmsPagesTable.locale, locale) : undefined)
      .orderBy(asc(cmsPagesTable.locale), asc(cmsPagesTable.slug));
    res.json(ListCmsPagesResponse.parse(pages));
  },
);

router.post(
  "/internal/cms/pages",
  requirePermission("cms:write"),
  requireLiveData,
  async (req, res): Promise<void> => {
    const parsed = CreateCmsPageBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid page draft." });
      return;
    }
    try {
      const [page] = await db
        .insert(cmsPagesTable)
        .values({
          ...parsed.data,
          locale: parsed.data.locale.toLowerCase(),
          slug: parsed.data.slug.toLowerCase(),
          updatedBy: req.internalMember!.email,
        })
        .returning();
      res.status(201).json(CreateCmsPageResponse.parse(page));
    } catch (error) {
      if (
        error &&
        typeof error === "object" &&
        "code" in error &&
        error.code === "23505"
      ) {
        res.status(409).json({ error: "A page with this locale and slug already exists." });
        return;
      }
      throw error;
    }
  },
);

router.patch(
  "/internal/cms/pages/:pageId",
  requirePermission("cms:write"),
  requireLiveData,
  async (req, res): Promise<void> => {
    const id = parseId(req.params.pageId);
    const parsed = UpdateCmsPageBody.safeParse(req.body);
    if (!id || !parsed.success || Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "Invalid page update." });
      return;
    }
    const [page] = await db
      .update(cmsPagesTable)
      .set({ ...parsed.data, updatedBy: req.internalMember!.email })
      .where(eq(cmsPagesTable.id, id))
      .returning();
    if (!page) {
      res.status(404).json({ error: "Page not found." });
      return;
    }
    res.json(UpdateCmsPageResponse.parse(page));
  },
);

router.get(
  "/internal/notifications",
  requirePermission("notifications:read"),
  async (_req, res): Promise<void> => {
    const notifications = await db
      .select()
      .from(notificationsTable)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(100);
    res.json(ListInternalNotificationsResponse.parse(notifications));
  },
);

router.patch(
  "/internal/notifications/:notificationId",
  requirePermission("notifications:read"),
  async (req, res): Promise<void> => {
    const id = parseId(req.params.notificationId);
    const parsed = UpdateInternalNotificationBody.safeParse(req.body);
    if (!id || !parsed.success) {
      res.status(400).json({ error: "Invalid notification update." });
      return;
    }
    const [notification] = await db
      .update(notificationsTable)
      .set({
        isRead: parsed.data.isRead,
        readAt: parsed.data.isRead ? new Date() : null,
      })
      .where(eq(notificationsTable.id, id))
      .returning();
    if (!notification) {
      res.status(404).json({ error: "Notification not found." });
      return;
    }
    res.json(UpdateInternalNotificationResponse.parse(notification));
  },
);

router.get(
  "/internal/members",
  requirePermission("members:manage"),
  async (_req, res): Promise<void> => {
    const members = await db
      .select()
      .from(internalMembersTable)
      .orderBy(asc(internalMembersTable.email));
    res.json(ListInternalMembersResponse.parse(members));
  },
);

router.post(
  "/internal/members",
  requirePermission("members:manage"),
  async (req, res): Promise<void> => {
    const parsed = InviteInternalMemberBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid invitation." });
      return;
    }
    const email = parsed.data.email.toLowerCase();
    const [member] = await db
      .insert(internalMembersTable)
      .values({
        email,
        role: parsed.data.role,
        status: "invited",
        invitedBy: req.internalMember!.email,
      })
      .onConflictDoUpdate({
        target: internalMembersTable.email,
        set: {
          role: parsed.data.role,
          status: "invited",
          invitedBy: req.internalMember!.email,
          updatedAt: new Date(),
        },
      })
      .returning();
    res.status(201).json(InviteInternalMemberResponse.parse(member));
  },
);

router.patch(
  "/internal/members/:memberId",
  requirePermission("members:manage"),
  async (req, res): Promise<void> => {
    const id = parseId(req.params.memberId);
    const parsed = UpdateInternalMemberBody.safeParse(req.body);
    if (!id || !parsed.success || Object.keys(parsed.data).length === 0) {
      res.status(400).json({ error: "Invalid member update." });
      return;
    }
    const [target] = await db
      .select()
      .from(internalMembersTable)
      .where(eq(internalMembersTable.id, id))
      .limit(1);
    if (!target) {
      res.status(404).json({ error: "Team member not found." });
      return;
    }
    if (
      target.email === req.internalMember!.email &&
      (parsed.data.status === "revoked" || parsed.data.role !== undefined)
    ) {
      res.status(400).json({ error: "You cannot change your own owner access." });
      return;
    }
    if (
      target.role === "owner" &&
      (parsed.data.status === "revoked" || parsed.data.role !== undefined && parsed.data.role !== "owner")
    ) {
      const owners = await db
        .select({ id: internalMembersTable.id })
        .from(internalMembersTable)
        .where(
          and(
            eq(internalMembersTable.role, "owner"),
            eq(internalMembersTable.status, "active"),
          ),
        );
      if (owners.length <= 1) {
        res.status(409).json({ error: "At least one active owner must remain." });
        return;
      }
    }
    const [member] = await db
      .update(internalMembersTable)
      .set(parsed.data)
      .where(eq(internalMembersTable.id, id))
      .returning();
    res.json(UpdateInternalMemberResponse.parse(member));
  },
);

router.get(
  "/internal/attachments",
  requirePermission("attachments:manage"),
  async (req, res): Promise<void> => {
    if (!isLiveDataApproved()) {
      res.json(ListInternalAttachmentsResponse.parse([]));
      return;
    }
    const leadId = req.query.leadId === undefined
      ? undefined
      : Number(req.query.leadId);
    if (leadId !== undefined && (!Number.isSafeInteger(leadId) || leadId < 1)) {
      res.status(400).json({ error: "Invalid lead identifier." });
      return;
    }
    const attachments = await db
      .select()
      .from(attachmentsTable)
      .where(
        leadId !== undefined
          ? eq(attachmentsTable.projectRequestId, leadId)
          : undefined,
      )
      .orderBy(desc(attachmentsTable.createdAt));
    res.json(ListInternalAttachmentsResponse.parse(attachments));
  },
);

router.post(
  "/internal/attachments/upload-url",
  requirePermission("attachments:manage"),
  requireLiveData,
  async (req, res): Promise<void> => {
    const parsed = RequestInternalAttachmentUploadBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid attachment metadata." });
      return;
    }
    const input = parsed.data;
    if (
      !allowedContentTypes.has(input.contentType) ||
      input.size > maxAttachmentSize ||
      input.leadId !== undefined &&
      input.leadId !== null &&
      !(await leadIsInCurrentMode(input.leadId))
    ) {
      res.status(400).json({ error: "This file type, size, or lead is not allowed." });
      return;
    }
    try {
      const uploadURL = await objectStorage.getObjectEntityUploadURL();
      const objectPath = objectStorage.normalizeObjectEntityPath(uploadURL);
      res.json(
        RequestInternalAttachmentUploadResponse.parse({
          uploadURL,
          objectPath,
        }),
      );
    } catch (error) {
      req.log.error({ err: error }, "Could not create a private attachment upload URL");
      res.status(503).json({ error: "Private file storage is not available." });
    }
  },
);

router.post(
  "/internal/attachments",
  requirePermission("attachments:manage"),
  requireLiveData,
  async (req, res): Promise<void> => {
    const parsed = FinalizeInternalAttachmentBody.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: "Invalid attachment details." });
      return;
    }
    const input = parsed.data;
    if (
      !input.objectPath.startsWith("/objects/uploads/") ||
      input.objectPath.includes("..") ||
      !allowedContentTypes.has(input.contentType) ||
      input.size > maxAttachmentSize ||
      input.leadId !== undefined &&
      input.leadId !== null &&
      !(await leadIsInCurrentMode(input.leadId))
    ) {
      res.status(400).json({ error: "This attachment cannot be registered." });
      return;
    }
    try {
      const objectFile = await objectStorage.getObjectEntityFile(input.objectPath);
      const [metadata] = await objectFile.getMetadata();
      const actualSize = Number(metadata.size);
      if (
        actualSize !== input.size ||
        metadata.contentType !== input.contentType ||
        actualSize > maxAttachmentSize
      ) {
        res.status(400).json({ error: "Uploaded file metadata does not match." });
        return;
      }
      await objectStorage.trySetObjectEntityAclPolicy(input.objectPath, {
        owner: req.internalMember!.email,
        visibility: "private",
      });
      const [attachment] = await db
        .insert(attachmentsTable)
        .values({
          projectRequestId: input.leadId,
          objectPath: input.objectPath,
          fileName: safeFileName(input.fileName),
          contentType: input.contentType,
          size: actualSize,
          uploadedBy: req.internalMember!.email,
        })
        .returning();
      res.status(201).json(FinalizeInternalAttachmentResponse.parse(attachment));
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Uploaded file was not found." });
        return;
      }
      req.log.error({ err: error }, "Could not register private attachment");
      res.status(503).json({ error: "Private file could not be registered." });
    }
  },
);

router.get(
  "/storage/objects/*objectPath",
  requireInternalAccess,
  requirePermission("attachments:manage"),
  requireLiveData,
  async (req: Request, res: Response): Promise<void> => {
    const raw = req.params.objectPath;
    const relativePath = Array.isArray(raw) ? raw.join("/") : raw;
    const objectPath = `/objects/${relativePath}`;
    const [attachment] = await db
      .select()
      .from(attachmentsTable)
      .where(eq(attachmentsTable.objectPath, objectPath))
      .limit(1);
    if (!attachment) {
      res.status(404).json({ error: "Attachment not found." });
      return;
    }
    try {
      const file = await objectStorage.getObjectEntityFile(objectPath);
      const response = await objectStorage.downloadObject(file, 0);
      res.status(response.status);
      response.headers.forEach((value, key) => res.setHeader(key, value));
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      res.setHeader("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(attachment.fileName)}`);
      if (response.body) {
        Readable.fromWeb(response.body as ReadableStream<Uint8Array>).pipe(res);
      } else {
        res.end();
      }
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        res.status(404).json({ error: "Attachment not found." });
        return;
      }
      req.log.error({ err: error }, "Could not stream private attachment");
      res.status(503).json({ error: "Private file could not be served." });
    }
  },
);

export default router;
