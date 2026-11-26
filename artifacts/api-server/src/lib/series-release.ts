import { fingerprint, validateContent, revision, transition, event, type EditorialData } from './editorial-content';
import type { EditorialContent } from '@workspace/api-zod';
import type { Row } from './editorial-store';
export type SeriesSeed = { identity: string; locale: string; path: string; content: EditorialContent };
export type SeriesAuthorization = { id: string; decisionDate: string; contentDigest: string };
const norm = (p: string) => p.replace(/\/+$/, '') || '/';
const locales = ['it','en','de','nl','fr','es','pt','pl','ru','sv','no','da'];
const approvedDigest = '1dd9d90422515b715a125e4798aec6736948bb53f452258d5ee2bad8a081fe44';
// jsonb does not retain JSON object insertion order. Compare the stored
// manuscript structurally; keep the original approval digest scheme unchanged.
const stable = (v: unknown): string => Array.isArray(v) ? `[${v.map(stable).join(',')}]` :
  v && typeof v === 'object' ? `{${Object.entries(v).sort(([a],[b])=>a.localeCompare(b)).map(([k,value])=>`${JSON.stringify(k)}:${stable(value)}`).join(',')}}` : JSON.stringify(v) ?? '';
export const sameEditorialContent = (a: unknown, b: unknown) => stable(a) === stable(b);
export function verifySeries(seeds: SeriesSeed[], release?: SeriesAuthorization) {
  if (!release || release.id !== 'series-owner-2026-11-26' || release.decisionDate !== '2026-11-26' ||
      seeds.length !== 120 || release.contentDigest !== approvedDigest || fingerprint(seeds) !== release.contentDigest ||
      new Set(seeds.map(s => `${s.identity}:${s.locale}`)).size !== 120 ||
      new Set(seeds.map(s => norm(s.path))).size !== 120 ||
      new Set(seeds.map(s => s.identity)).size !== 10) throw new Error('Serie: autorizzazione o digest non valido');
  for (const identity of new Set(seeds.map(s => s.identity))) {
    const family = seeds.filter(s => s.identity === identity);
    if (locales.some(locale => !family.some(s => s.locale === locale)) ||
        new Set(family.map(s => s.content.guide?.episode)).size !== 1) throw new Error('Serie: identità o lingue non valide');
  }
  for (const seed of seeds) if (!seed.content.guide || seed.content.contentLanguage !== seed.locale ||
    !seed.path.startsWith(seed.locale === 'it' ? '/' : `/${seed.locale}/`) || seed.path.startsWith('/__') ||
    seed.content.guide.episode < 1 || seed.content.guide.episode > 10) throw new Error('Serie: percorso o episodio non valido');
  return release;
}
export function hasExactEvent(data: EditorialData, action: string, rev: EditorialData['revisions'][number]) {
  return data.events.some(e => e.action === action && e.revisionId === rev.id && e.hash === rev.hash && e.sourceHash === rev.sourceHash);
}
/**
 * Called under the same PostgreSQL transaction/advisory lock as catalog import.
 * Authorization is the dated digest, NOT an impersonated owner session.
 * Validate the complete plan before changing any edition.
 */
export function releaseSeries(rows: Row[], seeds: SeriesSeed[], authorization: SeriesAuthorization, bases: SeriesSeed[] = []) {
  verifySeries(seeds, authorization);
  const ordered = [...seeds].sort((a,b) => Number(b.locale === 'it') - Number(a.locale === 'it'));
  const plan = ordered.map(seed => {
    const row = rows.find(r => r.identity === seed.identity && r.locale === seed.locale);
    if (!row || row.kind !== 'article' || norm(row.path) !== norm(seed.path)) throw new Error(`Serie: identità/percorso in conflitto ${seed.identity}:${seed.locale}`);
    if (rows.some(r => r.id !== row.id && [r.path,...(r.data.aliases ?? [])].some(p => norm(p) === norm(seed.path))))
      throw new Error(`Serie: collisione percorso/alias ${seed.identity}:${seed.locale}`);
    const content = validateContent(seed.content, locales);
    const hash = fingerprint(content);
    const italian = seeds.find(s => s.identity === seed.identity && s.locale === 'it')!;
    const sourceHash = fingerprint(validateContent(italian.content, locales));
    const active = row.data.revisions.find(r => r.id === row.data.activeRevisionId);
    const last = row.data.revisions.at(-1)!;
    const valid = (rev: typeof last) => rev.hash === hash && stable(rev.content) === stable(content) && rev.sourceHash === sourceHash;
    let withdrawal = -1;
    row.data.events.forEach((e,i) => { if (e.action === 'withdraw') withdrawal = i; });
    if (row.data.withdrawn || (withdrawal >= 0 && !row.data.events.slice(withdrawal + 1).some(e => e.action === 'activate')))
      return {row, content, sourceHash, operation:'withdrawn' as const};
    // A newer candidate must not replace or invalidate a valid active edition.
    if (active && valid(active) && hasExactEvent(row.data,'approve',active) && hasExactEvent(row.data,'activate',active))
      return {row, content, sourceHash, operation:'retained' as const};
    // Only an exact authorized candidate or untouched catalog import is eligible.
    // An old release event and a plausible actor are never sufficient.
    const base = bases.find(b => b.identity === row.identity && b.locale === row.locale && norm(b.path) === norm(row.path));
    const baseContent = base && validateContent(base.content, locales);
    const knownBase = baseContent && last.hash === fingerprint(baseContent) && stable(last.content) === stable(baseContent);
    const untouched = knownBase && row.data.revisions.length === 1 &&
      row.data.events.some(e => e.action === 'import' && e.hash === last.hash && e.revisionId === last.id) &&
      row.data.events.every(e => e.action === 'import') && !active;
    const publicBase = knownBase && active?.id === last.id && hasExactEvent(row.data,'approve',active) && hasExactEvent(row.data,'activate',active);
    if ((!valid(last) && !untouched && !publicBase) || (active && !publicBase) ||
        row.data.events.some(e => ['save','restore'].includes(e.action) && e.revisionId === last.id))
      throw new Error(`Serie: revisione/sorgente successiva da conservare ${seed.identity}:${seed.locale}`);
    return {row, content, sourceHash, operation:'activate' as const};
  });
  for (const item of plan) {
    if (item.operation !== 'activate') continue;
    const { row, content, sourceHash } = item;
    const actor = `Sistema automatico; autorizzazione dichiarata dal titolare ${authorization.decisionDate}; ${authorization.id}:${authorization.contentDigest}; revisione IA interna, non professionale`;
    const approved = revision(content, sourceHash, actor);
    row.data.revisions.push(approved);
    row.data.state = 'draft';
    // The owner-only HTTP boundary is unchanged. Here the exact dated digest
    // supplies release authority; no owner user, session or identity is invented.
    for (const action of ['submit','approve','activate']) transition(row.data,action,approved.id,sourceHash,row.locale,actor,true);
    event(row.data,`${authorization.id}:${authorization.contentDigest}`,approved,actor);
  }
  return plan.map(({row,operation}) => ({identity:row.identity,locale:row.locale,operation}));
}
