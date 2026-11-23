import { eq } from "drizzle-orm";
import { aiVisibilitySettingsTable as settings } from "@workspace/db";
import type { KpiPeriod, KpiRow, KpiSource, MonitoringProperty } from "@workspace/api-zod";
import { emptySource, metric, MonitoringError } from "./core";
import { getAiSettings, withAiLock } from "./ai-store";
import { randomUUID } from "node:crypto";
import { reportCache } from "./reports";

export const bingConfigured = () => Object.prototype.hasOwnProperty.call(process.env, "BING_WEBMASTER_API_KEY");
let windowStart = 0, windowCalls = 0, pendingCalls = 0;
export const bingInstructions = "In Bing Webmaster Tools aggiungere e verificare il sito, aprire Impostazioni → Accesso API, leggere i termini e generare una chiave. Aggiungere BING_WEBMASTER_API_KEY nei Secrets, quindi caricare e selezionare qui un sito verificato. Non incollare la chiave in questo pannello.";
// Bing requires the key in its query string. Nothing from this scope (URL,
// exceptions, headers or raw body) is ever passed to a logger or returned.
export async function bingJson(operation: "GetUserSites" | "GetRankAndTrafficStats", property?: string): Promise<any[]> {
  const key = process.env.BING_WEBMASTER_API_KEY;
  if (!key) throw new MonitoringError("not_configured", bingInstructions);
  if (Date.now() - windowStart >= 60000) { windowStart = Date.now(); windowCalls = 0; }
  if (windowCalls >= 20 || pendingCalls >= 4) throw new MonitoringError("quota", "Limite locale richieste Bing raggiunto; riprovare più tardi.", 429);
  windowCalls++; pendingCalls++;
  try {
    const url = new URL(`https://ssl.bing.com/webmaster/api.svc/json/${operation}`);
    url.searchParams.set("apikey", key);
    if (property) url.searchParams.set("siteUrl", property);
    const response = await fetch(url, { redirect: "error", signal: AbortSignal.timeout(12000), headers: { accept: "application/json" } });
    if (response.status === 429) throw new MonitoringError("quota", "Quota Bing raggiunta. Nessun nuovo tentativo immediato.", 429);
    if (response.status === 401 || response.status === 403) throw new MonitoringError("forbidden", "Accesso Bing negato: verificare chiave e sito verificato.", 403);
    if (!response.ok) throw new Error();
    const reader = response.body?.getReader();
    if (!reader) throw new Error();
    let text = "", bytes = 0;
    const decoder = new TextDecoder();
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > 1_000_000) { await reader.cancel(); throw new Error(); }
      text += decoder.decode(chunk.value, { stream: true });
    }
    const body = JSON.parse(text + decoder.decode());
    if (!Array.isArray(body.d) || body.d.length > 10000) throw new Error();
    return body.d;
  } catch (error) {
    if (error instanceof MonitoringError) throw error;
    throw new MonitoringError("unavailable", "Bing non disponibile o risposta non valida. Nessun dato sostitutivo.");
  } finally { pendingCalls--; }
}
export async function bingSites(): Promise<MonitoringProperty[]> {
  const sites = await bingJson("GetUserSites");
  return sites.filter(s => s.IsVerified === true && safeSite(s.Url)).map(s => ({ id: s.Url, label: new URL(s.Url).hostname, timezone: "Offset dichiarato nelle date Bing" })).slice(0, 100);
}
function safeSite(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password && !u.search && !u.hash && !u.port && u.pathname === "/"; } catch { return false; }
}
export async function saveBingSite(property: string) {
  if (!(await bingSites()).some(s => s.id === property)) throw new MonitoringError("forbidden", "Selezionare un sito verificato accessibile alla chiave Bing.", 403);
  await withAiLock(async (tx, row) => {
    await tx.update(settings).set({ bingProperty: property, bingRevision: randomUUID() }).where(eq(settings.environment, row.environment));
  });
  reportCache.clear();
}
export function bingDate(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(/^\/Date\((-?\d+)([+-]\d{4})?\)\/$/);
  if (!match) return null;
  const offset = match[2] ? (match[2][0] === "-" ? -1 : 1) * (Number(match[2].slice(1, 3)) * 60 + Number(match[2].slice(3))) : 0;
  const date = new Date(Number(match[1]) + offset * 60000);
  return Number.isFinite(date.getTime()) ? date.toISOString().slice(0, 10) : null;
}
export function normalizeBing(rows: any[], period: KpiPeriod, compare: boolean): KpiSource {
  const values: KpiRow[] = rows.map(r => {
    const label = bingDate(r.Date);
    if (!label || typeof r.Clicks !== "number" || typeof r.Impressions !== "number" || !Number.isFinite(r.Clicks) || !Number.isFinite(r.Impressions) || r.Clicks < 0 || r.Impressions < 0) throw new MonitoringError("unavailable", "Date o metriche Bing non valide.");
    return { label, values: { clicks: r.Clicks, impressions: r.Impressions } };
  }).sort((a, b) => a.label.localeCompare(b.label));
  if (new Set(values.map(r => r.label)).size !== values.length) throw new MonitoringError("unavailable", "Granularità Bing ambigua: date duplicate.");
  const current = values.filter(r => r.label >= period.start && r.label <= period.end);
  const prev = values.filter(r => r.label >= period.previousStart && r.label <= period.previousEnd);
  const complete = (rs: KpiRow[], start: string, end: string) => rs.length === period.days && rs[0]?.label === start && rs.at(-1)?.label === end;
  const currentComplete = complete(current, period.start, period.end), previousComplete = compare && complete(prev, period.previousStart, period.previousEnd);
  const source = emptySource("Bing Webmaster · statistiche aggregate", current.length ? "delayed" : "empty", "Solo giorni restituiti dall'API; copertura non garantita, nessun giorno mancante trasformato in zero.", "Offset per data fornito da Bing; nessun fuso IANA garantito");
  source.series = current;
  for (const key of ["clicks", "impressions"]) source.metrics.push(metric(key, key === "clicks" ? "Clic" : "Impressioni", currentComplete ? current.reduce((s, r) => s + r.values[key]!, 0) : null, previousComplete && currentComplete ? prev.reduce((s, r) => s + r.values[key]!, 0) : null));
  source.updatedAt = new Date().toISOString(); source.dataThrough = values.at(-1)?.label ?? null;
  source.limitations = ["GetRankAndTrafficStats: aggregati giornalieri di tutte le verticali Bing, non solo ricerca web. Aggiornamento quotidiano; nessun confronto diretto con Search Console.",
    "Endpoint senza filtri dispositivo, paese, città, pagina, query o canale. Storico e quote numeriche non garantiti dalla documentazione del metodo: solo date effettivamente restituite; non si presume disponibilità a 90 giorni.",
    "Totali/confronti disponibili soltanto se sono restituiti tutti i giorni di entrambi gli intervalli. Serie completa restituita (massimo 10000 righe), nessuna interpolazione."];
  return source;
}
export async function bingReport(period: KpiPeriod, compare: boolean, filtersKey: string, scope: string): Promise<KpiSource> {
  const row = await getAiSettings();
  if (!bingConfigured()) return emptySource("Bing Webmaster", "not_configured", bingInstructions, "Non disponibile");
  if (!row.bingProperty) return emptySource("Bing Webmaster", "property_required", "Selezionare un sito verificato in Monitoraggio.", "Non disponibile");
  return reportCache.get(JSON.stringify([row.environment, scope, row.bingRevision, row.bingProperty, "bing", period, compare, filtersKey]), async () => {
    if (!(await bingSites()).some(p => p.id === row.bingProperty)) throw new MonitoringError("forbidden", "Il sito Bing non è più verificato o accessibile.", 403);
    const result = normalizeBing(await bingJson("GetRankAndTrafficStats", row.bingProperty!), period, compare);
    if ((await getAiSettings()).bingRevision !== row.bingRevision) throw new MonitoringError("unavailable", "Configurazione Bing cambiata.");
    return result;
  });
}
