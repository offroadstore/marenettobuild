import { GetKpiDashboardQueryParams } from "@workspace/api-zod";
import { MonitoringError } from "./core";
import { safeQuestion } from "./ai-policy";

export const compatibility: Record<string, string[]> = {
  ga4: ["device", "country", "city", "page", "channel", "trafficSource", "pageLanguage"],
  searchConsole: ["device", "country", "page", "query", "pageLanguage"],
  bing: [],
  ai: ["provider", "question"],
};
export const localeCodes = "it en fr de nl es pt ru pl ro uk cs sk sl hr sr bg bs mk be ar he sv no da fi hu el tr".split(" ");
// Verified against public-pages.json. Language refers ONLY to these six
// canonical page paths per locale, not visitor language or arbitrary queries.
export function languagePaths(locale: string) {
  if (!localeCodes.includes(locale)) throw new MonitoringError("unavailable", "Lingua pagina non riconosciuta.", 400);
  return locale === "it" ? ["/", "/servizi", "/come-lavoriamo", "/proprietari-all-estero", "/richiesta", "/contatti"] :
    [`/${locale}/`, ...["services", "how-we-work", "owners-abroad", "request", "contact"].map(p => `/${locale}/${p}`)];
}
export const knownPaths = new Set(localeCodes.flatMap(languagePaths));
export const countries: Record<string, string> = { ITA: "IT", GBR: "GB", USA: "US", FRA: "FR", DEU: "DE", NLD: "NL", ESP: "ES", CHE: "CH", BEL: "BE", AUT: "AT", CAN: "CA", AUS: "AU", SWE: "SE" };
export type Filters = Record<string, string>;
export function normalizeFilters(input: Record<string, unknown>, canManage: boolean): Filters {
  // Numeric enums are emitted as literal unions, not coerce.number(). HTTP
  // always supplies strings; adapt only this known wire field before parsing.
  const parsed = GetKpiDashboardQueryParams.safeParse({ ...input, ...(typeof input.days === "string" && /^(7|28|90)$/.test(input.days) ? { days: Number(input.days) } : {}) });
  const allowed = new Set(["days", "start", "end", "compare", "source", ...Object.values(compatibility).flat()]);
  if (!parsed.success || Object.keys(input).some(k => !allowed.has(k))) throw new MonitoringError("unavailable", "Filtri non validi o sconosciuti.", 400);
  const filters: Filters = { compare: "true", source: "all" };
  for (const [k, v] of Object.entries(input)) {
    if (typeof v !== "string" || v.length > 240 || /[\u0000-\u001f\u007f@<>]/.test(v)) throw new MonitoringError("unavailable", "Valore filtro non valido; non inserire dati personali.", 400);
    if (!["days", "start", "end"].includes(k) && v.trim()) filters[k] = v.trim();
  }
  if (!canManage && (filters.source === "ai" || filters.provider || filters.question)) throw new MonitoringError("forbidden", "I filtri IA richiedono la gestione del monitoraggio.", 403);
  if (filters.country && !countries[filters.country.toUpperCase()]) throw new MonitoringError("unavailable", `Paese: usare uno dei codici ISO3 supportati (${Object.keys(countries).join(", ")}).`, 400);
  if (filters.country) filters.country = filters.country.toUpperCase();
  if (filters.city && !["Cefalù", "Palermo", "Roma", "Milano", "London", "Paris", "Berlin", "Amsterdam"].includes(filters.city)) throw new MonitoringError("unavailable", "Città non presente nella tassonomia verificata.", 400);
  if (filters.page && !knownPaths.has(filters.page)) throw new MonitoringError("unavailable", "Pagina non presente nella mappatura canonica verificata.", 400);
  if (filters.pageLanguage) languagePaths(filters.pageLanguage);
  if (filters.pageLanguage && filters.page && !languagePaths(filters.pageLanguage).includes(filters.page)) throw new MonitoringError("unavailable", "Pagina e lingua non corrispondono.", 400);
  if (filters.query && !safeQuestion(filters.query)) throw new MonitoringError("unavailable", "Query: usare solo argomenti edili senza persone, indirizzi o recapiti.", 400);
  if (filters.question && !/^q(10|[1-9])$/.test(filters.question)) throw new MonitoringError("unavailable", "Domanda non valida.", 400);
  if (filters.trafficSource && !["google", "bing", "(direct)", "facebook", "instagram", "newsletter"].includes(filters.trafficSource)) throw new MonitoringError("unavailable", "Sorgente non presente nella tassonomia verificata.", 400);
  if (filters.channel && !["Direct", "Organic Search", "Paid Search", "Referral", "Organic Social", "Email", "Unassigned"].includes(filters.channel)) throw new MonitoringError("unavailable", "Canale non riconosciuto.", 400);
  return Object.fromEntries(Object.entries(filters).sort(([a], [b]) => a.localeCompare(b)));
}
export function filterStatus(source: string, filters: Filters) {
  const active = Object.keys(filters).filter(k => !["compare", "source"].includes(k));
  return { appliedFilters: active.filter(k => compatibility[source]?.includes(k)).map(k => `${k}=${filters[k]}`), inapplicableFilters: active.filter(k => !compatibility[source]?.includes(k)) };
}
export function reportLabel(label: string, kind: "page" | "query" | "channel" | "source") {
  if (kind === "page") {
    try { label = label.startsWith("https://") ? new URL(label).pathname : label; } catch { return "Pagina omessa"; }
    return knownPaths.has(label) ? label : "Percorso non canonico omesso";
  }
  if (kind === "query") return safeQuestion(label) ? label : "Query omessa per minimizzazione";
  if (kind === "source") return ["google", "bing", "(direct)", "facebook", "instagram", "newsletter"].includes(label) ? label : "Altra sorgente";
  return ["Direct", "Organic Search", "Paid Search", "Referral", "Organic Social", "Email", "Unassigned", "Organic Video", "Cross-network", "Display", "Paid Social"].includes(label) ? label : "Altro canale";
}
