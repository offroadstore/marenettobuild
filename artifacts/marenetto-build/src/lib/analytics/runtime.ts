import type { PublicMonitoring } from '@workspace/api-client-react';
import publicHosts from '../../config/public-hosts.json';

export type AnalyticsEvent = 'page_view' | 'contact_click' | 'generate_lead';
export type Choice = 'accepted' | 'rejected';
export const CONSENT_KEY = 'marenetto.analytics.v1';
export const CONSENT_MAX_AGE = 180 * 86400000;
export function isPreviewOrigin(origin: string, allowedHosts: readonly string[] = publicHosts.siteHosts) {
  try {
    const u = new URL(origin);
    return u.protocol !== 'https:' || u.origin !== origin || Boolean(u.port) ||
      !allowedHosts.includes(u.hostname);
  } catch { return true; }
}
export const excludedPath = (path: string) => /^\/(?:internal|sign-in|sign-up|owner-demo|content|api)(?:\/|$)/i.test(path) || path.includes('__') || /(?:^|\/)(?:demo|preview|review)(?:\/|$)/i.test(path);
export function safePath(path: string, paths: ReadonlySet<string>) {
  // Use an exact inventory, not an arbitrary pathname/slug supplied by the visitor.
  return !excludedPath(path) && paths.has(path) && /^\/[a-zA-Z0-9/%_-]*$/.test(path) ? path : null;
}
export function validConfig(config: PublicMonitoring | null, origin: string, now = Date.now()) {
  if (config?.enabled !== true || config.origin !== origin || isPreviewOrigin(origin) ||
    !/^G-[A-Z0-9]{4,20}$/.test(config.measurementId) || !config.privacyVersion) return false;
  try {
    if (new URL(config.privacyUrl).origin !== origin) return false;
    const runtime = new URL(config.runtimeOrigin);
    // Both build validation and the server verify registrable-domain isolation.
    // The browser accepts only exact hosts from the reviewed configuration.
    if (runtime.origin !== config.runtimeOrigin || runtime.port ||
      isPreviewOrigin(config.runtimeOrigin, publicHosts.analyticsRuntimeHosts)) return false;
  } catch { return false; }
  const expiry = Date.parse(config.expiresAt);
  return Number.isFinite(expiry) && expiry > now && expiry <= now + 65000;
}
export function consentValue(raw: string | null, config: PublicMonitoring, now = Date.now()): Choice | null {
  try {
    const v = JSON.parse(raw ?? 'null');
    return v && v.origin === config.origin && v.runtimeOrigin === config.runtimeOrigin && v.version === config.privacyVersion && v.id === config.measurementId &&
      ['accepted', 'rejected'].includes(v.choice) && Number.isFinite(v.at) && v.at <= now && now - v.at < CONSENT_MAX_AGE ? v.choice : null;
  } catch { return null; }
}

export interface RuntimePort {
  start(config: PublicMonitoring, path: string): void;
  send(event: AnalyticsEvent, path: string, channel?: 'whatsapp' | 'phone' | 'email'): void;
  stop(): void;
  clearCookies(): void;
}

// One state machine owns every event. Tests inject a recording port; production
// uses a disposable iframe so Google cannot keep background timers after revocation.
export class AnalyticsRuntime {
  private config: PublicMonitoring | null = null;
  private choice: Choice | null = null;
  private path: string | null = null;
  private running = false;
  private lastPage: string | null = null;
  private identity = '';
  private receipts = new Set<string>();
  constructor(private port: RuntimePort, private origin: string, private clock = () => Date.now()) {}
  configure(config: PublicMonitoring | null) {
    const identity = config ? JSON.stringify([config.origin, config.runtimeOrigin, config.measurementId, config.privacyVersion]) : '';
    if (identity !== this.identity || !validConfig(config, this.origin, this.clock())) {
      this.stop(); this.choice = null;
    }
    this.identity = identity;
    this.config = config;
    this.sync();
  }
  consent(choice: Choice | null) {
    this.choice = choice;
    if (choice !== 'accepted') { this.stop(); this.port.clearCookies(); }
    this.sync();
  }
  navigate(path: string | null) {
    this.path = path;
    if (!path) this.stop();
    this.sync();
  }
  private permitted() {
    return this.choice === 'accepted' && this.path && validConfig(this.config, this.origin, this.clock());
  }
  private sync() {
    if (!this.permitted()) { this.stop(); return; }
    if (!this.running) { this.port.start(this.config!, this.path!); this.running = true; }
    if (this.lastPage !== this.path) {
      this.port.send('page_view', this.path!); this.lastPage = this.path;
    }
  }
  contact(channel: 'whatsapp' | 'phone' | 'email') {
    if (this.permitted() && ['whatsapp', 'phone', 'email'].includes(channel)) this.port.send('contact_click', this.path!, channel);
  }
  saved(receipt: { code: string; isSynthetic: boolean }) {
    // The reference is used only in local memory to deduplicate retry responses.
    // It never crosses the analytics port, localStorage, or Google.
    if (this.permitted() && !receipt.isSynthetic && !this.receipts.has(receipt.code)) {
      this.receipts.add(receipt.code);
      this.port.send('generate_lead', this.path!);
    }
  }
  stop() {
    this.port.stop(); this.running = false; this.lastPage = null;
  }
}
