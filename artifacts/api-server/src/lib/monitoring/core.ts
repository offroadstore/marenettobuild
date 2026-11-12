import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import type { KpiPeriod, KpiMetric, MonitoringState, KpiSource } from "@workspace/api-zod";

export const scopes = ["https://www.googleapis.com/auth/webmasters.readonly", "https://www.googleapis.com/auth/analytics.readonly"];
export const environment = () => process.env.NODE_ENV === "production" ? "production" as const : "development" as const;
export const liveDataApproved = () => ["MARENETTO_PRIVACY_APPROVED", "MARENETTO_PROVIDERS_APPROVED", "MARENETTO_TESTING_APPROVED"].every(k => process.env[k] === "true");
export const hash = (value: string) => createHash("sha256").update(value).digest("base64url");
export const nonce = () => randomBytes(32).toString("base64url");
export class MonitoringError extends Error {
  constructor(public state: MonitoringState, message: string, public status = 503) { super(message); }
}
export function oauthConfig() {
  const clientId = process.env.GOOGLE_ANALYTICS_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_ANALYTICS_CLIENT_SECRET;
  const redirectUri = process.env.GOOGLE_ANALYTICS_REDIRECT_URI;
  const key = process.env.MONITORING_TOKEN_KEY;
  if (!clientId || !clientSecret || !redirectUri || !key || !/^[a-f0-9]{64}$/i.test(key)) return null;
  try {
    const u = new URL(redirectUri);
    if (u.protocol !== "https:" || u.username || u.password || u.search || u.hash || u.pathname !== "/api/internal/monitoring/google/callback") return null;
    return { clientId, clientSecret, redirectUri };
  } catch { return null; }
}
function tokenKey() {
  const value = process.env.MONITORING_TOKEN_KEY;
  if (!value || !/^[a-f0-9]{64}$/i.test(value)) throw new MonitoringError("not_configured", "Chiave di cifratura assente o non valida.");
  return Buffer.from(value, "hex");
}
export interface Tokens { refresh: string; access: string; expires: number }
export function encryptTokens(tokens: Tokens, scope = environment()) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", tokenKey(), iv);
  cipher.setAAD(Buffer.from(`marenetto-monitoring:${scope}:v1`));
  const data = Buffer.concat([cipher.update(JSON.stringify(tokens), "utf8"), cipher.final()]);
  return ["v1", iv.toString("base64url"), cipher.getAuthTag().toString("base64url"), data.toString("base64url")].join(".");
}
export function decryptTokens(envelope: string, scope = environment()): Tokens {
  try {
    const [version, iv, tag, data] = envelope.split(".");
    if (version !== "v1" || !iv || !tag || !data) throw new Error();
    const cipher = createDecipheriv("aes-256-gcm", tokenKey(), Buffer.from(iv, "base64url"));
    cipher.setAAD(Buffer.from(`marenetto-monitoring:${scope}:v1`));
    cipher.setAuthTag(Buffer.from(tag, "base64url"));
    const result = JSON.parse(Buffer.concat([cipher.update(Buffer.from(data, "base64url")), cipher.final()]).toString("utf8"));
    if (typeof result.refresh !== "string" || typeof result.access !== "string" || typeof result.expires !== "number") throw new Error();
    return result;
  } catch { throw new MonitoringError("not_configured", "Credenziali illeggibili: verificare la chiave server o ricollegare Google."); }
}
export function isoDay(date: Date) { return date.toISOString().slice(0, 10); }
export function dayInTimezone(timeZone: string, date = new Date()) {
  const parts = new Intl.DateTimeFormat("en", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(date);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
}
export function addDays(day: string, days: number) { return isoDay(new Date(Date.parse(day + "T00:00:00Z") + days * 86400000)); }
export function getPeriod(input: { days?: unknown; start?: unknown; end?: unknown }, now = new Date()): KpiPeriod {
  const yesterday = isoDay(new Date(now.getTime() - 86400000));
  const valid = (v: unknown): v is string => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && Number.isFinite(Date.parse(v + "T00:00:00Z")) && isoDay(new Date(v + "T00:00:00Z")) === v;
  let start: string, end: string;
  if (input.start !== undefined || input.end !== undefined) {
    if (!valid(input.start) || !valid(input.end)) throw new MonitoringError("unavailable", "Specificare entrambe le date valide nel formato AAAA-MM-GG.", 400);
    start = input.start; end = input.end;
  } else {
    const days = Number(input.days ?? 28);
    if (![7, 28, 90].includes(days)) throw new MonitoringError("unavailable", "Scegliere 7, 28 o 90 giorni.", 400);
    end = yesterday; start = addDays(end, -(days - 1));
  }
  const days = (Date.parse(end) - Date.parse(start)) / 86400000 + 1;
  if (days < 1 || days > 366 || end > yesterday || start < "2005-01-01") throw new MonitoringError("unavailable", "Periodo non valido: massimo 366 giorni, concluso entro ieri (UTC).", 400);
  const previousEnd = addDays(start, -1);
  return { start, end, days, previousEnd, previousStart: addDays(previousEnd, -(days - 1)) };
}
export function metric(key: string, label: string, value: number | null, previous: number | null, unit: KpiMetric["unit"] = "count"): KpiMetric {
  return { key, label, value, previous, unit, change: value === null || previous === null ? null : unit === "percent" ? (value - previous) * 100 : previous === 0 ? null : (value - previous) / previous };
}
export function emptySource(source: string, state: MonitoringState, message: string, timezone: string): KpiSource {
  return { source, state, message, timezone, updatedAt: null, dataThrough: null, metrics: [], series: [], tables: [], limitations: [] };
}
export const discovery = {
  url: "https://www.marenettobuild.com/",
  checkedAt: "2026-11-12T16:47:35.295Z",
  findings: [
    "Framework360 rilevato nell’HTML pubblico; non collegato e non migrato.",
    'window.webtracking_Url="https://www.marenettobuild.com/m/webtracking"',
    'Dominio sessione: .marenettobuild.com; script rilevato: /m/webtracking/1.js',
    'webtracking_Consent: {"required":false,"category":"analytics","utm":[]}; non adottato dal nuovo sito.',
    "Nessun identificativo GA4, GTM, UA né meta google-site-verification trovato nell’HTML della homepage recuperato.",
  ],
  limitations: "Controllo del solo HTML pubblico, SHA-256 6145be775217974aeafd4572bcaf4b079e017377918de2030d2f78607461cf96. Non esclude configurazioni in account, bundle esterni o DNS. Nessuna credenziale, proprietà autorizzata o statistica storica importata.",
};
