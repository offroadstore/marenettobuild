import { CONSENT_MAX_AGE } from './runtime';
import { LEGAL_VERSION } from '../../content/legal';

export const PREFERENCES_KEY = 'marenetto.cookies.v2';
export const PREFERENCES_CHANGED = 'marenetto:cookie-preferences-changed';
export type Preferences = { statistics: boolean; marketing: boolean; externalMedia: boolean; at: number; version: string; schema: 2 };
export function readPreferences(raw: string | null, now = Date.now()): Preferences | null {
  try {
    const value = JSON.parse(raw ?? 'null');
    return value?.schema === 2 && value.version === LEGAL_VERSION &&
      typeof value.statistics === 'boolean' && typeof value.marketing === 'boolean' &&
      (value.externalMedia === undefined || typeof value.externalMedia === 'boolean') &&
      Number.isFinite(value.at) && value.at <= now && now - value.at < CONSENT_MAX_AGE ? { ...value, externalMedia: value.externalMedia === true } : null;
  } catch { return null; }
}
export function savePreferences(statistics: boolean, marketing: boolean, externalMedia = false): Preferences | null {
  const value: Preferences = { schema: 2, version: LEGAL_VERSION, statistics, marketing, externalMedia, at: Date.now() };
  try {
    const raw = JSON.stringify(value);
    localStorage.setItem(PREFERENCES_KEY, raw);
    // Browsers may reject or silently discard writes. Never grant before readback.
    return localStorage.getItem(PREFERENCES_KEY) === raw ? value : null;
  } catch { return null; }
}
