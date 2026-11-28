import type { PublicMonitoring } from '@workspace/api-client-react';
import { type RuntimePort, excludedPath } from './runtime';

type AnalyticsWindow = Window & {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
  [key: `ga-disable-${string}`]: boolean;
};
const denied = { analytics_storage: 'denied', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' };

/** Direct mode intentionally requires a fresh document after withdrawal/private navigation.
 * Removing a script element alone cannot unload Google's already executed timers. */
export function directPort(clearCookies: () => void, reload = () => window.location.reload()): RuntimePort {
  let script: HTMLScriptElement | null = null;
  let config: PublicMonitoring | null = null;
  let needsReload = false;
  const w = window as unknown as AnalyticsWindow;
  function stop() {
    if (!config) return;
    w[`ga-disable-${config.measurementId}`] = true;
    w.gtag?.('consent', 'update', denied);
    script?.remove(); script = null;
    clearCookies();
    config = null;
    if (needsReload) { needsReload = false; setTimeout(reload, 0); }
  }
  return {
    clearCookies, stop,
    start(next, path) {
      if (excludedPath(window.location.pathname)) return;
      config = next;
      w[`ga-disable-${next.measurementId}`] = false;
      w.dataLayer = [];
      w.gtag = function () { w.dataLayer!.push(arguments); };
      // Basic consent mode: this code and Google's script exist only after opt-in.
      w.gtag('consent', 'default', denied);
      w.gtag('consent', 'update', { ...denied, analytics_storage: 'granted' });
      w.gtag('js', new Date());
      w.gtag('config', next.measurementId, {
        send_page_view: false, anonymize_ip: true, allow_google_signals: false,
        allow_ad_personalization_signals: false, allow_enhanced_conversions: false,
        ads_data_redaction: true, url_passthrough: false,
        // _ga/_ga_<id> default to 2 years; align them with the 180-day consent validity.
        cookie_expires: 180 * 86400, cookie_update: false,
        // Never hand Google the URL query/hash, title, referrer or submitted data.
        page_location: next.origin + path,
        page_referrer: '', page_title: '',
      });
      script = document.createElement('script');
      script.id = 'marenetto-direct-analytics'; script.async = true;
      script.referrerPolicy = 'no-referrer';
      script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(next.measurementId)}`;
      document.head.append(script);
      needsReload = true;
    },
    send(event, path, channel) {
      if (!config || excludedPath(window.location.pathname) || excludedPath(path)) return;
      w.gtag?.('event', event, {
        send_to: config.measurementId, page_location: config.origin + path,
        page_referrer: '', page_title: '', ...(channel ? { contact_channel: channel } : {}),
      });
    },
  };
}
