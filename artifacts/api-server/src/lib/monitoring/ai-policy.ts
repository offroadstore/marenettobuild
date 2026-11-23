import type { AiProvider, AiProviderStatus, AiQuestion } from "@workspace/api-zod";
import { dayInTimezone } from "./core";

export const providers: AiProvider[] = ["openai", "gemini", "anthropic"];
export const method = "independent-neutral-search-v1";
export const initialQuestions: AiQuestion[] = [
  "migliore impresa edile a Cefalù",
  "ristrutturazione casa Cefalù chi chiamare",
  "manutenzione immobili per proprietari all'estero in Sicilia",
  "impresa per ristrutturare una villa a Cefalù",
  "ristrutturazione appartamento a Cefalù a chi rivolgersi",
  "manutenzione seconda casa a Cefalù per chi vive all'estero",
  "ristrutturazione casa nelle Madonie vicino a Cefalù",
  "impermeabilizzazione terrazzo a Cefalù chi chiamare",
  "restauro casa in pietra vicino a Cefalù",
  "finiture in microcemento a Cefalù impresa specializzata",
].map((text, i) => ({ id: `q${i + 1}`, text, enabled: true, version: 1 }));

// Deliberately restricted vocabulary: free-text PII detection cannot reliably
// exclude personal names or street addresses. Editing stays within business topics.
const vocabulary = new Set((initialQuestions.map(q => q.text).join(" ") +
  " preventivo costo costi quanto costa tempi lavori costruzione costruire edilizia interni esterni tetto bagno cucina appartamenti ville case terrazzi facciata facciate pavimento pavimenti risanamento umidità isolamento termico energetico efficientamento riqualificazione chiavi in mano design arredi su misura legno pietra intonaco cemento resina siciliana locale locali scegliere trovare cerca aziende ditta ditte professionale qualità").toLocaleLowerCase("it").split(/[\s'’]+/));
export function safeQuestion(text: string) {
  return text.length >= 10 && text.length <= 240 && /^[\p{L}\s'’?-]+$/u.test(text) &&
    text.toLocaleLowerCase("it").split(/[\s'’?-]+/).filter(Boolean).every(w => vocabulary.has(w));
}
export const monthInRome = (now = new Date()) => dayInTimezone("Europe/Rome", now).slice(0, 7);
export function weeklySlot(now: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Rome", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(now);
  const get = (type: string) => parts.find(p => p.type === type)?.value;
  return get("weekday") === "Mon" && get("hour") === "09" && Number(get("minute")) < 15 ? dayInTimezone("Europe/Rome", now) : null;
}
// NODE_ENV alone is not deployment proof: production builds are also previewed.
export const productionExecution = () => process.env.NODE_ENV === "production" && process.env.REPLIT_DEPLOYMENT === "1";
export const keyNames: Record<AiProvider, string> = { openai: "OPENAI_API_KEY", gemini: "GEMINI_API_KEY", anthropic: "ANTHROPIC_API_KEY" };
export const models: Record<AiProvider, string> = { openai: "gpt-6.2-astra", gemini: "gemini-3.5-flash-lite", anthropic: "claude-sonnet-4-6" };
export const PRICE_REVIEW_UNTIL = "2026-12-23T00:00:00Z";
// Upper bounds in USD micro-units. See docs/monitoring/PROVIDER.md.
// 2 model passes, full input window per pass, 4096 generated tokens per pass,
// one paid search. Use expensive context tier, no free credits or cached discounts.
export const maximumMicros: Record<AiProvider, number | null> = {
  openai: Math.ceil(2 * (922000 * 16 + 4096 * 60) + 10000),
  anthropic: Math.ceil(2 * (1000000 * 3 + 4096 * 15) + 10000),
  gemini: null,
};
export function providerPolicy(provider: AiProvider, now = new Date()): AiProviderStatus {
  const blockers: string[] = [];
  if (provider === "gemini") blockers.push("Termini Google Grounding incompatibili con analisi e storico automatizzati; nessun massimo verificato delle query fatturabili. Richiesta non consentita.");
  if (now.getTime() >= Date.parse(PRICE_REVIEW_UNTIL)) blockers.push("Verifica tariffe e limiti scaduta: aggiornare la revisione documentata prima di spendere.");
  // Only inspect key existence; never return/read its value here.
  const configured = Object.prototype.hasOwnProperty.call(process.env, keyNames[provider]);
  if (!configured) blockers.push("Credenziale server non configurata.");
  return { provider, configured, model: models[provider], method, blockers, maximumUsd: maximumMicros[provider] === null ? null : maximumMicros[provider]! / 1e6 };
}
export function executionBlockers(budgetMicros: number, workerAt: Date | null, now = new Date()) {
  return [
    ...(!productionExecution() ? ["Anteprima o sviluppo: esecuzioni IA vietate."] : []),
    ...(budgetMicros <= 0 ? ["Budget mensile USD pari a zero: ogni avvio è bloccato."] : []),
    ...(!workerAt || now.getTime() - workerAt.getTime() > 180000 ? ["Worker esterno autenticato non predisposto o heartbeat scaduto."] : []),
  ];
}
