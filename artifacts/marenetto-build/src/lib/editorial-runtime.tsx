import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { EditorialActive } from '@workspace/api-client-react';
import { getActiveEditorial } from '@workspace/api-client-react';

type EditorialStatus = 'loading' | 'verified' | 'unavailable';
const EditorialContext = createContext<{ active: EditorialActive[]; status: EditorialStatus }>({ active: [], status: 'loading' });
function readSnapshot(): unknown {
  if (typeof document === 'undefined') return undefined;
  try { return JSON.parse(document.getElementById('editorial-active')?.textContent ?? 'null'); }
  catch { return undefined; }
}
export function EditorialRuntime({ initial, children }: { initial?: EditorialActive[]; children: ReactNode }) {
  const [snapshot, setSnapshot] = useState<{ active: EditorialActive[]; status: EditorialStatus }>(() => {
    const supplied = initial ?? readSnapshot();
    return Array.isArray(supplied) ? { active: supplied, status: 'verified' } : { active: [], status: 'loading' };
  });
  useEffect(() => {
    let alive = true;
    let request = 0;
    const refresh = () => { const current = ++request; void getActiveEditorial().then(data => {
      if (!Array.isArray(data)) throw new Error('Risposta editoriale non valida.');
      if (alive && current === request) setSnapshot({ active: data, status: 'verified' });
    }).catch(() => {
      // A failed read is not an empty, verified catalog. In particular a cold
      // private shell must not expose static articles through client navigation.
      if (alive && current === request) setSnapshot(previous => ({ ...previous, status: 'unavailable' }));
    }); };
    refresh();
    window.addEventListener('focus', refresh);
    const timer = window.setInterval(refresh, 30000);
    return () => { alive = false; clearInterval(timer); window.removeEventListener('focus', refresh); };
  }, []);
  return <EditorialContext.Provider value={snapshot}>{children}</EditorialContext.Provider>;
}
export const useActiveEditorial = () => useContext(EditorialContext).active;
export const useEditorialStatus = () => useContext(EditorialContext).status;
export const editorialPathKey = (path: string) => { try { return decodeURIComponent(path).replace(/\/+$/, '') || '/'; } catch { return path; } };
