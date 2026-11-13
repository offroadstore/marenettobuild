import type { PublicMonitoring } from '@workspace/api-client-react';
import { AnalyticsRuntime, type RuntimePort, type AnalyticsEvent } from './runtime';

export function clearAnalyticsCookies() {
  const names = document.cookie.split(';').map(c => c.trim().split('=')[0]).filter(n => /^_ga(?:_|$)|^_gid$|^_gat(?:_|$)/.test(n));
  const host = window.location.hostname.split('.');
  const domains = ['', ...host.map((_, i) => '.' + host.slice(i).join('.'))];
  for (const name of names) for (const domain of domains) {
    document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure${domain ? `; Domain=${domain}` : ''}`;
  }
}

// No Google code lives in the application window. Removing the frame destroys
// its gtag queue, timers and listeners as well as any script still loading.
export function iframePort(): RuntimePort {
  let frame: HTMLIFrameElement | null = null;
  let ready = false;
  let pending: object[] = [];
  let flush: (() => void) | null = null;
  let onMessage: ((event: MessageEvent) => void) | null = null;
  const stop = () => {
    if (onMessage) window.removeEventListener('message', onMessage);
    frame?.remove(); frame = null; onMessage = null; ready = false; pending = []; flush = null;
  };
  return {
    stop, clearCookies: clearAnalyticsCookies,
    start(config: PublicMonitoring, path: string) {
      stop();
      const child = document.createElement('iframe');
      frame = child;
      child.hidden = true; child.title = 'Analytics'; child.setAttribute('aria-hidden', 'true');
      child.referrerPolicy = 'no-referrer';
      // Same-origin permission is safe only because validConfig requires a
      // different registrable domain, not a subdomain sharing auth cookies.
      child.setAttribute('sandbox', 'allow-scripts allow-same-origin');
      const token = crypto.randomUUID();
      const cookieNames = new Set(['_ga', '_ga_' + config.measurementId.slice(2)]);
      const cookieValue = /^[A-Za-z0-9._~!$*-]{1,300}$/;
      const cookies = Object.fromEntries(document.cookie.split(';').map(c => c.trim().split('=')).filter(([name, value]) => cookieNames.has(name) && cookieValue.test(value ?? '')));
      flush = () => {
        if (!ready || frame !== child) return;
        for (const data of pending) child.contentWindow?.postMessage({ ...data, token }, config.runtimeOrigin);
        pending = [];
      };
      child.src = config.runtimeOrigin + '/_analytics-runtime/';
      child.addEventListener('load', () => {
        if (frame !== child) return;
        child.contentWindow?.postMessage({
          type: 'marenetto-analytics-init', token, id: config.measurementId, path, cookies,
        }, config.runtimeOrigin);
      });
      onMessage = event => {
        if (event.source !== child.contentWindow || event.origin !== config.runtimeOrigin || event.data?.token !== token) return;
        const message = event.data;
        if (message.type === 'marenetto-analytics-cookie') {
          if (!cookieNames.has(message.name) || typeof message.remove !== 'boolean' || typeof message.value !== 'string' ||
            (!message.remove && !cookieValue.test(message.value))) return;
          document.cookie = `${message.name}=${message.remove ? '' : message.value}; Max-Age=${message.remove ? 0 : 15552000}; Path=/; SameSite=Lax; Secure`;
          return;
        }
        if (message.type !== 'marenetto-analytics-ready' || ready) return;
        ready = true;
        flush?.();
      };
      window.addEventListener('message', onMessage);
      document.body.append(child);
    },
    send(event: AnalyticsEvent, path: string, channel?: 'whatsapp' | 'phone' | 'email') {
      const data = { event, path, ...(channel ? { channel } : {}) };
      // The token belongs to this frame only. Keep the send function bound by
      // queuing and dispatching through the active frame's narrow message bridge.
      if (pending.length < 50) pending.push(data);
      flush?.();
    },
  };
}

let runtime: AnalyticsRuntime | null = null;
export function browserAnalytics() {
  if (typeof window === 'undefined') return null;
  return runtime ??= new AnalyticsRuntime(iframePort(), window.location.origin);
}
export const trackSavedRequest = (receipt: { code: string; isSynthetic: boolean }) => browserAnalytics()?.saved(receipt);
