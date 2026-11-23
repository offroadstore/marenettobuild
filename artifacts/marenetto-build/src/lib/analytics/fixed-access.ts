import { useEffect } from 'react';

/** Measure rendered controls, including translated text, wrapping and safe areas.
 * The bottom consent bar owns the bottom edge; contacts sit immediately above it.
 */
export function useFixedAccessSpace() {
  useEffect(() => {
    let frame = 0;
    const root = document.documentElement;
    const sizes = new ResizeObserver(() => schedule());
    let observed: Element[] = [];
    const measure = () => {
      frame = 0;
      const bars = ['.analytics-preferences', '.mb-cbar'].map(selector => document.querySelector<HTMLElement>(selector));
      const nodes = bars.filter((node): node is HTMLElement => Boolean(node));
      if (nodes.length !== observed.length || nodes.some((node, i) => node !== observed[i])) {
        sizes.disconnect(); nodes.forEach(node => sizes.observe(node)); observed = nodes;
      }
      const heights = bars.map(node => node && !node.hasAttribute('data-hidden') && getComputedStyle(node).display !== 'none' ? node.getBoundingClientRect().height : 0);
      root.style.setProperty('--cookie-bar-height', `${heights[0]}px`);
      root.style.setProperty('--contact-bar-height', `${heights[1]}px`);
      window.dispatchEvent(new Event('marenetto:fixed-access-resize'));
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(measure); };
    const changes = new MutationObserver(schedule);
    changes.observe(document.body, { subtree: true, childList: true, attributes: true, attributeFilter: ['data-hidden'] });
    window.addEventListener('resize', schedule);
    schedule();
    return () => {
      cancelAnimationFrame(frame); sizes.disconnect(); changes.disconnect();
      window.removeEventListener('resize', schedule);
      root.style.removeProperty('--cookie-bar-height'); root.style.removeProperty('--contact-bar-height');
    };
  }, []);
}
