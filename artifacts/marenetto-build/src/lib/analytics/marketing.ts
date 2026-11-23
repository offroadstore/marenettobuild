import { excludedPath, isPreviewOrigin } from './runtime';
import { PREFERENCES_KEY, readPreferences } from './preferences';

export const META_PIXEL_ID = '1133839426103230';
type MetaEvent = 'PageView' | 'Lead' | 'Contact';

/** Official IMG transport, not fbevents.js. No third-party executable code,
 * automatic matching, DOM inspection, provider timers or SDK event queue.
 * Referrer is suppressed at the browser transport layer, not just in payloads.
 * Anonymous CORS images omit credentials on the cross-origin request.
 * No first-party _fbp/_fbc identifiers are created or forwarded.
 */
export class MarketingRuntime {
  private granted = false;
  private path: string | null = null;
  private lastPage: string | null = null;
  private pending = new Set<HTMLImageElement>();
  private seen = new WeakSet<object>();
  private attempts = new WeakMap<object, number>();
  private generation = 0;
  private timestamp = 0;
  constructor(private origin: string) {}
  consent(granted: boolean) {
    if (this.granted && !granted) this.generation++;
    this.granted = granted;
    if (!granted) {
      this.lastPage = null;
      for (const image of this.pending) { image.removeAttribute('src'); image.remove(); }
      this.pending.clear();
      clearMetaCookies();
    }
    this.page();
  }
  navigate(path: string | null) {
    this.path = path;
    if (!path) this.lastPage = null;
    this.page();
  }
  private permitted() {
    // Recheck at dispatch, including throttled/suspended tabs and denied reads.
    let current = false;
    try { current = readPreferences(localStorage.getItem(PREFERENCES_KEY))?.marketing === true; } catch { /* denied */ }
    return current && this.granted && this.path && !isPreviewOrigin(this.origin) &&
      window.location.pathname === this.path && !excludedPath(window.location.pathname) && !excludedPath(this.path);
  }
  private page() {
    if (this.permitted() && this.lastPage !== this.path) {
      this.lastPage = this.path;
      this.send('PageView');
    }
  }
  contact() { if (this.permitted()) this.send('Contact'); }
  attempt() {
    const token = {};
    if (this.permitted()) this.attempts.set(token, this.generation);
    return token;
  }
  /** Only the email-success handler calls this; no receipt or form data leaves memory. */
  sent(attempt: object) {
    if (this.seen.has(attempt)) return;
    this.seen.add(attempt); // Never replay a pre-consent success.
    if (this.attempts.get(attempt) === this.generation && this.permitted()) this.send('Lead');
  }
  private send(event: MetaEvent) {
    const url = new URL('https://www.facebook.com/tr/');
    this.timestamp = Math.max(Date.now(), this.timestamp + 1);
    url.search = new URLSearchParams({
      id: META_PIXEL_ID, ev: event, dl: this.origin + this.path, rl: '', ts: String(this.timestamp),
    }).toString();
    const image = document.createElement('img');
    image.hidden = true; image.alt = ''; image.width = 1; image.height = 1;
    image.referrerPolicy = 'no-referrer';
    image.crossOrigin = 'anonymous';
    const remove = () => { this.pending.delete(image); image.remove(); };
    image.onload = image.onerror = remove;
    this.pending.add(image);
    document.body.append(image);
    image.src = url.href;
  }
}

export function clearMetaCookies() {
  const parts = location.hostname.split('.');
  const domains = ['', ...parts.flatMap((_, i) => [parts.slice(i).join('.'), '.' + parts.slice(i).join('.')])];
  const segments = location.pathname.split('/');
  const paths = new Set(['/', ...segments.flatMap((_, i) => {
    const path = segments.slice(0, i + 1).join('/') || '/';
    return [path, path + '/'];
  })]);
  for (const name of ['_fbp', '_fbc']) for (const domain of domains) for (const path of paths) {
    document.cookie = `${name}=; Max-Age=0; Path=${path}; Secure; SameSite=Lax${domain ? `; Domain=${domain}` : ''}`;
  }
}
let runtime: MarketingRuntime | null = null;
export function browserMarketing() {
  if (typeof window === 'undefined') return null;
  if (!runtime) {
    runtime = new MarketingRuntime(window.location.origin);
    window.addEventListener('pagehide', () => runtime?.consent(false));
  }
  return runtime;
}
