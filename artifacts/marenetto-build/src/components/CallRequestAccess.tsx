import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { createPortal } from 'react-dom';
import { ArrowRight, Phone, ShieldCheck, X } from 'lucide-react';
import { useCreateCallRequest, useGetCallRequestConfig, getGetCallRequestConfigQueryKey, type CallReceipt, type CallRequestInput, type CallProject, type CallDelivery } from '@workspace/api-client-react';
import { trackSavedRequest } from '@/lib/analytics/browser';
import { CALL_LOCALES, getCallCopy, toCallLang, type CallCopy } from '@/content/call-request-copy';
import '@/styles/call-request.css';

const OPEN_EVENT = 'marenetto:open-callback';
export const openCallRequest = () => window.dispatchEvent(new Event(OPEN_EVENT));

const PROJECTS: CallProject[] = ['renovation', 'construction', 'concrete_furniture', 'other'];
const E164 = /^\+[1-9][0-9]{7,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function newKey() {
  const raw = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  return raw.replace(/[^A-Za-z0-9_-]/g, '').padEnd(16, '0').slice(0, 80);
}

/** Derived on open from the actual page; never persisted. */
function deriveSource() {
  const path = window.location.pathname.replace(/[^A-Za-z0-9/_.\-~%]/g, '').slice(0, 300) || '/';
  const params = new URLSearchParams(window.location.search);
  const utm: NonNullable<CallRequestInput['utm']> = {};
  (['utm_source', 'utm_medium', 'utm_campaign'] as const).forEach(k => {
    const v = params.get(k)?.trim().replace(/[^\p{L}\p{N} ._\-+]/gu, '').slice(0, 60);
    if (v) utm[k] = v;
  });
  return { sourcePath: path, utm: Object.keys(utm).length ? utm : undefined };
}


type Form = { firstName: string; lastName: string; email: string; mobile: string; whatsapp: boolean; project: '' | CallProject; location: string; budget: string; startWhen: string; timeSlot: '' | 'morning' | 'afternoon'; preferredLanguage: string; message: string; privacy: boolean; marketing: boolean; companyWebsite: string };
const blank = (_lang: string): Form => ({ firstName: '', lastName: '', email: '', mobile: '', whatsapp: false, project: '', location: '', budget: '', startWhen: '', timeSlot: '', preferredLanguage: '', message: '', privacy: false, marketing: false, companyWebsite: '' });

export function CallPrivacyNotice({ c, id }: { c: CallCopy; id?: string }) {
  return <section className="cr-notice" id={id} aria-labelledby={id ? `${id}-title` : undefined} data-testid="section-call-privacy">
    <h3 id={id ? `${id}-title` : undefined}><ShieldCheck size={15} aria-hidden="true" /> {c.privacyTitle}</h3>
    <ul>{c.privacy.map((p, i) => <li key={i}>{p}</li>)}</ul>
    {c.translationNote && <p className="cr-note">{c.translationNote}</p>}
  </section>;
}

function DeliveryLine({ label, status, c, testid }: { label: string; status: CallDelivery; c: CallCopy; testid: string }) {
  return <div className={`cr-delivery is-${status}`} data-testid={testid}><small>{label}</small><span>{c.delivery[status] ?? status}</span></div>;
}

function CallForm({ lang, onClose }: { lang: string; onClose: () => void }) {
  const c = getCallCopy(lang);
  const uid = useId();
  const [form, setForm] = useState<Form>(() => blank(lang));
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [receipt, setReceipt] = useState<CallReceipt | null>(null);
  const keyRef = useRef(newKey());
  const openedAt = useRef(Date.now());
  const source = useRef(deriveSource());
  const summaryRef = useRef<HTMLDivElement>(null);
  const create = useCreateCallRequest();
  const config = useGetCallRequestConfig({ query: { queryKey: getGetCallRequestConfigQueryKey(), retry: 1, staleTime: 0 } });
  const preview = config.data?.isSynthetic === true;
  const ready = !!config.data && !config.isError;
  const languageNames = (() => { try { return new Intl.DisplayNames([toCallLang(lang)], { type: 'language' }); } catch { return null; } })();

  const set = <K extends keyof Form>(k: K, v: Form[K]) => { setForm(f => ({ ...f, [k]: v })); if (errors[k]) setErrors(e => ({ ...e, [k]: undefined })); };
  const normMobile = (v: string) => v.replace(/[\s().-]/g, '').replace(/^00/, '+');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (create.isPending || !ready || !config.data) return;
    const next: typeof errors = {};
    if (!form.firstName.trim()) next.firstName = c.errRequired;
    if (!form.lastName.trim()) next.lastName = c.errRequired;
    if (!form.email.trim()) next.email = c.errRequired; else if (!EMAIL.test(form.email.trim())) next.email = c.errEmail;
    const mobile = normMobile(form.mobile);
    if (!mobile) next.mobile = c.errRequired; else if (!E164.test(mobile)) next.mobile = c.errMobile;
    if (!form.privacy) next.privacy = c.errPrivacy;
    setErrors(next);
    if (Object.keys(next).length) { requestAnimationFrame(() => summaryRef.current?.focus()); return; }
    const opt = (v: string) => v.trim() || undefined;
    const data: CallRequestInput = {
      idempotencyKey: keyRef.current,
      firstName: form.firstName.trim(), lastName: form.lastName.trim(), email: form.email.trim(), mobile,
      whatsapp: form.whatsapp, project: form.project || undefined, location: opt(form.location), budget: opt(form.budget), startWhen: opt(form.startWhen),
      timeSlot: form.timeSlot || undefined, preferredLanguage: form.preferredLanguage ? toCallLang(form.preferredLanguage) : undefined, message: opt(form.message),
      privacyAccepted: true, marketingAccepted: form.marketing, privacyVersion: config.data.privacyVersion, consentLanguage: toCallLang(lang),
      sourcePath: source.current.sourcePath, utm: source.current.utm, companyWebsite: form.companyWebsite || undefined, formOpenedAt: openedAt.current,
    };
    create.mutate({ data }, { onSuccess: r => { trackSavedRequest(r); setReceipt(r); } });
  };

  const restart = () => { keyRef.current = newKey(); openedAt.current = Date.now(); source.current = deriveSource(); setForm(blank(lang)); setReceipt(null); create.reset(); };

  if (receipt) return <div className="cr-receipt" role="status" data-testid="status-call-receipt">
    <span className="eyebrow">{c.receiptTitle}</span>
    <small className="cr-receipt-label">{c.receiptCode}</small>
    <strong className="cr-code" data-testid="text-call-code">{receipt.code}</strong>
    <time dateTime={receipt.createdAt}>{new Date(receipt.createdAt).toLocaleString(toCallLang(lang))}</time>
    {receipt.isSynthetic && <p className="cr-synthetic" data-testid="text-call-synthetic">{c.synthetic}</p>}
    <DeliveryLine label={c.ownerLabel} status={receipt.ownerDelivery} c={c} testid="status-owner-delivery" />
    <DeliveryLine label={c.customerLabel} status={receipt.customerDelivery} c={c} testid="status-customer-delivery" />
    <div className="cr-actions"><button type="button" className="button outline" onClick={restart} data-testid="button-call-new">{c.newRequest}</button><button type="button" className="button" onClick={onClose} data-testid="button-call-done">{c.close}</button></div>
  </div>;

  const field = (k: 'firstName' | 'lastName' | 'email' | 'mobile' | 'location' | 'budget' | 'startWhen', label: string, opts: { type?: string; required?: boolean; auto?: string; max: number; hint?: string; full?: boolean }) => {
    const id = `${uid}-${k}`; const err = errors[k];
    return <div className={`field${opts.full ? ' full' : ''}`}>
      <label htmlFor={id}>{label}{opts.required ? ' *' : <span className="cr-opt"> ({c.optional})</span>}</label>
      <input id={id} type={opts.type ?? 'text'} value={form[k]} maxLength={opts.max} autoComplete={opts.auto} required={opts.required} aria-required={opts.required || undefined}
        aria-invalid={!!err || undefined} aria-describedby={[opts.hint ? `${id}-hint` : '', err ? `${id}-err` : ''].filter(Boolean).join(' ') || undefined}
        dir={k === 'mobile' || k === 'email' ? 'ltr' : undefined} inputMode={k === 'mobile' ? 'tel' : undefined}
        onChange={e => set(k, e.target.value)} data-testid={`input-call-${k}`} />
      {opts.hint && <small id={`${id}-hint`} className="cr-hint">{opts.hint}</small>}
      {err && <small id={`${id}-err`} className="cr-err">{err}</small>}
    </div>;
  };

  return <form onSubmit={submit} noValidate className="cr-form" data-testid="form-call-request">
    {Object.values(errors).some(Boolean) && <div ref={summaryRef} tabIndex={-1} className="error-box" role="alert">{c.errSummary}</div>}
    {config.isLoading && <p className="cr-preview" role="status" data-testid="text-call-config-loading">{c.loadingConfig}</p>}
    {config.isError && <div className="error-box" role="alert" data-testid="error-call-config">{c.errConfig} <button type="button" className="text-link" onClick={() => config.refetch()} data-testid="button-call-config-retry">{c.retry}</button></div>}
    {preview && <p className="cr-preview" role="note" data-testid="text-call-preview-warning">{c.previewWarn}</p>}
    <div className="form-grid">
      {field('firstName', c.firstName, { required: true, auto: 'given-name', max: 100 })}
      {field('lastName', c.lastName, { required: true, auto: 'family-name', max: 100 })}
      {field('email', c.email, { type: 'email', required: true, auto: 'email', max: 254 })}
      {field('mobile', c.mobile, { type: 'tel', required: true, auto: 'tel', max: 24, hint: c.mobileHint })}
      <div className="field full"><label className="check-row"><input type="checkbox" checked={form.whatsapp} onChange={e => set('whatsapp', e.target.checked)} data-testid="check-call-whatsapp" /><span>{c.whatsapp}</span></label></div>
      <div className="field"><label htmlFor={`${uid}-project`}>{c.project}<span className="cr-opt"> ({c.optional})</span></label>
        <select id={`${uid}-project`} value={form.project} onChange={e => set('project', e.target.value as Form['project'])} data-testid="select-call-project"><option value="">—</option>{PROJECTS.map(p => <option key={p} value={p}>{c.projects[p]}</option>)}</select></div>
      {field('location', c.location, { auto: 'address-level2', max: 180 })}
      {field('budget', c.budget, { max: 100 })}
      {field('startWhen', c.startWhen, { max: 100 })}
      <fieldset className="field cr-fieldset"><legend className="field-label">{c.timeSlot}<span className="cr-opt"> ({c.optional})</span></legend>
        <div className="radio-row">{([['', c.noPref], ['morning', c.morning], ['afternoon', c.afternoon]] as const).map(([v, l]) => <label key={v || 'none'} className="radio-choice"><input type="radio" name={`${uid}-slot`} value={v} checked={form.timeSlot === v} onChange={() => set('timeSlot', v)} data-testid={`radio-call-slot-${v || 'none'}`} /><span>{l}</span></label>)}</div></fieldset>
      <div className="field"><label htmlFor={`${uid}-plang`}>{c.prefLang}</label>
        <select id={`${uid}-plang`} value={form.preferredLanguage} onChange={e => set('preferredLanguage', e.target.value)} data-testid="select-call-language"><option value="">{c.noPref}</option>{CALL_LOCALES.map(l => <option key={l} value={l}>{languageNames?.of(l) ?? l.toUpperCase()}</option>)}</select></div>
      <div className="field full"><label htmlFor={`${uid}-msg`}>{c.message}<span className="cr-opt"> ({c.optional})</span></label>
        <textarea id={`${uid}-msg`} value={form.message} maxLength={3000} onChange={e => set('message', e.target.value)} data-testid="textarea-call-message" /></div>
      <div className="cr-honeypot" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={form.companyWebsite} onChange={e => set('companyWebsite', e.target.value)} /></label></div>
    </div>
    <CallPrivacyNotice c={c} id={`${uid}-privacy`} />
    <div className="cr-consents">
      <label className="check-row"><input type="checkbox" checked={form.privacy} aria-required="true" aria-invalid={!!errors.privacy || undefined} aria-describedby={errors.privacy ? `${uid}-perr` : `${uid}-privacy`} onChange={e => set('privacy', e.target.checked)} data-testid="check-call-privacy" /><span>{c.privacyAck} *</span></label>
      {errors.privacy && <small id={`${uid}-perr`} className="cr-err">{errors.privacy}</small>}
      <label className="check-row"><input type="checkbox" checked={form.marketing} onChange={e => set('marketing', e.target.checked)} data-testid="check-call-marketing" /><span>{c.marketing}</span></label>
    </div>
    {create.isError && <div className="error-box" role="alert" data-testid="error-call-submit">{c.errGeneric}</div>}
    <div className="form-footer"><span className="form-hint">{c.requiredNote}</span>
      <button className="button" type="submit" disabled={create.isPending || !ready} data-testid="button-call-submit">{create.isPending ? c.sending : create.isError ? c.retry : c.submit} <ArrowRight size={15} /></button></div>
  </form>;
}

