import type { GoogleReportService, KpiPeriod, KpiRow, KpiSource } from "@workspace/api-zod";
import { addDays, dayInTimezone, emptySource, metric, MonitoringError } from "./core";
import { authHeaders, gaPropertyTimezone, googleJson } from "./google";

function num(value: unknown): number {
  const n = Number(value);
  if (value === undefined || value === null || !Number.isFinite(n)) throw new MonitoringError("unavailable", "Risposta Google incompleta: uno o più valori non sono disponibili.");
  return n;
}
const gaKeys = ["users", "sessions", "views", "engagementRate"];
function gaValues(row: any) {
  const values = Object.fromEntries(gaKeys.map((key, i) => [key, num(row.metricValues?.[i]?.value)])) as Record<string, number | null>;
  if (values.sessions === 0) values.engagementRate = null;
  return values;
}
function gaRows(report: any): KpiRow[] {
  return (report.rows ?? []).map((r: any) => ({ label: String(r.dimensionValues?.[0]?.value ?? "(non disponibile)"), values: gaValues(r) }));
}
function metadataLimits(reports: any[]): string[] {
  const limits = ["GA4 Data API: nessuna conversione con richieste o Search Console. I dati recenti possono richiedere 24–48 ore.", "Pagine e canali: primi 10 risultati, ordinati per sessioni. I tassi sono quelli del provider, non medie delle righe."];
  if (reports.some(r => r.metadata?.subjectToThresholding)) limits.push("Google applica soglie privacy: alcuni dati possono essere omessi.");
  if (reports.some(r => r.metadata?.dataLossFromOtherRow)) limits.push("Report ad alta cardinalità: alcuni valori sono raggruppati da Google in «(other)».");
  if (reports.some(r => r.metadata?.samplingMetadatas?.length)) limits.push("Report campionato dal provider: i valori sono stime Google.");
  return limits;
}
export async function gaReport(property: string, access: string, period: KpiPeriod): Promise<KpiSource> {
  if (!/^properties\/[1-9]\d*$/.test(property)) throw new MonitoringError("property_required", "Selezionare una proprietà GA4 valida.", 400);
  const timezone = await gaPropertyTimezone(property, access);
  const metrics = ["activeUsers", "sessions", "screenPageViews", "engagementRate"].map(name => ({ name }));
  const base = (start: string, end: string) => ({ dateRanges: [{ startDate: start, endDate: end }], metrics, keepEmptyRows: false, returnPropertyQuota: true });
  const current = base(period.start, period.end), previous = base(period.previousStart, period.previousEnd);
  const body = await googleJson(`https://analyticsdata.googleapis.com/v1beta/${property}:batchRunReports`, {
    method: "POST", headers: authHeaders(access),
    body: JSON.stringify({ requests: [
      current, previous,
      { ...current, dimensions: [{ name: "date" }], limit: "366", orderBys: [{ dimension: { dimensionName: "date" } }] },
      { ...current, dimensions: [{ name: "sessionDefaultChannelGroup" }], limit: "10", orderBys: [{ metric: { metricName: "sessions" }, desc: true }] },
      { ...current, dimensions: [{ name: "pagePath" }], limit: "10", orderBys: [{ metric: { metricName: "sessions" }, desc: true }] },
    ] }),
  });
  const reports = body.reports;
  if (!Array.isArray(reports) || reports.length !== 5) throw new MonitoringError("unavailable", "Google ha restituito un report GA4 incompleto.");
  const now = new Date().toISOString();
  const totals = reports[0].rows?.[0] ? gaValues(reports[0].rows[0]) : null;
  const prior = reports[1].rows?.[0] ? gaValues(reports[1].rows[0]) : null;
  const series = gaRows(reports[2]).map(row => ({ ...row, label: row.label.replace(/^(\d{4})(\d{2})(\d{2})$/, "$1-$2-$3") }));
  const source = emptySource("Google Analytics 4 · " + property, totals ? "ready" : "empty", totals ? "Report GA4 ricevuto." : "Nessun risultato restituito da GA4 per questo intervallo; non equivale a uno zero misurato.", timezone);
  source.updatedAt = now; source.dataThrough = series.at(-1)?.label ?? null;
  source.metrics = [
    metric("users", "Utenti attivi", totals?.users ?? null, prior?.users ?? null),
    metric("sessions", "Sessioni", totals?.sessions ?? null, prior?.sessions ?? null),
    metric("views", "Visualizzazioni", totals?.views ?? null, prior?.views ?? null),
    metric("engagementRate", "Tasso di coinvolgimento", totals?.engagementRate ?? null, prior?.engagementRate ?? null, "percent"),
  ];
  source.series = series;
  source.tables = [{ title: "Canali di acquisizione · primi 10", rows: gaRows(reports[3]) }, { title: "Pagine · prime 10", rows: gaRows(reports[4]) }];
  source.limitations = metadataLimits(reports);
  if (!prior) source.limitations.push("Confronto precedente non disponibile: il provider non ha restituito risultati per quel periodo.");
  // Recent periods are explicitly provisional even when returned values are zero.
  const providerToday = dayInTimezone(timezone);
  if (period.end >= addDays(providerToday, -2)) {
    source.state = "delayed";
    source.message = "Intervallo recente: GA4 può ancora elaborare o correggere i dati, anche in assenza di righe.";
  }
  return source;
}
function scValues(row: any) {
  const clicks = num(row.clicks), impressions = num(row.impressions);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : null, position: impressions ? num(row.position) : null };
}
export async function searchReport(property: string, access: string, period: KpiPeriod): Promise<KpiSource> {
  if (!/^(sc-domain:[a-z0-9.-]+|https?:\/\/[^\s]+)$/i.test(property)) throw new MonitoringError("property_required", "Selezionare una proprietà Search Console valida.", 400);
  const query = (startDate: string, endDate: string, dimensions: string[] = [], rowLimit = 10) => googleJson(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
    method: "POST", headers: authHeaders(access), body: JSON.stringify({ startDate, endDate, dimensions, rowLimit, type: "web", dataState: "all" }),
  });
  // Small bounded query set: totals are queried independently from top-N dimensions.
  const [current, previous, dates, pages, queries] = await Promise.all([
    query(period.start, period.end), query(period.previousStart, period.previousEnd),
    query(period.start, period.end, ["date"], 366),
    query(period.start, period.end, ["page"]), query(period.start, period.end, ["query"]),
  ]);
  const totals = current.rows?.[0] ? scValues(current.rows[0]) : null;
  const prior = previous.rows?.[0] ? scValues(previous.rows[0]) : null;
  const rows = (body: any): KpiRow[] => (body.rows ?? []).map((r: any) => ({ label: String(r.keys?.[0] ?? "(non disponibile)"), values: scValues(r) }));
  const series = rows(dates).sort((a, b) => a.label.localeCompare(b.label));
  const source = emptySource("Google Search Console · " + property, totals ? "ready" : "empty", totals ? "Report Search Analytics ricevuto." : "Nessun risultato restituito da Search Console: non è uno zero misurato.", "America/Los_Angeles");
  source.updatedAt = new Date().toISOString(); source.dataThrough = series.at(-1)?.label ?? null;
  source.metrics = [
    metric("clicks", "Clic", totals?.clicks ?? null, prior?.clicks ?? null),
    metric("impressions", "Impressioni", totals?.impressions ?? null, prior?.impressions ?? null),
    metric("ctr", "CTR", totals?.ctr ?? null, prior?.ctr ?? null, "percent"),
    metric("position", "Posizione media", totals?.position ?? null, prior?.position ?? null, "position"),
  ];
  source.series = series;
  source.tables = [{ title: "Pagine · prime 10", rows: rows(pages) }, { title: "Query · prime 10", rows: rows(queries) }];
  source.limitations = [
    "Ricerca web; fuso Pacifico. Google può ritardare i dati di 2–3 giorni. Date mancanti non sono riempite con zeri.",
    "Top 10 pagine/query per clic; query anonimizzate e limiti Google possono impedire la riconciliazione con i totali.",
    "CTR calcolato su clic/impressioni; posizione aggregata fornita da Google, ponderata per impressioni. Nessuna media ingenua dei top risultati.",
    "Nessuna conversione con GA4 o richieste interne. Lo storico è solo quello reso disponibile da Google per la proprietà autorizzata.",
  ];
  if (!prior) source.limitations.push("Confronto precedente non disponibile: nessun risultato nel periodo precedente.");
  const todayPacific = dayInTimezone("America/Los_Angeles");
  if (current.metadata?.firstIncompleteDate || dates.metadata?.firstIncompleteDate || period.end >= addDays(todayPacific, -3)) {
    source.state = "delayed"; source.message = "Intervallo con dati recenti o provvisori: Search Console non ha ancora consolidato tutti i risultati.";
  }
  return source;
}

