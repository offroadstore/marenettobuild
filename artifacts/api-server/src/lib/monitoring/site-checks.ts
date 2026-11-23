import { createHash } from "node:crypto";
import type { MonitoringSettingsRecord } from "@workspace/db";
import type { MonitoringDiscovery, MonitoringStreamCheck } from "@workspace/api-zod";
import directPolicy from "../../../../../lib/legal-policy/direct-analytics.json";
import { discovery, MonitoringError } from "./core";
import { authHeaders, googleJson } from "./google";

type Checks = { directStream?: MonitoringStreamCheck; siteDiscovery?: MonitoringDiscovery };
const maxAge = 86400000;
export function streamStatus(row: MonitoringSettingsRecord, now = Date.now()): MonitoringStreamCheck {
  const saved = (row.checks as unknown as Checks).directStream;
  const base: MonitoringStreamCheck = {
    state: "unchecked", measurementId: row.measurementId, publicMeasurementId: directPolicy.measurementId,
    property: row.ga4Property, stream: null, checkedAt: null,
    message: "ID e proprietà non ancora verificati con Google. Il percorso diretto resta indipendente.",
  };
  if (!saved || saved.property !== row.ga4Property || saved.measurementId !== row.measurementId) return base;
  if (!saved.checkedAt || !Number.isFinite(Date.parse(saved.checkedAt)) ||
    now - Date.parse(saved.checkedAt) > maxAge || now < Date.parse(saved.checkedAt)) {
    return { ...saved, state: "stale", message: "Verifica stream obsoleta: rieseguirla. Nessuna modifica alla raccolta diretta." };
  }
  return saved;
}
export async function checkStream(row: MonitoringSettingsRecord, token: string): Promise<MonitoringStreamCheck> {
  if (!row.ga4Property || !/^properties\/[1-9]\d*$/.test(row.ga4Property)) {
    throw new MonitoringError("property_required", "Selezionare prima la proprietà GA4.", 400);
  }
  let pageToken = "", found: string | null = null;
  for (let page = 0; page < 20; page++) {
    const query = new URLSearchParams({ pageSize: "200", ...(pageToken ? { pageToken } : {}) });
    const data = await googleJson(`https://analyticsadmin.googleapis.com/v1beta/${row.ga4Property}/dataStreams?${query}`, { headers: authHeaders(token) });
    if (data.dataStreams !== undefined && !Array.isArray(data.dataStreams)) throw new MonitoringError("unavailable", "Elenco stream incompleto.");
    for (const stream of data.dataStreams ?? []) {
      if (stream.type === "WEB_DATA_STREAM" && stream.webStreamData?.measurementId === row.measurementId &&
        typeof stream.name === "string" && stream.name.startsWith(`${row.ga4Property}/dataStreams/`) &&
        /^[1-9]\d*$/.test(stream.name.slice(`${row.ga4Property}/dataStreams/`.length))) found = stream.name;
    }
    pageToken = data.nextPageToken ?? "";
    if (!pageToken) break;
    if (typeof pageToken !== "string" || page === 19) throw new MonitoringError("unavailable", "Elenco stream non completato: riprovare.");
  }
  const match = Boolean(found) && row.measurementId === directPolicy.measurementId;
  return {
    ...streamStatus({ ...row, checks: {} }), checkedAt: new Date().toISOString(), stream: found,
    state: match ? "ready" : "mismatch",
    message: match ? "L’ID salvato e quello pubblico corrispondono a uno stream web della proprietà. Non certifica la ricezione di eventi."
      : found ? "L’ID salvato appartiene alla proprietà, ma è diverso dall’ID pubblico diretto. Nessuna modifica al tracciamento."
        : "L’ID salvato non corrisponde a uno stream web della proprietà collegata. Il percorso diretto non è stato modificato.",
  };
}
export function discoveryStatus(row: MonitoringSettingsRecord, now = Date.now()): MonitoringDiscovery {
  const saved = (row.checks as unknown as Checks).siteDiscovery;
  if (!saved) return { ...discovery, stale: true, error: null };
  const age = now - Date.parse(saved.checkedAt);
  return { ...saved, stale: Boolean(saved.stale) || !Number.isFinite(age) || age < 0 || age > maxAge };
}
export async function scanPublishedSite(): Promise<MonitoringDiscovery> {
  // Fixed public URL only: no arbitrary URL, redirect, credential or script fetch.
  const url = `${directPolicy.origin}/`;
  const response = await fetch(url, {
    redirect: "error", credentials: "omit", cache: "no-store", signal: AbortSignal.timeout(8000),
    headers: { accept: "text/html" },
  });
  if (!response.ok || !response.headers.get("content-type")?.includes("text/html")) throw new Error("Static check unavailable");
  const reader = response.body?.getReader();
  if (!reader) throw new Error("Static check unavailable");
  const decoder = new TextDecoder();
  let html = "", bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 2_000_000) throw new Error("Static check too large");
      html += decoder.decode(chunk.value, { stream: true });
    }
    html += decoder.decode();
  } finally { await reader.cancel().catch(() => {}); }
  const findings = [
    /Framework360|\/m\/webtracking/i.test(html) ? "Riferimenti Framework360 presenti nell’HTML esaminato." : "Nessun riferimento Framework360 nell’HTML esaminato.",
    html.includes(directPolicy.measurementId) ? `ID pubblico ${directPolicy.measurementId} presente nell’HTML.` : "ID GA4 non rilevato nell’HTML iniziale: non prova l’assenza del caricamento dopo consenso.",
    /facebook-domain-verification/i.test(html) ? "Tag di verifica dominio Meta presente." : "Tag di verifica dominio Meta non rilevato.",
  ];
  return {
    url, checkedAt: new Date().toISOString(), stale: false, error: null, findings,
    limitations: `Solo HTML iniziale pubblico, SHA-256 ${createHash("sha256").update(html).digest("hex")}. Nessuno script eseguito o scaricato; non verifica cookie, eventi, ricezione o strumenti caricati dopo consenso. Validità indicativa 24 ore.`,
  };
}