function CallDialog({ lang, onClose }: { lang: string; onClose: () => void }) {
  const c = getCallCopy(lang);
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const node = ref.current;
    node?.querySelector<HTMLElement>('input, button')?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (e.key !== 'Tab' || !node) return;
      const items = [...node.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input:not([tabindex="-1"]), select, textarea')].filter(el => el.offsetParent !== null);
      if (!items.length) return;
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = overflow; prev?.focus?.(); };
  }, [onClose]);
  const dir = document.querySelector('.site-shell')?.getAttribute('dir') ?? 'ltr';
  return createPortal(<div className="cr-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div ref={ref} className="cr-dialog" role="dialog" aria-modal="true" aria-labelledby={titleId} lang={toCallLang(lang)} dir={dir} data-testid="dialog-call-request">
      <header className="cr-head"><div><span className="eyebrow">Marenetto Build · Cefalù</span><h2 id={titleId} className="display-title">{c.title}</h2><p>{c.intro}</p></div>
        <button type="button" className="cr-close" onClick={onClose} aria-label={c.close} data-testid="button-call-close"><X size={18} /></button></header>
      <CallForm lang={lang} onClose={onClose} />
    </div>
  </div>, document.body);
}

type CtxPage = 'home' | 'services' | 'articles';
const CTX: string[] = ['home', 'services', 'articles'];

