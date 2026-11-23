import { Router, type IRouter, type Request, type Response, type NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { randomUUID } from "node:crypto";
import { and, eq, gt, lt } from "drizzle-orm";
import { db, monitoringSettingsTable as settings, monitoringOauthStatesTable as states } from "@workspace/db";
import {
  GetMonitoringResponse, GetKpiDashboardResponse, SaveMonitoringTagsBody,
  SelectMonitoringPropertyBody, ListMonitoringPropertiesParams,
  GetPublicMonitoringResponse, SaveMonitoringCollectionBody,
  type GoogleReportService, type MonitoringState, type KpiSource,
} from "@workspace/api-zod";
import { requireInternalAccess, requirePermission } from "../middlewares/internalAccess";
import { addDays, decryptTokens, discovery, emptySource, environment, getPeriod, hash, liveDataApproved, MonitoringError, nonce, oauthConfig, scopes } from "../lib/monitoring/core";
import { exchangeToken, gaPropertyTimezone, listProperties, revokeToken } from "../lib/monitoring/google";
import { accessToken, getSettings, lockedSettings, recordCheck, savePatch, setConnection } from "../lib/monitoring/store";
import { fetchReport, reportCache } from "../lib/monitoring/reports";
import { operationalReport } from "../lib/monitoring/operational";
import { collectionEnvironment, collectionStatus, realtimeReceipt, verifyWebStream } from "../lib/monitoring/collection";
import directPolicy from "../../../../lib/legal-policy/direct-analytics.json";
import legalPolicy from "../../../../lib/legal-policy/analytics.json";

const router: IRouter = Router();
const prefix = "/internal/monitoring";
const cookieName = "__Secure-marenetto-google-state";
const cookiePath = "/api/internal/monitoring/google/callback";
// Match the application's existing trusted-proxy host handling.
function requestHost(req: Request) {
  const forwarded = req.headers["x-forwarded-host"];
  return (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(",")[0]?.trim() || req.get("host");
}
const asyncRoute = (handler: (req: Request, res: Response) => Promise<void>) =>
  async (req: Request, res: Response) => {
    try { await handler(req, res); }
    catch (error) {
      const safe = error instanceof MonitoringError ? error : new MonitoringError("unavailable", "Monitoraggio temporaneamente non disponibile. Verificare che il database sia aggiornato e riprovare.");
      // Never log provider responses, request bodies, token errors or callback URLs.
      req.log.warn({ monitoringState: safe.state }, "Monitoring request was not completed");
      res.status(safe.status).json({ error: safe.message, state: safe.state });
    }
  };
function mutationOrigin(req: Request, res: Response, next: NextFunction) {
  let allowed = false;
  try {
    const origin = new URL(req.get("origin") ?? "");
    const host = requestHost(req);
    allowed = origin.protocol === "https:" && origin.host === host && req.get("sec-fetch-site") !== "cross-site";
  } catch { /* Reject missing and malformed Origin. */ }
  if (!allowed) { res.status(403).json({ error: "Richiesta non consentita: riaprire la console dallo stesso sito." }); return; }
  next();
}
router.use([prefix, "/internal/dashboard"], requireInternalAccess, (_req, res, next) => {
  res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer" }); next();
});
router.use(prefix, (req, res, next) => {
  if (["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) { mutationOrigin(req, res, next); return; }
  next();
});
const serviceParam = (req: Request): GoogleReportService => {
  const parsed = ListMonitoringPropertiesParams.safeParse(req.params);
  if (!parsed.success) throw new MonitoringError("unavailable", "Servizio di report non valido.", 400);
  return parsed.data.service;
};
const propertyFor = (row: Awaited<ReturnType<typeof getSettings>>, service: GoogleReportService) => service === "ga4" ? row.ga4Property : row.searchConsoleProperty;

router.get("/monitoring/public", async (req, res) => {
  res.set({ "Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "Vary": "Host" });
  if (environment() === "production" && requestHost(req) === new URL(directPolicy.origin).host && req.get("sec-fetch-site") !== "cross-site") {
    res.json(GetPublicMonitoringResponse.parse({
      ...directPolicy, enabled: true, runtimeOrigin: '', ...legalPolicy,
      expiresAt: new Date(Date.now() + 60000).toISOString(),
    }));
    return;
  }
  const policy = collectionEnvironment();
  const off = { enabled: false, origin: "", runtimeOrigin: "", measurementId: "", privacyUrl: policy.privacyUrl || "https://www.marenettobuild.com/cookie", privacyVersion: policy.privacyVersion, expiresAt: new Date(Date.now() + 60000).toISOString() };
  try {
    const row = await getSettings(), status = collectionStatus(row);
    const allowed = status.enabled && new URL(status.collection.origin).host === requestHost(req) && req.get("sec-fetch-site") !== "cross-site";
    res.json(GetPublicMonitoringResponse.parse(allowed ? {
      ...off, enabled: true, origin: status.collection.origin, runtimeOrigin: status.collection.runtimeOrigin, measurementId: row.measurementId,
      privacyUrl: status.collection.privacyUrl, privacyVersion: status.collection.privacyVersion,
    } : off));
  } catch { res.json(GetPublicMonitoringResponse.parse(off)); }
});
router.get(prefix, requirePermission("kpi:read"), asyncRoute(async (req, res) => {
  const row = await getSettings();
  const configured = Boolean(oauthConfig());
  const collection = collectionStatus(row);
  res.json(GetMonitoringResponse.parse({
    environment: environment(), canManage: req.internalMember!.role === "owner",
    oauthConfigured: configured, connected: Boolean(row.encryptedTokens),
    services: (["ga4", "searchConsole"] as const).map(service => {
      const property = propertyFor(row, service), check = row.checks[service];
      let state: MonitoringState = !configured ? "not_configured" : !row.encryptedTokens ? "disconnected" : !property ? "property_required" : (check?.state as MonitoringState) ?? "unchecked";
      if (state === "ready" && check?.successAt && Date.now() - Date.parse(check.successAt) > 86400000) state = "stale";
      return { service, state, property, lastCheckedAt: check?.checkedAt ?? null, lastSuccessAt: check?.successAt ?? null, error: check?.error ?? null };
    }),
    tags: { measurementId: row.measurementId, containerId: row.containerId },
    updatedAt: row.updatedAt.toISOString(),
    trackingEnabled: collection.enabled,
    trackingBlockers: collection.blockers,
    collection: collection.collection,
    discovery,
  }));
}));
router.put(`${prefix}/collection`, requirePermission("monitoring:manage"), asyncRoute(async (req, res) => {
  const parsed = SaveMonitoringCollectionBody.safeParse(req.body);
  if (!parsed.success) throw new MonitoringError("unavailable", "Specificare attivazione o disattivazione.", 400);
  await lockedSettings(async (tx, row) => {
    const status = collectionStatus(row);
    if (parsed.data.enabled && status.blockers.length) throw new MonitoringError("not_configured", status.blockers.join(" "), 409);
    await tx.update(settings).set({ collectionEnabled: parsed.data.enabled, updatedAt: new Date() }).where(eq(settings.environment, row.environment));
  });
  res.json({ message: parsed.data.enabled ? "Raccolta abilitata sul solo dominio approvato, dopo consenso analytics. Ricezione reale ancora da collaudare." : "Raccolta disattivata. Le pagine già aperte interrompono il runtime entro 60 secondi; la revoca del visitatore è immediata." });
}));
router.post(`${prefix}/collection/verify`, requirePermission("monitoring:manage"), asyncRoute(async (_req, res) => {
  const row = await getSettings();
  try {
    const token = await accessToken(row.revision), check = await verifyWebStream(row, token.access);
    await lockedSettings(async (tx, current) => {
      if (current.revision !== row.revision) throw new MonitoringError("disconnected", "Configurazione cambiata: ripetere la verifica.", 409);
      await tx.update(settings).set({ collectionCheck: check }).where(eq(settings.environment, row.environment));
    });
    res.json({ message: "Flusso web, ID, origine e enhanced measurement disattivato verificati tramite Google; raggiungibilità e origini del runtime dedicato confermate. Non è una prova di ricezione dal nuovo sito; verifica valida 24 ore." });
  } catch (error) {
    await lockedSettings(async (tx, current) => {
      if (current.revision === row.revision) await tx.update(settings).set({ collectionEnabled: false, collectionCheck: null }).where(eq(settings.environment, row.environment));
    });
    throw error;
  }
}));
router.post(`${prefix}/collection/realtime`, requirePermission("monitoring:manage"), asyncRoute(async (_req, res) => {
  const row = await getSettings();
  if (!collectionStatus(row).enabled || !row.collectionCheck) throw new MonitoringError("not_configured", "Prima verificare il flusso e abilitare la raccolta.", 409);
  const token = await accessToken(row.revision), received = await realtimeReceipt(row, token.access);
  const now = new Date().toISOString();
  await lockedSettings(async (tx, current) => {
    if (current.revision !== row.revision || !current.collectionEnabled || !current.collectionCheck) throw new MonitoringError("disconnected", "Configurazione cambiata.", 409);
    await tx.update(settings).set({ collectionCheck: { ...current.collectionCheck, realtimeCheckedAt: now, ...(received ? { realtimeReceivedAt: now } : {}) } }).where(eq(settings.environment, row.environment));
  });
  res.json({ message: received ? "Realtime ha restituito eventi negli ultimi 30 minuti. Confrontare nel provider ora, dominio e percorso del test consenziente: altri siti nella stessa proprietà possono contribuire. Questa lettura non certifica da sola il nuovo sito." : "Realtime letto, ma nessun evento atteso ricevuto. Nessuna ricezione certificata; controllare consenso, blocchi e ritardi del provider." });
}));
router.post(`${prefix}/google/start`, requirePermission("monitoring:manage"), asyncRoute(async (req, res) => {
  const config = oauthConfig();
  if (!config) throw new MonitoringError("not_configured", "Configurare client OAuth Google, redirect HTTPS e chiave di cifratura nei Secrets server. Nessuna credenziale va inserita nella dashboard.");
  if (new URL(config.redirectUri).host !== requestHost(req)) throw new MonitoringError("not_configured", "Il redirect OAuth non corrisponde a questo ambiente. Configurare il redirect del sito aperto.");
  const session = getAuth(req).sessionId;
  if (!session) throw new MonitoringError("forbidden", "Sessione interna non disponibile: accedere di nuovo.", 401);
  const state = nonce(), verifier = nonce(), row = await getSettings();
  await db.delete(states).where(lt(states.expiresAt, new Date()));
  await db.delete(states).where(and(eq(states.environment, environment()), eq(states.memberId, req.internalMember!.id)));
  await db.insert(states).values({ hash: hash(state), environment: environment(), memberId: req.internalMember!.id, sessionHash: hash(session), verifier, revision: row.revision, expiresAt: new Date(Date.now() + 10 * 60000) });
  res.cookie(cookieName, state, { secure: true, httpOnly: true, sameSite: "lax", path: cookiePath, maxAge: 10 * 60000 });
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  url.search = new URLSearchParams({ client_id: config.clientId, redirect_uri: config.redirectUri, response_type: "code", scope: scopes.join(" "), state, access_type: "offline", prompt: "consent", code_challenge: hash(verifier), code_challenge_method: "S256", include_granted_scopes: "false" }).toString();
  res.json({ url: url.toString() });
}));
router.get(`${prefix}/google/callback`, requirePermission("monitoring:manage"), asyncRoute(async (req, res) => {
  const state = typeof req.query.state === "string" ? req.query.state : "";
  const sessionId = getAuth(req).sessionId ?? "";
  const cookie = req.headers.cookie?.split(";").map(c => c.trim()).find(c => c.startsWith(cookieName + "="))?.slice(cookieName.length + 1);
  res.clearCookie(cookieName, { secure: true, httpOnly: true, sameSite: "lax", path: cookiePath });
  if (!/^[A-Za-z0-9_-]{43}$/.test(state) || !cookie || hash(cookie) !== hash(state) || !sessionId) throw new MonitoringError("forbidden", "Consenso non valido o sessione cambiata. Avviare nuovamente il collegamento.", 400);
  // DELETE ... RETURNING consumes the state atomically even when consent was denied.
  const [attempt] = await db.delete(states).where(and(eq(states.hash, hash(state)), eq(states.environment, environment()), eq(states.memberId, req.internalMember!.id), eq(states.sessionHash, hash(sessionId)), gt(states.expiresAt, new Date()))).returning();
  if (!attempt) throw new MonitoringError("forbidden", "Consenso scaduto o già utilizzato. Avviare nuovamente il collegamento.", 400);
  const config = oauthConfig();
  if (!config || new URL(config.redirectUri).host !== requestHost(req)) throw new MonitoringError("not_configured", "Redirect OAuth non configurato per questo ambiente.");
  if (req.query.error) { res.redirect(303, "/internal?section=monitoring&google=cancelled"); return; }
  const code = typeof req.query.code === "string" ? req.query.code : "";
  if (!code || code.length > 4096) throw new MonitoringError("forbidden", "Codice Google mancante o non valido.", 400);
  let result = "connected";
  try {
    await lockedSettings(async (tx, row) => {
      if (attempt.revision !== row.revision) throw new MonitoringError("disconnected", "Configurazione cambiata durante il consenso. Riprovare.", 409);
      const tokens = await exchangeToken({ grant_type: "authorization_code", code, code_verifier: attempt.verifier, redirect_uri: config.redirectUri });
      await setConnection(tx, row, tokens);
    });
    reportCache.clear();
  } catch {
    result = "failed";
    req.log.warn("Google consent was not completed; no credentials were exposed");
  }
  res.redirect(303, `/internal?section=monitoring&google=${result}`);
}));
router.post(`${prefix}/google/disconnect`, requirePermission("monitoring:manage"), asyncRoute(async (_req, res) => {
  let revoked = true;
  await lockedSettings(async (tx, row) => {
    if (row.encryptedTokens) {
      try { revoked = await revokeToken(decryptTokens(row.encryptedTokens).refresh); } catch { revoked = false; }
    }
    await tx.update(settings).set({ encryptedTokens: null, ga4Property: null, searchConsoleProperty: null, checks: {}, collectionEnabled: false, collectionCheck: null, revision: randomUUID(), updatedAt: new Date() }).where(eq(settings.environment, row.environment));
    await tx.delete(states).where(eq(states.environment, row.environment));
  });
  reportCache.clear();
  res.json({ message: revoked ? "Account scollegato e autorizzazione Google revocata." : "Account scollegato localmente. Revoca remota non confermata: rimuovere anche l’accesso nelle autorizzazioni del proprio account Google." });
}));
router.get(`${prefix}/properties/:service`, requirePermission("monitoring:manage"), asyncRoute(async (req, res) => {
  const service = serviceParam(req), row = await getSettings();
  try {
    const token = await accessToken(row.revision);
    const properties = await listProperties(service, token.access);
    if ((await getSettings()).revision !== row.revision) throw new MonitoringError("disconnected", "Configurazione cambiata. Ricaricare.", 409);
    res.json(properties);
  } catch (error) {
    if (error instanceof MonitoringError && ["revoked", "forbidden"].includes(error.state)) reportCache.clear();
    if (error instanceof MonitoringError) await recordCheck(service, row.revision, error.state, error.message);
    throw error;
  }
}));
router.put(`${prefix}/properties/:service`, requirePermission("monitoring:manage"), asyncRoute(async (req, res) => {
  const service = serviceParam(req), parsed = SelectMonitoringPropertyBody.safeParse(req.body);
  if (!parsed.success) throw new MonitoringError("unavailable", "Selezione proprietà non valida.", 400);
  const row = await getSettings(), token = await accessToken(row.revision);
  const accessible = await listProperties(service, token.access);
  if (!accessible.some(p => p.id === parsed.data.property)) throw new MonitoringError("forbidden", "La proprietà non risulta accessibile all’account collegato.", 403);
  await lockedSettings(async (tx, current) => {
    if (current.revision !== row.revision) throw new MonitoringError("disconnected", "Configurazione cambiata. Ricaricare.", 409);
    const checks = { ...current.checks };
    delete checks[service];
    await tx.update(settings).set({ [service === "ga4" ? "ga4Property" : "searchConsoleProperty"]: parsed.data.property, checks, ...(service === "ga4" ? { collectionEnabled: false, collectionCheck: null } : {}), revision: randomUUID(), updatedAt: new Date() }).where(eq(settings.environment, current.environment));
  });
  reportCache.clear();
  res.json({ message: "Proprietà selezionata dai servizi accessibili. Eseguire la verifica o aprire la Dashboard." });
}));
router.post(`${prefix}/verify/:service`, requirePermission("monitoring:manage"), asyncRoute(async (req, res) => {
  const service = serviceParam(req), row = await getSettings(), property = propertyFor(row, service);
  if (!property) throw new MonitoringError("property_required", "Selezionare prima una proprietà.", 400);
  try {
    const token = await accessToken(row.revision);
    if (!(await listProperties(service, token.access)).some(p => p.id === property)) throw new MonitoringError("forbidden", "La proprietà non è più accessibile. Scegliere una proprietà autorizzata.", 403);
    if (service === "ga4") await gaPropertyTimezone(property, token.access);
    // Also test the reporting API, not just property enumeration.
    const period = getPeriod({ days: 7 });
    const result = await fetchReport(service, property, token.access, period);
    await recordCheck(service, row.revision, result.state, null);
    if ((await getSettings()).revision !== row.revision) throw new MonitoringError("disconnected", "Configurazione cambiata. Ripetere la verifica.", 409);
    reportCache.clear();
    res.json({ message: `Collegamento verificato in sola lettura. ${result.message} Nessun tag installato.` });
  } catch (error) {
    if (error instanceof MonitoringError && ["revoked", "forbidden"].includes(error.state)) reportCache.clear();
    if (error instanceof MonitoringError) await recordCheck(service, row.revision, error.state, error.message);
    throw error;
  }
}));
router.put(`${prefix}/tags`, requirePermission("monitoring:manage"), asyncRoute(async (req, res) => {
  const parsed = SaveMonitoringTagsBody.safeParse(req.body);
  if (!parsed.success) throw new MonitoringError("unavailable", "Identificativi non validi: usare G-… per GA4 o GTM-… per Tag Manager; lasciare vuoto per rimuovere.", 400);
  await savePatch({ ...parsed.data, collectionEnabled: false, collectionCheck: null });
  reportCache.clear();
  res.json({ message: "Identificativi salvati. Raccolta disattivata e verifiche flusso azzerate: riverificare prima di attivare. GTM non è installato." });
}));
async function googleSource(service: GoogleReportService, period: ReturnType<typeof getPeriod>): Promise<KpiSource> {
  const title = service === "ga4" ? "Google Analytics 4" : "Google Search Console";
  const timezone = service === "ga4" ? "Fuso della proprietà non disponibile" : "America/Los_Angeles";
  const row = await getSettings(), property = propertyFor(row, service);
  if (!oauthConfig()) return emptySource(title, "not_configured", "OAuth Google non configurato. Il proprietario deve predisporre le credenziali applicative server.", timezone);
  if (!row.encryptedTokens) return emptySource(title, "disconnected", "Nessun account Google collegato. Nessuna statistica è stata importata.", timezone);
  if (!property) return emptySource(title, "property_required", "Il proprietario deve scegliere una proprietà realmente accessibile.", timezone);
  try {
    const key = JSON.stringify([row.environment, row.revision, service, property, period.start, period.end]);
    const source = await reportCache.get(key, async () => {
      const token = await accessToken(row.revision);
      const result = await fetchReport(service, property, token.access, period);
      if ((await getSettings()).revision !== row.revision) throw new MonitoringError("disconnected", "La configurazione è cambiata durante il recupero.", 409);
      await recordCheck(service, row.revision, result.state, null);
      return result;
    });
    if ((await getSettings()).revision !== row.revision) return emptySource(title, "disconnected", "Configurazione cambiata: ricaricare la Dashboard.", timezone);
    if (source.state === "stale") await recordCheck(service, row.revision, "stale", source.message);
    return source;
  } catch (error) {
    const safe = error instanceof MonitoringError ? error : new MonitoringError("unavailable", "Impossibile aggiornare i report Google.");
    await recordCheck(service, row.revision, safe.state, safe.message);
    return emptySource(title, safe.state, safe.message, timezone);
  }
}
router.get("/internal/dashboard", requirePermission("kpi:read"), asyncRoute(async (req, res) => {
  const period = getPeriod(req.query);
  const [operational, ga4, searchConsole] = await Promise.all([
    operationalReport(period).catch(() => emptySource("Database richieste", "unavailable", "Impossibile leggere le richieste archiviate. Non viene mostrato uno zero sostitutivo.", "UTC")),
    googleSource("ga4", period), googleSource("searchConsole", period),
  ]);
  res.json(GetKpiDashboardResponse.parse({ period, dataMode: liveDataApproved() ? "live" : "synthetic", operational, ga4, searchConsole }));
}));
export default router;
