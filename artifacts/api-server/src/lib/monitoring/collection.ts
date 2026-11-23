import type { MonitoringSettingsRecord } from "@workspace/db";
import { environment, hash, oauthConfig, MonitoringError } from "./core";
import { authHeaders, googleJson } from "./google";
import { getDomain } from "tldts";
import legalPolicy from "../../../../../lib/legal-policy/analytics.json";

// Deliberately independent of the preview host and the historical website discovery.
export function collectionEnvironment() {
  const raw = process.env.MARENETTO_ANALYTICS_ORIGIN ?? "";
  let origin = "";
  try {
    const u = new URL(raw);
    if (u.protocol === "https:" && raw === u.origin && !u.port &&
      !/(?:replit\.(?:dev|app)|repl\.co|localhost|\.invalid)$/.test(u.hostname) &&
      /^[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(u.hostname) && !/^[\d.]+$/.test(u.hostname)) origin = u.origin;
  } catch { /* missing or malformed is blocked */ }
  const privacyVersion = legalPolicy.privacyVersion;
  let privacyUrl = "";
  try {
    const u = new URL(legalPolicy.privacyUrl);
    if (origin && u.origin === origin && !u.search && !u.hash && !u.username && !u.password) privacyUrl = u.href;
  } catch { /* no unapproved notice */ }
  let runtimeOrigin = "";
  try {
    const rawRuntime = process.env.MARENETTO_ANALYTICS_RUNTIME_ORIGIN ?? "";
    const u = new URL(rawRuntime);
    const siteDomain = getDomain(new URL(origin).hostname, { allowPrivateDomains: true });
    const runtimeDomain = getDomain(u.hostname, { allowPrivateDomains: true });
    if (u.protocol === "https:" && rawRuntime === u.origin && !u.port &&
      !/(?:replit\.(?:dev|app)|repl\.co|localhost|\.invalid)$/.test(u.hostname) &&
      siteDomain && runtimeDomain && siteDomain !== runtimeDomain) runtimeOrigin = u.origin;
  } catch { /* dedicated, separately approved origin is mandatory */ }
  return { origin, runtimeOrigin, privacyUrl, privacyVersion };
}
export function collectionFingerprint(row: MonitoringSettingsRecord) {
  return hash(JSON.stringify([row.ga4Property, row.measurementId, collectionEnvironment()]));
}
export function collectionStatus(row: MonitoringSettingsRecord) {
  const config = collectionEnvironment(), blockers: string[] = [];
  if (environment() !== "production") blockers.push("Raccolta vietata in sviluppo e preview.");
  if (!config.origin) blockers.push("Dominio pubblico HTTPS non confermato nei parametri server.");
  if (!config.runtimeOrigin || process.env.MARENETTO_ANALYTICS_RUNTIME_APPROVED !== "true") blockers.push("Origine dedicata del runtime non confermata: richiede un dominio registrabile distinto, senza login o cookie condivisi.");
  if (process.env.MARENETTO_ANALYTICS_RELEASE_APPROVED !== "true") blockers.push("Autorizzazione distinta al rilascio della raccolta mancante.");
  if (!config.privacyUrl || !config.privacyVersion || process.env.MARENETTO_ANALYTICS_PRIVACY_APPROVED !== "true") blockers.push("Informativa analytics e sua versione non approvate.");
  if (!oauthConfig() || !row.encryptedTokens || !row.ga4Property) blockers.push("Collegare Google e selezionare la proprietà GA4.");
  if (!/^G-[A-Z0-9]{4,20}$/.test(row.measurementId)) blockers.push("ID GA4 mancante o non valido.");
  const check = row.collectionCheck;
  const checkAge = check ? Date.now() - Date.parse(check.checkedAt) : NaN;
  if (!check || check.fingerprint !== collectionFingerprint(row) || !Number.isFinite(checkAge) || checkAge < 0 || checkAge > 86400000) blockers.push("Verificare il flusso web e la disattivazione di enhanced measurement (validità 24 ore).");
  return {
    enabled: row.collectionEnabled && blockers.length === 0, blockers,
    collection: {
      ...config, requested: row.collectionEnabled, stream: check?.stream ?? null,
      checkedAt: check?.checkedAt ?? null, realtimeCheckedAt: check?.realtimeCheckedAt ?? null,
      realtimeReceivedAt: check?.realtimeReceivedAt ?? null,
      status: blockers.length ? "Bloccata dai prerequisiti" : !row.collectionEnabled ? "Pronta, non attivata" : "Abilitata solo per visitatori consenzienti; collaudo finale distinto",
    },
  };
}
export async function verifyWebStream(row: MonitoringSettingsRecord, access: string) {
  const { origin } = collectionEnvironment();
  if (!origin || !row.ga4Property || !/^properties\/[1-9]\d*$/.test(row.ga4Property)) throw new MonitoringError("not_configured", "Confermare dominio e proprietà GA4 prima della verifica.", 400);
  let pageToken = "";
  for (let page = 0; page < 20; page++) {
    const params = new URLSearchParams({ pageSize: "200", ...(pageToken ? { pageToken } : {}) });
    const body = await googleJson(`https://analyticsadmin.googleapis.com/v1beta/${row.ga4Property}/dataStreams?${params}`, { headers: authHeaders(access) });
    for (const stream of body.dataStreams ?? []) {
      if (stream.type !== "WEB_DATA_STREAM" || stream.webStreamData?.measurementId !== row.measurementId) continue;
      let actualOrigin = "";
      try { actualOrigin = new URL(stream.webStreamData.defaultUri).origin; } catch { /* invalid provider response */ }
      if (actualOrigin !== origin || !new RegExp(`^${row.ga4Property}/dataStreams/[1-9]\\d*$`).test(stream.name)) throw new MonitoringError("not_configured", "Il flusso GA4 non corrisponde al dominio pubblico approvato.", 400);
      const enhanced = await googleJson(`https://analyticsadmin.googleapis.com/v1alpha/${stream.name}/enhancedMeasurementSettings`, { headers: authHeaders(access) });
      // Missing flag is not proof that automatic history, click or form events are disabled.
      if (enhanced.streamEnabled !== false) throw new MonitoringError("not_configured", "Disattivare enhanced measurement nel flusso Google: la sola installazione prevista invia eventi espliciti.", 400);
      await verifyRuntimeEndpoint();
      return { fingerprint: collectionFingerprint(row), stream: stream.name as string, checkedAt: new Date().toISOString() };
    }
    pageToken = body.nextPageToken ?? "";
    if (!pageToken) break;
  }
  throw new MonitoringError("property_required", "Nessun flusso web accessibile corrisponde all’ID GA4 salvato.", 400);
}
async function verifyRuntimeEndpoint() {
  const { origin, runtimeOrigin } = collectionEnvironment();
  if (!runtimeOrigin || process.env.MARENETTO_ANALYTICS_RUNTIME_APPROVED !== "true") throw new MonitoringError("not_configured", "Confermare il runtime dedicato prima della verifica.", 400);
  try {
    const response = await fetch(`${runtimeOrigin}/_analytics-runtime/health`, { redirect: "error", credentials: "omit", signal: AbortSignal.timeout(5000), cache: "no-store" });
    const body = await response.json();
    if (!response.ok || !body || typeof body !== "object" ||
      !("runtime" in body) || body.runtime !== "marenetto-ga4-v1" ||
      !("siteOrigin" in body) || body.siteOrigin !== origin ||
      !("runtimeOrigin" in body) || body.runtimeOrigin !== runtimeOrigin) throw new Error("runtime mismatch");
  } catch {
    throw new MonitoringError("unavailable", "Il runtime dedicato non è raggiungibile o non corrisponde alle origini approvate.", 503);
  }
}
export async function realtimeReceipt(row: MonitoringSettingsRecord, access: string) {
  if (!row.ga4Property) throw new MonitoringError("property_required", "Selezionare GA4.", 400);
  const body = await googleJson(`https://analyticsdata.googleapis.com/v1beta/${row.ga4Property}:runRealtimeReport`, {
    method: "POST", headers: authHeaders(access),
    body: JSON.stringify({ dimensions: [{ name: "eventName" }], metrics: [{ name: "eventCount" }],
      dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: ["page_view", "contact_click", "generate_lead"] } } }, limit: "10" }),
  });
  if (!Array.isArray(body.rows) && body.rowCount !== 0) throw new MonitoringError("unavailable", "Risposta Realtime incompleta.");
  return (body.rows ?? []).some((r: any) => Number(r.metricValues?.[0]?.value) > 0);
}
