import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { and, desc, eq, gte, lt, sql } from "drizzle-orm";
import { db, callRequestsTable as calls } from "@workspace/db";
import { CreateCallRequestBody, CreateCallRequestResponse, GetCallRequestConfigResponse, ListCallRequestsQueryParams,
  ListCallRequestsResponse, UpdateCallRequestBody, UpdateCallRequestParams, UpdateCallRequestResponse } from "@workspace/api-zod";
import { requireInternalAccess } from "../middlewares/internalAccess";
import { isSpamSubmission, reserveProjectRequest } from "../lib/project-request-rate";
import { CALL_PRIVACY_VERSION, callLiveApproved, callReceipt, csvCell, deliverCall, storeCall } from "../lib/call-service";

const router: IRouter = Router();
router.get("/call-requests/config", (_req, res) => {
  res.setHeader("Cache-Control", "private, no-store");
  res.json(GetCallRequestConfigResponse.parse({ isSynthetic: !callLiveApproved(), privacyVersion: CALL_PRIVACY_VERSION }));
});
export function requireCallOwner(req: Request, res: Response, next: NextFunction) {
  if (!req.internalMember) { res.status(401).json({ error: "Sign in required." }); return; }
  if (req.internalMember.role !== "owner") { res.status(403).json({ error: "Owner required." }); return; }
  next();
}
router.post("/call-requests", async (req, res): Promise<void> => {
  res.setHeader("Cache-Control", "private, no-store");
  const parsed = CreateCallRequestBody.safeParse(req.body);
  if (!parsed.success || !parsed.data.firstName.trim() || !parsed.data.lastName.trim() ||
    !/^\+[1-9][0-9]{7,14}$/.test(parsed.data.mobile) || parsed.data.privacyAccepted !== true) {
    res.status(400).json({ error: "invalid_input" }); return;
  }
  // Never give a fake saved receipt for a discarded spam submission.
  if (isSpamSubmission(req.body, Date.now())) { res.status(400).json({ error: "invalid_submission" }); return; }
  try {
    if (!await reserveProjectRequest(req.ip ?? req.socket.remoteAddress ?? "unknown")) {
      res.status(429).json({ error: "rate_limited" }); return;
    }
    const result = await storeCall(parsed.data, callLiveApproved());
    if (!result) { res.status(409).json({ error: "idempotency_conflict" }); return; }
    await deliverCall(result.row.id);
    const [row] = await db.select().from(calls).where(eq(calls.id, result.row.id));
    if (!row) { res.status(409).json({ error: "request_removed" }); return; }
    res.status(result.created ? 201 : 200).json(CreateCallRequestResponse.parse(callReceipt(row)));
  } catch {
    req.log.error("Callback storage or delivery state unavailable");
    res.status(503).json({ error: "save_unavailable" });
  }
});
router.use("/internal/call-requests", requireInternalAccess, requireCallOwner, (_req, res, next) => {
  res.setHeader("Cache-Control", "private, no-store"); next();
});
function callFilter(query: unknown) {
  const raw = query as Record<string, unknown>;
  for (const day of [raw.start, raw.end]) if (day !== undefined &&
    (typeof day !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(day) || !Number.isFinite(Date.parse(day)) ||
    new Date(day).toISOString().slice(0, 10) !== day)) throw new Error("date");
  // Generated date schemas intentionally accept Date objects, not HTTP strings.
  const q = ListCallRequestsQueryParams.parse({
    ...raw,
    ...(typeof raw.start === "string" ? { start: new Date(raw.start) } : {}),
    ...(typeof raw.end === "string" ? { end: new Date(raw.end) } : {}),
  });
  if (q.start && q.end && q.start > q.end) throw new Error("range");
  return and(eq(calls.isSynthetic, !callLiveApproved()),
    q.start ? gte(calls.createdAt, new Date(q.start)) : undefined,
    q.end ? lt(calls.createdAt, new Date(new Date(q.end).getTime() + 86400000)) : undefined,
    q.language ? sql`(${calls.data}->>'preferredLanguage' = ${q.language} OR (${calls.data}->>'preferredLanguage' IS NULL AND ${calls.consentLanguage} = ${q.language}))` : undefined,
    q.project ? sql`${calls.data}->>'project' = ${q.project}` : undefined,
    q.status ? eq(calls.status, q.status) : undefined);
}
router.get(["/internal/call-requests", "/internal/call-requests/export"], async (req, res): Promise<void> => {
  let filter;
  try { filter = callFilter(req.query); } catch { res.status(400).json({ error: "Invalid filters." }); return; }
  const rows = await db.select().from(calls).where(filter).orderBy(desc(calls.createdAt));
  if (req.path.endsWith("/export")) {
    const keys = ["code", "createdAt", "consentAt", "privacyVersion", "consentLanguage", "status", "notes", "acquiredCustomer", "ownerDelivery", "customerDelivery"] as const;
    const fields = ["firstName", "lastName", "email", "mobile", "whatsapp", "project", "location", "budget", "startWhen", "timeSlot", "preferredLanguage", "message", "marketingAccepted", "sourcePath", "utm"];
    res.setHeader("Content-Disposition", 'attachment; filename="call-requests.csv"');
    res.type("text/csv").send("\uFEFF" + [ [...keys, ...fields].map(csvCell).join(","),
      ...rows.map(row => [...keys.map(k => row[k] instanceof Date ? (row[k] as Date).toISOString() : row[k]), ...fields.map(k => row.data[k])].map(csvCell).join(",")),
    ].join("\r\n")); return;
  }
  res.json(ListCallRequestsResponse.parse(rows));
});
router.patch("/internal/call-requests/:id", async (req, res): Promise<void> => {
  const id = UpdateCallRequestParams.safeParse(req.params), body = UpdateCallRequestBody.safeParse(req.body);
  if (!id.success || !body.success || !Object.keys(body.data).length) { res.status(400).json({ error: "Invalid update." }); return; }
  const [row] = await db.update(calls).set({ ...body.data, updatedAt: new Date() })
    .where(and(eq(calls.id, id.data.id), eq(calls.isSynthetic, !callLiveApproved()))).returning();
  if (!row) { res.status(404).json({ error: "Not found." }); return; }
  res.json(UpdateCallRequestResponse.parse(row));
});
router.delete("/internal/call-requests/:id", async (req, res): Promise<void> => {
  const id = UpdateCallRequestParams.safeParse(req.params);
  if (!id.success) { res.status(400).json({ error: "Invalid id." }); return; }
  const rows = await db.delete(calls).where(and(eq(calls.id, id.data.id), eq(calls.isSynthetic, !callLiveApproved()))).returning({ id: calls.id });
  res.sendStatus(rows.length ? 204 : 404);
});
export default router;
