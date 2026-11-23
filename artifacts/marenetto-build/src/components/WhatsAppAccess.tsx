import { useCallback, useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { useLocation } from 'wouter';
import { X } from 'lucide-react';
import { whatsappHref } from '@/config/contact';
import { localizeChoice } from '@/localization/runtime';
import { closeWhatsApp, openWhatsApp } from '@/localization/operational-copy';
import { whatsappPlacement } from '@/lib/whatsapp-placement';

function WhatsAppLogo({ size }: { size: number }) {
  return <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" focusable="false" fill="currentColor">
    <path d="M16.04 3C9 3 3.27 8.72 3.27 15.76c0 2.25.59 4.45 1.71 6.38L3 29l7.02-1.84a12.75 12.75 0 0 0 6.02 1.53h.01c7.04 0 12.77-5.73 12.77-12.77C28.82 8.72 23.08 3 16.04 3Zm0 23.5h-.01a10.6 10.6 0 0 1-5.4-1.48l-.39-.23-4.17 1.09 1.11-4.06-.25-.42a10.6 10.6 0 0 1-1.63-5.64c0-5.86 4.77-10.63 10.64-10.63 2.84 0 5.5 1.1 7.5 3.11a10.55 10.55 0 0 1 3.11 7.52c0 5.86-4.77 10.64-10.63 10.64Zm5.83-7.96c-.32-.16-1.89-.93-2.18-1.04-.29-.11-.5-.16-.71.16-.21.32-.82 1.04-1.01 1.25-.18.21-.37.24-.69.08-.32-.16-1.35-.5-2.57-1.59a9.66 9.66 0 0 1-1.78-2.21c-.19-.32-.02-.49.14-.65.14-.14.32-.37.48-.56.16-.19.21-.32.32-.53.11-.21.05-.4-.03-.56-.08-.16-.71-1.71-.98-2.34-.26-.62-.52-.53-.71-.54h-.61c-.21 0-.56.08-.85.4-.29.32-1.11 1.08-1.11 2.64s1.14 3.06 1.3 3.27c.16.21 2.24 3.42 5.43 4.8.76.33 1.35.52 1.81.67.76.24 1.45.21 2 .13.61-.09 1.89-.77 2.15-1.52.27-.75.27-1.38.19-1.52-.08-.13-.29-.21-.61-.37Z" />
  </svg>;
}

// Closed state is shared in memory only (header link + in-flow fallback); never persisted.
let closedState = false;
const listeners = new Set<() => void>();
function setClosedState(value: boolean) {
  if (closedState === value) return;
  closedState = value;
  listeners.forEach(l => l());
}
function useClosed() {
  return useSyncExternalStore(cb => { listeners.add(cb); return () => { listeners.delete(cb); }; }, () => closedState, () => false);
}

function useWhatsAppCopy(lang: string) {
  return {
    label: openWhatsApp[lang],
    href: whatsappHref(localizeChoice(lang, 'Buongiorno, vorrei informazioni per un lavoro.', 'Hello, I would like to discuss my property in Cefalù.')),
  };
}

/** Header entry, shown between the logo and the first nav item once the floating button was closed. */
export function WhatsAppNavLink({ lang }: { lang: string }) {
  const closed = useClosed();
  const { label, href } = useWhatsAppCopy(lang);
  if (!closed) return null;
  return <a className="wa-nav-link" href={href} target="_blank" rel="noopener noreferrer" data-testid="whatsapp-nav-link"><WhatsAppLogo size={17} /><span>{label}</span></a>;
}

function Inner({ lang }: { lang: string }) {
  const closed = useClosed();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const avoidance = useRef({ x: 0, y: 0 });
  const drag = useRef<{ id: number; startX: number; startY: number; originX: number; originY: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);

  const { label, href } = useWhatsAppCopy(lang);
  const closeLabel = closeWhatsApp[lang];

  // Keep mobile controls usable by moving to nearby free space before hiding.
  // If the viewport has no free slot (e.g. a consent dialog), content wins.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || closed) return;
    let frame = 0;
    let stopped = false;
    const move = (x: number, y: number) => {
      avoidance.current = { x, y };
      box.style.transform = x || y ? `translate(${x}px, ${y}px)` : '';
    };
    const check = () => {
      frame = 0;
      if (window.innerWidth >= 700) { move(0, 0); box.removeAttribute('data-obscures-content'); return; }
      if (drag.current) return;
      const rect = box.getBoundingClientRect();
      const obstacles = [...document.querySelectorAll<HTMLElement>(
        'header, a, button, input, textarea, select, [role="dialog"], h1, h2, h3, h4, h5, h6, p, li, dt, dd, label, figcaption',
      )].flatMap(element => {
        if (box.contains(element) || !element.getClientRects().length) return [];
        const style = getComputedStyle(element);
        return style.visibility === 'hidden' || style.display === 'none' || style.opacity === '0'
          ? [] : [element.getBoundingClientRect()];
      });
      const preferred = { left: rect.left - avoidance.current.x, top: rect.top - avoidance.current.y,
        width: rect.width, height: rect.height };
      const place = whatsappPlacement(preferred, obstacles, {
        width: window.visualViewport?.width ?? window.innerWidth,
        height: window.visualViewport?.height ?? window.innerHeight,
      });
      move(place ? place.left - preferred.left : 0, place ? place.top - preferred.top : 0);
      box.toggleAttribute('data-obscures-content', !place);
    };
    const schedule = () => { if (!stopped && !frame) frame = requestAnimationFrame(check); };
    const observer = new ResizeObserver(schedule);
    observer.observe(document.body);
    const mutations = new MutationObserver(schedule);
    mutations.observe(document.body, { childList: true, subtree: true });
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('pointerup', schedule);
    window.addEventListener('pointercancel', schedule);
    document.addEventListener('focusin', schedule);
    document.fonts.addEventListener('loadingdone', schedule);
    void document.fonts.ready.then(schedule);
    window.visualViewport?.addEventListener('resize', schedule);
    schedule();
    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      window.removeEventListener('pointerup', schedule);
      window.removeEventListener('pointercancel', schedule);
      document.removeEventListener('focusin', schedule);
      document.fonts.removeEventListener('loadingdone', schedule);
      window.visualViewport?.removeEventListener('resize', schedule);
    };
  }, [closed, pos]);

  const clamp = useCallback((x: number, y: number) => {
    const box = boxRef.current;
    const vv = window.visualViewport;
    const w = vv?.width ?? window.innerWidth;
    const h = vv?.height ?? window.innerHeight;
    const bw = box?.offsetWidth ?? 72;
    const bh = box?.offsetHeight ?? 72;
    return { x: Math.min(Math.max(0, x), Math.max(0, w - bw)), y: Math.min(Math.max(0, y), Math.max(0, h - bh)) };
  }, []);

  useEffect(() => {
    if (!pos) return;
    const onResize = () => setPos(p => (p ? clamp(p.x, p.y) : p));
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    window.visualViewport?.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.visualViewport?.removeEventListener('resize', onResize);
    };
  }, [pos === null, clamp]);

  const onPointerDown = (e: React.PointerEvent<HTMLAnchorElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const rect = boxRef.current!.getBoundingClientRect();
    // Start dragging from the visible, collision-adjusted location, not its
    // original CSS corner; otherwise the first pointer move jumps.
    avoidance.current = { x: 0, y: 0 };
    boxRef.current!.style.transform = '';
    setPos({ x: rect.left, y: rect.top });
    drag.current = { id: e.pointerId, startX: e.clientX, startY: e.clientY, originX: rect.left, originY: rect.top, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.startX;
    const dy = e.clientY - d.startY;
    if (!d.moved && Math.hypot(dx, dy) < 6) return;
    d.moved = true;
    setPos(clamp(d.originX + dx, d.originY + dy));
  };
  const endDrag = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    if (d.moved) {
      suppressClick.current = true;
      window.setTimeout(() => { suppressClick.current = false; }, 0);
    }
    drag.current = null;
  };
  const onClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (suppressClick.current) { e.preventDefault(); suppressClick.current = false; }
  };

  // Keep focus sensible when the floating button disappears.
  const dockRef = useRef<HTMLAnchorElement>(null);
  useLayoutEffect(() => {
    if (!closed || document.activeElement !== document.body) return;
    const nav = document.querySelector<HTMLElement>('[data-testid="whatsapp-nav-link"]');
    const target = nav && nav.offsetParent !== null ? nav : dockRef.current;
    target?.focus({ preventScroll: true });
  }, [closed]);

  return <>
    {!closed && <div ref={boxRef} className="wa-float" data-testid="whatsapp-float"
      style={pos ? { left: pos.x, top: pos.y, right: 'auto', bottom: 'auto' } : undefined}>
      <a className="wa-float__link" href={href} target="_blank" rel="noopener noreferrer" aria-label={label} draggable={false}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={endDrag} onPointerCancel={endDrag} onClick={onClick}
        data-testid="whatsapp-float-link"><WhatsAppLogo size={30} /></a>
      <button type="button" className="wa-float__close" aria-label={closeLabel} onClick={() => setClosedState(true)} data-testid="whatsapp-float-close"><span><X size={12} strokeWidth={2.4} aria-hidden="true" /></span></button>
    </div>}
    <div className="wa-dock" data-open={closed ? 'true' : undefined} data-testid="whatsapp-dock">
      <div className="wa-dock__inner"><div className="container wa-dock__row">
        {closed && <a ref={dockRef} className="wa-dock__link" href={href} target="_blank" rel="noopener noreferrer" data-testid="whatsapp-dock-link"><WhatsAppLogo size={16} /><span>{label}</span></a>}
      </div></div>
    </div>
  </>;
}

/** Shared public-layout WhatsApp access. Remounts (state resets) on every route change; nothing is persisted. */
export function WhatsAppAccess({ lang }: { lang: string }) {
  const [location] = useLocation();
  useLayoutEffect(() => { setClosedState(false); return () => setClosedState(false); }, [location]);
  return <Inner key={location} lang={lang} />;
}
