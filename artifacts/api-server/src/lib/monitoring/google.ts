import { MonitoringError, oauthConfig, scopes, type Tokens } from "./core";
import type { GoogleReportService, MonitoringProperty } from "@workspace/api-zod";

// Fixed provider endpoints only; neither property IDs nor responses can select a host.
const allowedHosts = new Set(["oauth2.googleapis.com", "www.googleapis.com", "analyticsadmin.googleapis.com", "analyticsdata.googleapis.com", "searchconsole.googleapis.com"]);
export async function googleJson(url: string, init: RequestInit = {}): Promise<any> {
  if (!allowedHosts.has(new URL(url).hostname)) throw new MonitoringError("unavailable", "Endpoint Google non consentito.");
  try {
    const response = await fetch(url, { ...init, redirect: "error", signal: AbortSignal.timeout(12000) });
    const body: any = await response.json().catch(() => ({}));
    if (!response.ok) {
      const quotaReason = (body.error?.errors ?? []).some((e: any) => /quotaexceeded|ratelimitexceeded|dailylimitexceeded/i.test(String(e.reason)));
      if (body.error === "invalid_grant" || response.status === 401) throw new MonitoringError("revoked", "Autorizzazione Google scaduta o revocata. Il proprietario deve ricollegare l’account.", 401);
      if (response.status === 429 || body.error?.status === "RESOURCE_EXHAUSTED" || quotaReason) throw new MonitoringError("quota", "Quota Google esaurita. Attendere prima di riprovare.", 429);
      if (response.status === 403) throw new MonitoringError("forbidden", "Accesso negato: verificare permessi sulla proprietà, scope concessi e API abilitate.", 403);
      throw new MonitoringError("unavailable", "Google non ha completato la richiesta. Verificare la configurazione e riprovare.");
    }
    return body;
  } catch (error) {
    if (error instanceof MonitoringError) throw error;
    throw new MonitoringError("unavailable", "Google non raggiungibile o tempo massimo di attesa superato.");
  }
}
export async function exchangeToken(params: Record<string, string>, previous?: Tokens): Promise<Tokens> {
  const config = oauthConfig();
  if (!config) throw new MonitoringError("not_configured", "OAuth Google non configurato sul server.");
  const body = await googleJson("https://oauth2.googleapis.com/token", {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ ...params, client_id: config.clientId, client_secret: config.clientSecret }),
  });
  const granted: string[] = typeof body.scope === "string" ? body.scope.trim().split(/\s+/) : [];
  if ((!previous && !granted.length) || granted.length && (!scopes.every(s => granted.includes(s)) || !granted.every(s => scopes.includes(s)))) {
    throw new MonitoringError("forbidden", "Google non ha concesso esattamente i permessi di sola lettura richiesti. Verificare il client dedicato e ricollegare l’account.", 403);
  }
  if (typeof body.access_token !== "string" || !(body.refresh_token || previous?.refresh)) throw new MonitoringError("revoked", "Google non ha fornito un’autorizzazione rinnovabile. Ricollegare e confermare il consenso.");
  return { access: body.access_token, refresh: body.refresh_token || previous!.refresh, expires: Date.now() + Number(body.expires_in ?? 3600) * 1000 };
}
export const authHeaders = (access: string) => ({ Authorization: `Bearer ${access}`, "Content-Type": "application/json" });
export async function listProperties(service: GoogleReportService, access: string): Promise<MonitoringProperty[]> {
  if (service === "searchConsole") {
    const body = await googleJson("https://www.googleapis.com/webmasters/v3/sites", { headers: authHeaders(access) });
    return (body.siteEntry ?? []).filter((s: any) => s.permissionLevel !== "siteUnverifiedUser").map((s: any) => ({ id: s.siteUrl, label: s.siteUrl, timezone: "America/Los_Angeles" }));
  }
  const result: MonitoringProperty[] = [];
  let pageToken = "";
  for (let page = 0; page < 20; page++) {
    const params = new URLSearchParams({ pageSize: "200" });
    if (pageToken) params.set("pageToken", pageToken);
    const body = await googleJson(`https://analyticsadmin.googleapis.com/v1beta/accountSummaries?${params}`, { headers: authHeaders(access) });
    for (const account of body.accountSummaries ?? []) for (const p of account.propertySummaries ?? []) {
      if (/^properties\/\d+$/.test(p.property)) result.push({ id: p.property, label: `${account.displayName} / ${p.displayName}`, timezone: "Fuso della proprietà (verificato nel report)" });
    }
    pageToken = body.nextPageToken ?? "";
    if (!pageToken) return result;
  }
  throw new MonitoringError("unavailable", "Troppe proprietà Google: elenco non completo. Contattare il responsabile della configurazione.");
}
export async function gaPropertyTimezone(property: string, access: string) {
  const body = await googleJson(`https://analyticsadmin.googleapis.com/v1beta/${property}`, { headers: authHeaders(access) });
  if (typeof body.timeZone !== "string") throw new MonitoringError("unavailable", "Il fuso orario della proprietà GA4 non è disponibile.");
  return body.timeZone as string;
}
export async function revokeToken(token: string) {
  try {
    // Revocation endpoint accepts form body. Never put a token in a URL or a log.
    const response = await fetch("https://oauth2.googleapis.com/revoke", { method: "POST", body: new URLSearchParams({ token }), redirect: "error", signal: AbortSignal.timeout(10000) });
    return response.ok;
  } catch { return false; }
}