type Entry = { value?: KpiSource; successAt: number; retryAt: number; error?: MonitoringError };
// Finite per-process cache. No persistence of private query terms; restart causes a new read.
export class ReportCache {
  private entries = new Map<string, Entry>();
  private pending = new Map<string, Promise<KpiSource>>();
  constructor(private clock = () => Date.now()) {}
  clear() { this.entries.clear(); }
  async get(key: string, run: () => Promise<KpiSource>): Promise<KpiSource> {
    const entry = this.entries.get(key), now = this.clock();
    if (entry && now < entry.retryAt) return this.present(entry);
    const existing = this.pending.get(key);
    if (existing) return existing;
    const pending = (async () => {
      try {
        const value = await run();
        const e = { value, successAt: this.clock(), retryAt: this.clock() + 15 * 60000 };
        this.put(key, e); return value;
      } catch (error) {
        const safe = error instanceof MonitoringError ? error : new MonitoringError("unavailable", "Impossibile aggiornare i dati del fornitore.");
        const canKeep = safe.state === "quota" || safe.state === "unavailable";
        const e = { value: canKeep && entry && now - entry.successAt < 86400000 ? entry.value : undefined, successAt: entry?.successAt ?? 0, retryAt: this.clock() + (safe.state === "quota" ? 300000 : 60000), error: safe };
        this.put(key, e); return this.present(e);
      } finally { this.pending.delete(key); }
    })();
    this.pending.set(key, pending);
    return pending;
  }
  private put(key: string, entry: Entry) {
    if (this.entries.size >= 100) this.entries.delete(this.entries.keys().next().value!);
    this.entries.set(key, entry);
  }
  private present(entry: Entry): KpiSource {
    if (!entry.error) return entry.value!;
    if (!entry.value) throw entry.error;
    return { ...entry.value, state: "stale", message: `Dati obsoleti: ${entry.error.message}`, limitations: [...entry.value.limitations, "Aggiornamento fallito; valori dell’ultimo recupero riuscito, non dati correnti."] };
  }
}
export const reportCache = new ReportCache();
export const fetchReport = (service: GoogleReportService, property: string, access: string, period: KpiPeriod) => service === "ga4" ? gaReport(property, access, period) : searchReport(property, access, period);
