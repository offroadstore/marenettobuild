import type { GoogleReportService, KpiPeriod, KpiRow, KpiSource } from "@workspace/api-zod";
import { addDays, dayInTimezone, emptySource, metric, MonitoringError } from "./core";
import { authHeaders, gaPropertyTimezone, googleJson } from "./google";
import { countries, languagePaths, reportLabel, type Filters } from "./filters";

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
export function gaDimensionFilter(filters: Filters) {
  const names: Record<string, string> = { device: "deviceCategory", country: "countryId", city: "city", page: "pagePath", channel: "sessionDefaultChannelGroup", trafficSource: "sessionSource" };
  const expressions: any[] = Object.entries(names).filter(([key]) => filters[key]).map(([key, fieldName]) => ({
    filter: { fieldName, stringFilter: { matchType: "EXACT", value: key === "country" ? countries[filters[key]!] : filters[key], caseSensitive: false } },
  }));
  if (filters.pageLanguage) expressions.push({ filter: { fieldName: "pagePath", inListFilter: { values: languagePaths(filters.pageLanguage), caseSensitive: true } } });
  return expressions.length ? { andGroup: { expressions } } : undefined;
}
export async function checkGaCompatibility(property: string, access: string, dimensions: string[], metrics: string[], dimensionFilter?: unknown) {
  const result = await googleJson(`https://analyticsdata.googleapis.com/v1beta/${property}:checkCompatibility`, {
    method: "POST", headers: authHeaders(access), body: JSON.stringify({ dimensions: dimensions.map(name => ({ name })), metrics: metrics.map(name => ({ name })), dimensionFilter }),
  });
  if (!dimensions.every(name => result.dimensionCompatibilities?.some((c: any) => c.dimensionMetadata?.apiName === name && c.compatibility === "COMPATIBLE")) ||
      !metrics.every(name => result.metricCompatibilities?.some((c: any) => c.metricMetadata?.apiName === name && c.compatibility === "COMPATIBLE"))) {
    throw new MonitoringError("unavailable", "Combinazione filtri, dimensioni e metriche non confermata dalla GA4 Data API.", 400);
  }
}
export async function gaReport(property: string, access: string, period: KpiPeriod, filters: Filters = {}): Promise<KpiSource> {
  if (!/^properties\/[1-9]\d*$/.test(property)) throw new MonitoringError("property_required", "Selezionare una proprietà GA4 valida.", 400);
  const timezone = await gaPropertyTimezone(property, access);
  const metrics = ["activeUsers", "sessions", "screenPageViews", "engagementRate"].map(name => ({ name }));
  const compare = filters.compare !== "false", dimensionFilter = gaDimensionFilter(filters);
  const filterDimensions = Object.entries({ device: "deviceCategory", country: "countryId", city: "city", page: "pagePath", channel: "sessionDefaultChannelGroup", trafficSource: "sessionSource", pageLanguage: "pagePath" }).filter(([key]) => filters[key]).map(([, name]) => name);
  await checkGaCompatibility(property, access, [...new Set(["date", "sessionDefaultChannelGroup", "pagePath", "sessionSource", ...filterDimensions])], metrics.map(m => m.name), dimensionFilter);
  const base = (start: string, end: string) => ({ dateRanges: [{ startDate: start, endDate: end }], metrics, dimensionFilter, keepEmptyRows: false, returnPropertyQuota: true });
  const current = base(period.start, period.end), previous = base(period.previousStart, period.previousEnd);
  const body = await googleJson(`https://analyticsdata.googleapis.com/v1beta/${property}:batchRunReports`, {
    method: "POST", headers: authHeaders(access),
    body: JSON.stringify({ requests: [
      current, ...(compare ? [previous] : []),
      { ...current, dimensions: [{ name: "date" }], limit: "366", orderBys: [{ dimension: { dimensionName: "date" } }] },
      { ...current, dimensions: [{ name: "sessionDefaultChannelGroup" }], limit: "10", orderBys: [{ metric: { metricName: "sessions" }, desc: true }] },
      { ...current, dimensions: [{ name: "pagePath" }], limit: "10", orderBys: [{ metric: { metricName: "sessions" }, desc: true }] },
    ] }),
  });
  const reports = body.reports;
  if (!Array.isArray(reports) || reports.length !== (compare ? 5 : 4)) throw new MonitoringError("unavailable", "Google ha restituito un report GA4 incompleto.");
  if (!compare) reports.splice(1, 0, {});
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
  source.tables = [{ title: "Canali di acquisizione · primi 10", rows: gaRows(reports[3]).map(r => ({ ...r, label: reportLabel(r.label, "channel") })) }, { title: "Pagine · prime 10", rows: gaRows(reports[4]).map(r => ({ ...r, label: reportLabel(r.label, "page") })) }];
  source.limitations = metadataLimits(reports);
  try {
    const sources = await googleJson(`https://analyticsdata.googleapis.com/v1beta/${property}:runReport`, {
      method: "POST", headers: authHeaders(access), body: JSON.stringify({ ...current, dimensions: [{ name: "sessionSource" }], limit: "10", orderBys: [{ metric: { metricName: "sessions" }, desc: true }] }),
    });
    source.tables.push({ title: "Sorgenti di traffico · prime 10", rows: gaRows(sources).map(r => ({ ...r, label: reportLabel(r.label, "source") })) });
    source.limitations.push(...metadataLimits([sources]).filter(l => !source.limitations.includes(l)));
  } catch { source.limitations.push("Sorgenti di traffico non disponibili. Nessuno zero sostitutivo."); }
  await addGaEvents(source, property, access, period, filters, filterDimensions);
  if (filters.pageLanguage) source.limitations.push("Lingua pagina: mappatura verificata delle sole sei pagine canoniche per lingua. Articoli, archivio e percorsi sconosciuti esclusi; non è la lingua del visitatore o del modulo.");
  if (!prior) source.limitations.push("Confronto precedente non disponibile: il provider non ha restituito risultati per quel periodo.");
  // Recent periods are explicitly provisional even when returned values are zero.
  const providerToday = dayInTimezone(timezone);
  if (period.end >= addDays(providerToday, -2)) {
    source.state = "delayed";
    source.message = "Intervallo recente: GA4 può ancora elaborare o correggere i dati, anche in assenza di righe.";
  }
  return source;
}
async function addGaEvents(source: KpiSource, property: string, access: string, period: KpiPeriod, filters: Filters, filterDimensions: string[]) {
  const dimensionFilter = gaDimensionFilter(filters), compare = filters.compare !== "false";
  try {
    const metadata = await googleJson(`https://analyticsdata.googleapis.com/v1beta/${property}/metadata`, { headers: authHeaders(access) });
    const channelDimension = metadata.dimensions?.some((d: any) => d.apiName === "customEvent:contact_channel") ? "customEvent:contact_channel" : null;
    const dimensions = ["eventName", ...(channelDimension ? [channelDimension] : [])];
    await checkGaCompatibility(property, access, [...new Set([...dimensions, ...filterDimensions])], ["eventCount"], dimensionFilter);
    const eventFilter = { andGroup: { expressions: [
      ...(dimensionFilter ? [dimensionFilter] : []),
      { filter: { fieldName: "eventName", inListFilter: { values: ["contact_click", "generate_lead"] } } },
    ] } };
    const request = (start: string, end: string) => ({ dateRanges: [{ startDate: start, endDate: end }], dimensions: dimensions.map(name => ({ name })), metrics: [{ name: "eventCount" }], dimensionFilter: eventFilter, limit: "100", returnPropertyQuota: true });
    const result = await googleJson(`https://analyticsdata.googleapis.com/v1beta/${property}:batchRunReports`, { method: "POST", headers: authHeaders(access), body: JSON.stringify({ requests: [request(period.start, period.end), ...(compare ? [request(period.previousStart, period.previousEnd)] : [])] }) });
    if (!Array.isArray(result.reports) || result.reports.length !== (compare ? 2 : 1)) throw new Error();
    const count = (index: number, event: string, channel?: string): number | null => {
      const report = result.reports[index];
      if (!report || report.rowCount > 100 || report.metadata?.subjectToThresholding || report.metadata?.dataLossFromOtherRow || report.metadata?.samplingMetadatas?.length) return null;
      const rows = (report.rows ?? []).filter((r: any) => r.dimensionValues?.[0]?.value === event && (!channel || r.dimensionValues?.[1]?.value === channel));
      return rows.length ? rows.reduce((s: number, r: any) => s + num(r.metricValues?.[0]?.value), 0) : null;
    };
    source.metrics.push(metric("contact_click", "Clic contatto osservati", count(0, "contact_click"), count(1, "contact_click")),
      metric("generate_lead", "Eventi generate_lead osservati (non clienti)", count(0, "generate_lead"), count(1, "generate_lead")));
    for (const [channel, label] of [["phone", "telefono"], ["email", "email"], ["whatsapp", "WhatsApp"]]) source.metrics.push(metric(`contact_${channel}`, `Clic ${label}`, channelDimension ? count(0, "contact_click", channel) : null, channelDimension ? count(1, "contact_click", channel) : null));
    source.limitations.push("Clic contatto ed eventi generate_lead sono eventi GA4 osservati, non invii SMTP, email consegnate, clienti acquisiti o fatturato. Assenza di righe non è zero.",
      channelDimension ? "Canale contatto basato sulla dimensione customEvent:contact_channel registrata nella proprietà." : "Telefono/email/WhatsApp non distinguibili: dimensione contact_channel non registrata nella proprietà. Il task non la crea.");
    source.limitations.push(...metadataLimits(result.reports).filter(l => !source.limitations.includes(l)));
  } catch {
    source.metrics.push(metric("contact_click", "Clic contatto", null, null));
    source.limitations.push("Conteggi eventi contatto non disponibili o combinazione non confermata; nessuna configurazione GA4 modificata.");
  }
  // Key events are read only after verifying the property configuration and the
  // metric compatibility. Do not silently rename ordinary events as conversions.
  try {
    const configured = await googleJson(`https://analyticsadmin.googleapis.com/v1beta/${property}/keyEvents?pageSize=100`, { headers: authHeaders(access) });
    if (configured.nextPageToken || !Array.isArray(configured.keyEvents) || !configured.keyEvents.length) throw new Error();
    const safeEvents = configured.keyEvents.map((e: any) => e.eventName).filter((n: unknown) => ["contact_click", "generate_lead", "purchase"].includes(n as string));
    if (!safeEvents.length) throw new Error();
    await checkGaCompatibility(property, access, [...new Set(["eventName", ...filterDimensions])], ["keyEvents"], dimensionFilter);
    const filter = { andGroup: { expressions: [...(dimensionFilter ? [dimensionFilter] : []), { filter: { fieldName: "eventName", inListFilter: { values: safeEvents } } }] } };
    const run = (start: string, end: string) => ({ dateRanges: [{ startDate: start, endDate: end }], metrics: [{ name: "keyEvents" }], dimensionFilter: filter, returnPropertyQuota: true });
    const result = await googleJson(`https://analyticsdata.googleapis.com/v1beta/${property}:batchRunReports`, { method: "POST", headers: authHeaders(access), body: JSON.stringify({ requests: [run(period.start, period.end), ...(compare ? [run(period.previousStart, period.previousEnd)] : [])] }) });
    source.limitations.push(...metadataLimits(result.reports ?? []).filter(l => !source.limitations.includes(l)));
    const value = (i: number) => {
      const r = result.reports?.[i];
      if (r?.metadata?.subjectToThresholding || r?.metadata?.dataLossFromOtherRow || r?.metadata?.samplingMetadatas?.length) return null;
      return r?.rows?.[0] ? num(r.rows[0].metricValues?.[0]?.value) : null;
    };
    source.metrics.push(metric("keyEvents", "Eventi chiave configurati e verificati", value(0), value(1)));
    source.limitations.push(`Eventi chiave verificati nella proprietà: ${safeEvents.join(", ")}. Non equivalgono a clienti, email consegnate o fatturato; altri eventi personalizzati non verificati esclusi.`);
  } catch { source.metrics.push(metric("keyEvents", "Eventi chiave configurati", null, null)); source.limitations.push("Configurazione/semantica eventi chiave non verificabile o assente: conversioni non disponibili."); }
}
function scValues(row: any) {
  const clicks = num(row.clicks), impressions = num(row.impressions);
  return { clicks, impressions, ctr: impressions ? clicks / impressions : null, position: impressions ? num(row.position) : null };
}
export function searchFilters(filters: Filters) {
  const list: any[] = ["device", "country", "page", "query"].filter(k => filters[k]).map(dimension => ({
    dimension, operator: "equals", expression: dimension === "device" ? filters[dimension]!.toUpperCase() : dimension === "country" ? filters[dimension]!.toLowerCase() : dimension === "page" ? `https://www.marenettobuild.com${filters[dimension]}` : filters[dimension],
  }));
  if (filters.pageLanguage) list.push({ dimension: "page", operator: "includingRegex", expression: `^https://(www\\.)?marenettobuild\\.com(${languagePaths(filters.pageLanguage).map(p => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})$` });
  return list.length ? [{ groupType: "and", filters: list }] : undefined;
}
export async function searchReport(property: string, access: string, period: KpiPeriod, filters: Filters = {}): Promise<KpiSource> {
  if (!/^(sc-domain:[a-z0-9.-]+|https?:\/\/[^\s]+)$/i.test(property)) throw new MonitoringError("property_required", "Selezionare una proprietà Search Console valida.", 400);
  const query = (startDate: string, endDate: string, dimensions: string[] = [], rowLimit = 10) => googleJson(`https://searchconsole.googleapis.com/webmasters/v3/sites/${encodeURIComponent(property)}/searchAnalytics/query`, {
    method: "POST", headers: authHeaders(access), body: JSON.stringify({ startDate, endDate, dimensions, rowLimit, dimensionFilterGroups: searchFilters(filters), type: "web", dataState: "all" }),
  });
  // Small bounded query set: totals are queried independently from top-N dimensions.
  const [current, previous, dates, pages, queries] = await Promise.all([
    query(period.start, period.end), filters.compare === "false" ? Promise.resolve({}) : query(period.previousStart, period.previousEnd),
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
  source.tables = [{ title: "Pagine · prime 10", rows: rows(pages).map(r => ({ ...r, label: reportLabel(r.label, "page") })) }, { title: "Query · prime 10", rows: rows(queries).map(r => ({ ...r, label: reportLabel(r.label, "query") })) }];
  source.limitations = [
    "Ricerca web; fuso Pacifico. Google può ritardare i dati di 2–3 giorni. Date mancanti non sono riempite con zeri.",
    "Top 10 pagine/query per clic; query anonimizzate e limiti Google possono impedire la riconciliazione con i totali.",
    "CTR calcolato su clic/impressioni; posizione aggregata fornita da Google, ponderata per impressioni. Nessuna media ingenua dei top risultati.",
    "Nessuna conversione con GA4 o richieste interne. Lo storico è solo quello reso disponibile da Google per la proprietà autorizzata.",
    "Etichette non canoniche o potenzialmente personali omesse. Lingua pagina limitata alle sei pagine canoniche verificate per lingua, non dedotta dalle query.",
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
    if (this.pending.size >= 8) throw new MonitoringError("quota", "Troppe combinazioni report concorrenti. Attendere.", 429);
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
export const fetchReport = (service: GoogleReportService, property: string, access: string, period: KpiPeriod, filters: Filters = {}) => service === "ga4" ? gaReport(property, access, period, filters) : searchReport(property, access, period, filters);