/** Shared public-layout callback access: in-flow contextual entry, fixed entry and dialog. */
export function CallRequestAccess({ lang, page }: { lang: string; page: string }) {
  const c = getCallCopy(lang);
  const [open, setOpen] = useState(false);
  const fixedRef = useRef<HTMLButtonElement>(null);
  const inflowRef = useRef<HTMLElement>(null);
  const close = useRef(() => setOpen(false)).current;

  useEffect(() => {
    const onOpen = () => setOpen(true);
    window.addEventListener(OPEN_EVENT, onOpen);
    return () => window.removeEventListener(OPEN_EVENT, onOpen);
  }, []);

  // Hide the fixed entry whenever it would cover content, the in-flow entry or the footer.
  useEffect(() => {
    const btn = fixedRef.current;
    if (!btn) return;
    let frame = 0;
    const check = () => {
      frame = 0;
      btn.removeAttribute('data-hidden');
      const r = btn.getBoundingClientRect();
      const hit = (o: DOMRect) => !(o.right <= r.left || o.left >= r.right || o.bottom <= r.top || o.top >= r.bottom);
      const inflow = inflowRef.current?.getBoundingClientRect();
      const footer = document.querySelector('.footer')?.getBoundingClientRect();
      const visible = (el: DOMRect | undefined) => !!el && el.top < window.innerHeight && el.bottom > 0;
      let blocked = visible(inflow) || (!!footer && footer.top < window.innerHeight);
      if (!blocked) {
        const els = document.querySelectorAll<HTMLElement>('main a, main button, main input, main select, main textarea, main h1, main h2, main h3, main p, main li, main label, main img, [data-testid="whatsapp-float"], .mb-cbar, [role="dialog"]');
        for (const el of els) { if (el === btn || btn.contains(el)) continue; const o = el.getBoundingClientRect(); if (o.width && o.height && hit(o)) { blocked = true; break; } }
      }
      btn.toggleAttribute('data-hidden', blocked);
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(check); };
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const mo = new MutationObserver(schedule);
    mo.observe(document.body, { childList: true, subtree: true });
    schedule();
    return () => { cancelAnimationFrame(frame); mo.disconnect(); window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); };
  }, [page]);

  const ctx = CTX.includes(page) ? c.ctx[page as CtxPage] : null;
  return <>
    {ctx && <aside ref={inflowRef} className="cr-inflow container" aria-label={c.title} data-testid={`entry-call-${page}`}>
      <span className="cr-inflow-icon" aria-hidden="true"><Phone size={18} /></span>
      <div><strong>{ctx[0]}</strong><p>{ctx[1]}</p></div>
      <button type="button" className="button outline" onClick={() => setOpen(true)} data-testid={`button-call-open-${page}`}>{c.open} <ArrowRight size={14} /></button>
    </aside>}
    <button ref={fixedRef} type="button" className="cr-fixed" onClick={() => setOpen(true)} aria-haspopup="dialog" data-testid="button-call-fixed"><Phone size={16} aria-hidden="true" /><span>{c.fixed}</span></button>
    {open && <CallDialog lang={lang} onClose={close} />}
  </>;
}

/** Footer addendum: shared link and disclosure, alongside existing privacy work. */
export function CallPrivacyFooter({ lang }: { lang: string }) {
  const c = getCallCopy(lang);
  return <details className="cr-footer" id="callback-privacy" data-testid="footer-call-privacy">
    <summary data-testid="link-footer-call-privacy">{c.footerLink}</summary>
    <div className="cr-footer-body"><CallPrivacyNotice c={c} />
      <button type="button" className="text-link" onClick={openCallRequest} data-testid="button-footer-call-open">{c.open} <ArrowRight size={13} /></button></div>
  </details>;
}
