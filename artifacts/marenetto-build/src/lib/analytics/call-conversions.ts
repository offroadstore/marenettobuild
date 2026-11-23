/**
 * Preparation boundary only: no advertising loader, credentials or activation.
 * Future adapters must live in the reviewed isolated provider runtime. The form's
 * marketing checkbox must NEVER be wired to these cookie-consent grants.
 */
export type AdvertisingProvider = 'meta' | 'googleAds';
export type LeadConversion = Readonly<{ event: 'generate_lead' }>;
export type AdvertisingAdapter = Readonly<{
  configured: boolean;
  send: (event: LeadConversion) => void;
}>;
export class CallAdvertisingConversions {
  private grants: Record<AdvertisingProvider, boolean> = { meta: false, googleAds: false };
  private adapters: Partial<Record<AdvertisingProvider, AdvertisingAdapter>> = {};
  private delivered = new Set<string>();
  configure(adapters: Partial<Record<AdvertisingProvider, AdvertisingAdapter>>) {
    this.adapters = adapters;
    // A configuration change requires fresh consent to that configuration.
    this.grants = { meta: false, googleAds: false };
  }
  consent(grants: Record<AdvertisingProvider, boolean>) { this.grants = { ...grants }; }
  revoke() { this.grants = { meta: false, googleAds: false }; }
  saved(receipt: { code: string; isSynthetic: boolean }) {
    if (receipt.isSynthetic) return;
    for (const provider of ['meta', 'googleAds'] as const) {
      const adapter = this.adapters[provider], key = `${provider}:${receipt.code}`;
      if (!this.grants[provider] || adapter?.configured !== true || this.delivered.has(key)) continue;
      // Code is used only for local deduplication and never sent to any provider.
      this.delivered.add(key);
      try { adapter.send({ event: 'generate_lead' }); } catch { /* Do not replay ambiguous conversions. */ }
    }
  }
}
// Deliberately unconfigured and unconsented. Adding a form does not enable ads.
export const callAdvertisingConversions = new CallAdvertisingConversions();
