// Runs ONLY on the independently approved, dedicated origin. No app imports,
// login, API, credentials, contact data or arbitrary URLs are available here.
(() => {
  const siteOrigin = document.currentScript?.dataset.siteOrigin;
  if (!siteOrigin || window === parent || location.protocol !== 'https:') return;
  const cookieValue = /^[A-Za-z0-9._~!$*-]{1,300}$/;
  const pathValue = /^\/[a-zA-Z0-9/%_-]*$/;
  let config = null;
  const post = data => parent.postMessage({ ...data, token: config.token }, siteOrigin);
  addEventListener('message', event => {
    if (event.source !== parent || event.origin !== siteOrigin) return;
    const v = event.data;
    if (!v || typeof v.token !== 'string') return;
    if (!config) {
      if (v.type !== 'marenetto-analytics-init' || !/^[\da-f-]{36}$/i.test(v.token) ||
        !/^G-[A-Z0-9]{4,20}$/.test(v.id) || !pathValue.test(v.path)) return;
      const names = ['_ga', '_ga_' + v.id.slice(2)];
      const jar = Object.fromEntries(Object.entries(v.cookies ?? {}).filter(([k, val]) => names.includes(k) && typeof val === 'string' && cookieValue.test(val)));
      config = { token: v.token, id: v.id };
      // Only an allowlisted jar is shared with the site. Never expose native
      // cookies or copy any provider-defined storage to the parent.
      Object.defineProperty(document, 'cookie', {
        get: () => Object.entries(jar).map(([k, val]) => k + '=' + val).join('; '),
        set: raw => {
          if (typeof raw !== 'string' || raw.length > 1500) return;
          const parts = raw.split(';'), pair = parts.shift(), eq = pair.indexOf('=');
          if (eq < 0) return;
          const name = pair.slice(0, eq).trim(), value = pair.slice(eq + 1).trim();
          if (!names.includes(name)) return;
          const remove = parts.some(p => /^\s*max-age\s*=\s*0\s*$/i.test(p) || (/^\s*expires\s*=/i.test(p) && Date.parse(p.slice(p.indexOf('=') + 1)) < Date.now()));
          if (!remove && !cookieValue.test(value)) return;
          if (remove) delete jar[name]; else jar[name] = value;
          post({ type: 'marenetto-analytics-cookie', name, value, remove });
        },
      });
      window.dataLayer = [];
      window.gtag = function () { window.dataLayer.push(arguments); };
      gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
      gtag('js', new Date());
      gtag('set', { page_location: siteOrigin + v.path, page_referrer: '', page_title: 'Marenetto Build' });
      gtag('config', config.id, { send_page_view: false, allow_google_signals: false, allow_ad_personalization_signals: false,
        cookie_domain: 'none', cookie_path: '/', cookie_expires: 15552000, ignore_referrer: true });
      const script = document.createElement('script');
      script.async = true; script.referrerPolicy = 'no-referrer';
      script.src = 'https://www.googletagmanager.com/gtag/js?id=' + config.id;
      document.head.append(script);
      post({ type: 'marenetto-analytics-ready' });
      return;
    }
    if (v.token !== config.token || !['page_view', 'contact_click', 'generate_lead'].includes(v.event) || !pathValue.test(v.path)) return;
    const fields = { send_to: config.id, page_location: siteOrigin + v.path, page_referrer: '', page_title: 'Marenetto Build' };
    if (v.event === 'contact_click') {
      if (!['whatsapp', 'phone', 'email'].includes(v.channel)) return;
      fields.contact_channel = v.channel;
    }
    gtag('set', { page_location: fields.page_location, page_referrer: '', page_title: 'Marenetto Build' });
    gtag('event', v.event, fields);
  });
})();
