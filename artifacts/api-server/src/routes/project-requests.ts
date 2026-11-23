import { Router, type IRouter } from "express";
import { randomBytes, createHmac } from "node:crypto";
import { CreateProjectRequestBody, CreateProjectRequestResponse } from "@workspace/api-zod";
import { sendProjectRequestEmail } from "../lib/project-request-email";

const router: IRouter = Router();
// Volatile abuse/retry protection only. No payload, address or lead is persisted.
const salt = randomBytes(32);
const attempts = new Map<string, number[]>();
const deliveries = new Map<string, { digest: string; expires: number; result: Promise<void> }>();
const day = 86400000;
const hash = (value: string) => createHmac("sha256", salt).update(value).digest("hex");

router.post("/project-requests", async (req, res): Promise<void> => {
  res.set("Cache-Control", "no-store");
  const parsed = CreateProjectRequestBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Controlla i campi obbligatori." }); return; }
  const { formOpenedAt, companyWebsite, ...input } = parsed.data;
  if (!input.privacyAccepted || !(input.preferredChannel === "email" ? input.email : input.phone)) {
    res.status(400).json({ error: "Conferma la privacy e indica un recapito valido." }); return;
  }
  if (companyWebsite || (formOpenedAt && formOpenedAt > Date.now() - 4000)) {
    res.status(400).json({ error: "Invio non valido. Riprova tra qualche secondo." }); return;
  }
  // Never send real mail from development/preview and never fake a successful send.
  const host = String(req.headers["x-forwarded-host"] ?? req.headers.host ?? "").split(",")[0].trim().replace(/:443$/, "");
  if (process.env.NODE_ENV !== "production" || !["www.marenettobuild.com", "marenettobuild.com"].includes(host)) {
    res.status(503).json({ error: "Invio email disponibile solo sul sito pubblico. Nessun dato salvato." }); return;
  }
  const now = Date.now();
  for (const [key, values] of attempts) if (!values.some(at => at > now - day)) attempts.delete(key);
  for (const [key, entry] of deliveries) if (entry.expires <= now) deliveries.delete(key);
  const address = hash(req.ip ?? req.socket.remoteAddress ?? "unknown");
  const key = hash(input.idempotencyKey);
  const digest = hash(JSON.stringify(input));
  const previous = deliveries.get(key);
  if (previous && previous.digest !== digest) {
    res.status(409).json({ error: "Richiesta modificata: riprova con un nuovo invio." }); return;
  }
  if (!previous) {
    const recent = (attempts.get(address) ?? []).filter(at => at > now - day);
    if (recent.length >= 20 || recent.filter(at => at > now - 600000).length >= 5 || attempts.size >= 10000 || deliveries.size >= 10000) {
      res.status(429).json({ error: "Troppi tentativi. Riprova più tardi." }); return;
    }
    attempts.set(address, [...recent, now]);
    const result = sendProjectRequestEmail(input);
    deliveries.set(key, { digest, expires: now + day, result });
  }
  try {
    await deliveries.get(key)!.result;
    res.status(200).json(CreateProjectRequestResponse.parse({ status: "sent" }));
  } catch {
    deliveries.delete(key);
    // No provider error objects, recipient addresses or submitted fields in logs.
    req.log.error("Project request email unavailable");
    res.status(503).json({ error: "Email non inviata. I dati non sono stati salvati; riprova." });
  }
});
export default router;
