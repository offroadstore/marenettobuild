import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { sources } from './sources.mjs';
import { PHASE5_LOCALES, historicalPurchasePaths } from './locales.mjs';

export const phase5Guides = [
  {
    file: '01-acquisto.md', mode: 'revise-existing',
    identity: 'comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali',
    path: '/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali',
    category: 'Acquisto e ristrutturazione',
    sourceIds: ['purchase', 'dpr-9bis', 'sicily', 'sue', 'landscape-notice'],
  },
  {
    file: '02-permessi.md', mode: 'create',
    identity: 'permessi-ristrutturare-sicilia', path: '/permessi-ristrutturare-sicilia',
    category: 'Acquisto e ristrutturazione',
    sourceIds: ['dpr-6bis', 'dpr-10', 'dpr-22', 'sicily', 'sicily-circular', 'sue', 'office', 'landscape-notice', 'landscape-code', 'landscape-simplified'],
  },
  {
    file: '03-calendario.md', mode: 'create',
    identity: 'tempi-ristrutturazione-cefalu-estate', path: '/tempi-ristrutturazione-cefalu-estate',
    category: 'Impresa e servizi', sourceIds: ['sue', 'office', 'dpr-10', 'sicily'],
  },
  {
    file: '04-distanza.md', mode: 'create',
    identity: 'ristrutturare-a-distanza-cefalu', path: '/ristrutturare-a-distanza-cefalu',
    category: 'Impresa e servizi', sourceIds: ['sue', 'office', 'management'],
    managementLink: true,
  },
  {
    file: '05-arredi.md', mode: 'create',
    identity: 'tavoli-arredi-cemento-microcemento', path: '/tavoli-arredi-cemento-microcemento',
    category: 'Finiture e superfici', sourceIds: ['microverlay', 'microverlay-sheet'],
  },
  {
    file: '06-case-vacanza.md', mode: 'create',
    identity: 'lavori-case-vacanza-fuori-stagione', path: '/lavori-case-vacanza-fuori-stagione',
    category: 'Cura della proprietà', sourceIds: ['sue', 'office', 'dpr-10', 'sicily', 'management'],
    managementLink: true,
  },
];

export const escapeHTML = text => String(text).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const slug = text => text.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
function inline(text) {
  return escapeHTML(text).replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_all, label, href) => {
    if (!/^(?:https:\/\/|mailto:|\/(?!\/)|#)/.test(href)) throw new Error('Unsupported draft link');
    return `<a href="${href}">${label}</a>`;
  });
}
// Intentionally small, closed Markdown subset. Fails on raw markup rather than
// allowing a private handout or CMS import to introduce executable content.
export const italianLabels = { toc: 'Sommario', faq: 'Domande frequenti', sources: 'Fonti e limiti', register: 'Registro delle fonti consultate', consulted: 'consultata il', limits: 'Limiti' };
export function markdownBody(markdown, labels = italianLabels) {
  if (/<\/?[a-z][^>]*>/i.test(markdown)) throw new Error('Raw HTML is not part of the draft format');
  const blocks = markdown.trim().split(/\n\s*\n/);
  const excluded = [labels.toc, labels.faq, labels.sources].map(t => `## ${t}`);
  const sections = blocks.filter(b => b.startsWith('## ') && !excluded.includes(b));
  const ids = new Map();
  const used = new Set();
  for (const block of blocks.filter(b => /^#{2,3} /.test(b))) {
    const text = block.replace(/^#{2,3} /, '');
    const base = slug(text) || `section-${ids.size + 1}`;
    let id = base;
    for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
    ids.set(text, id); used.add(id);
  }
  let skipSummary = false;
  return blocks.flatMap(block => {
    if (block.startsWith('# ')) return [];
    if (block === `## ${labels.toc}`) {
      skipSummary = true;
      return [`<h2 id="${ids.get(labels.toc)}">${inline(labels.toc)}</h2><ul>${sections.map(h => `<li><a href="#${ids.get(h.slice(3))}">${inline(h.slice(3))}</a></li>`).join('')}<li><a href="#${ids.get(labels.faq)}">${inline(labels.faq)}</a></li><li><a href="#${ids.get(labels.sources)}">${inline(labels.sources)}</a></li></ul>`];
    }
    if (skipSummary && block.startsWith('- ')) { skipSummary = false; return []; }
    skipSummary = false;
    const heading = block.match(/^(#{2,3}) (.+)$/);
    if (heading) return [`<h${heading[1].length} id="${ids.get(heading[2])}">${inline(heading[2])}</h${heading[1].length}>`];
    if (block.startsWith('- ')) return [`<ul>${block.split('\n').map(line => `<li>${inline(line.replace(/^- /, ''))}</li>`).join('')}</ul>`];
    return [`<p>${inline(block.replace(/\n/g, ' '))}</p>`];
  }).join('\n');
}

export async function loadPhase5({ locales = ['it'] } = {}) {
  if (!locales.length || locales.some(locale => !PHASE5_LOCALES.includes(locale))) throw new Error('Unsupported Phase 5 locale selection');
  const requested = PHASE5_LOCALES.filter(locale => locales.includes(locale));
  const warnings = JSON.parse(await readFile(new URL('./warnings.json', import.meta.url), 'utf8'));
  const managementLinks = JSON.parse(await readFile(new URL('./management-links.json', import.meta.url), 'utf8')).links;
  const records = [];
  for (const locale of requested) {
  let screening = null;
  try { screening = JSON.parse(await readFile(new URL(`./checks/${locale}.json`, import.meta.url), 'utf8')); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  for (const guide of phase5Guides) {
    const italianMarkdown = await readFile(new URL(`./it/${guide.file}`, import.meta.url), 'utf8');
    const sourceManuscriptSHA256 = createHash('sha256').update(italianMarkdown).digest('hex');
    const adaptation = locale === 'it' ? null : JSON.parse(await readFile(new URL(`./adaptations/${locale}/${guide.file.replace('.md', '.json')}`, import.meta.url), 'utf8'));
    if (adaptation && (adaptation.locale !== locale || adaptation.identity !== guide.identity || adaptation.sourceManuscriptSHA256 !== sourceManuscriptSHA256)) throw new Error(`Stale or mismatched adaptation: ${locale}/${guide.file}`);
    const markdown = adaptation?.markdown ?? italianMarkdown;
    const labels = adaptation?.headings ?? italianLabels;
    const title = markdown.match(/^# (.+)$/m)?.[1];
    const summary = markdown.trim().split(/\n\s*\n/)[1];
    if (!title || !summary || !markdown.includes(`## ${labels.faq}`) || (adaptation && (adaptation.title !== title || adaptation.summary !== summary))) throw new Error(`Incomplete draft: ${locale}/${guide.file}`);
    if (adaptation) {
      const shape = text => text.trim().split(/\n\s*\n/).map(b => b.match(/^#{1,3} /)?.[0] ?? (b.startsWith('- ') ? 'list' : 'paragraph'));
      if (JSON.stringify(shape(markdown)) !== JSON.stringify(shape(italianMarkdown))) throw new Error(`Changed block structure: ${locale}/${guide.file}`);
      for (const marker of ['DA CONFERMARE', 'COLLEGAMENTO IN ATTESA']) if (markdown.split(marker).length !== italianMarkdown.split(marker).length) throw new Error(`Changed private markers: ${locale}/${guide.file}`);
      if (JSON.stringify(adaptation.sourceTranslations.map(s => s.id).sort()) !== JSON.stringify([...guide.sourceIds].sort())) throw new Error(`Incomplete source translation: ${locale}/${guide.file}`);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(adaptation.slug)) throw new Error(`Invalid localized slug: ${locale}/${guide.file}`);
    }
    const consulted = guide.sourceIds.map(id => {
      const source = sources.find(s => s.id === id);
      if (!source) throw new Error(`Unknown source: ${id}`);
      const localized = adaptation?.sourceTranslations.find(s => s.id === id);
      return localized ? { ...source, scope: localized.scope, limit: localized.limit } : source;
    });
    const privatePlaceholders = markdown.trim().split(/\n\s*\n/).filter(block => /^\[(?:DA CONFERMARE|COLLEGAMENTO IN ATTESA) — [\s\S]*\]$/.test(block));
    const readerMarkdown = markdown.trim().split(/\n\s*\n/).filter(block => !privatePlaceholders.includes(block)).join('\n\n') + '\n';
    if (/\[(?:DA CONFERMARE|COLLEGAMENTO IN ATTESA)/.test(readerMarkdown)) throw new Error(`Inline private placeholder must be separated before release: ${locale}/${guide.file}`);
    if (guide.managementLink && !readerMarkdown.includes(`](${managementLinks[locale]})`)) throw new Error(`Verified management link missing: ${locale}/${guide.file}`);
    const warning = warnings[locale];
    if (!warning?.title?.trim() || !warning?.body?.trim()) throw new Error(`Technician notice missing: ${locale}`);
    const body = `<blockquote id="phase5-technical-notice"><p><strong>${escapeHTML(warning.title)}</strong></p><p>${escapeHTML(warning.body)}</p></blockquote>\n` +
      markdownBody(readerMarkdown, labels) + `<h3>${escapeHTML(labels.register)}</h3><ul>` +
      consulted.map(s => `<li><a href="${escapeHTML(s.url)}">${escapeHTML(s.title)}</a> — ${escapeHTML(labels.consulted)} ${s.consultedOn}. ${escapeHTML(s.scope)} ${escapeHTML(labels.limits)}: ${escapeHTML(s.limit)}</li>`).join('') + '</ul>';
    const localizedPath = guide.mode === 'revise-existing' ? historicalPurchasePaths[locale] : (locale === 'it' ? guide.path : `/${locale}/${adaptation.slug}`);
    const content = {
        title, summary, body, category: adaptation?.category ?? guide.category, tags: ['Fase 5'],
        image: '', imageAlt: '',
        sources: consulted.map(s => ({ title: `${s.title} · ${labels.consulted} ${s.consultedOn}`, url: s.url })),
        seoTitle: adaptation?.seoTitle ?? title, seoDescription: adaptation?.seoDescription ?? (summary.slice(0, 497) + (summary.length > 497 ? '…' : '')),
        contentLanguage: locale,
    };
    const candidateContentSHA256 = createHash('sha256').update(JSON.stringify(content)).digest('hex');
    const reviewed = screening?.manuscripts?.some(item => item.identity === guide.identity && item.candidateContentSHA256 === candidateContentSHA256)
      && screening?.status === 'AI-assisted-reviewed-informative';
    records.push({
      ...guide, locale, path: localizedPath, kind: 'article', content,
      candidateContentSHA256,
      manuscriptSHA256: createHash('sha256').update(markdown).digest('hex'),
      sourceManuscriptSHA256, markdown: readerMarkdown, privateMarkdown: markdown, privatePlaceholders, labels, warning,
      preparedAt: adaptation?.preparedAt ?? '2026-11-25',
      glossary: adaptation?.glossary ?? [], privateNotes: adaptation?.privateNotes ?? [],
      review: {
        documentary: reviewed ? 'AI-assisted-reviewed-informative' : 'pending',
        linguistic: reviewed ? 'AI-assisted-reviewed-informative' : 'pending',
        technical: 'case-specific professional checks remain open',
        professionalOpinion: false,
        ownerInternalApproval: { date: '2026-11-25', scope: 'review-method-and-business-facts', professionalOpinion: false },
        publicationApproval: null,
      },
    });
  }
  }
  return { tranche: requested.length === 1 ? 'it-drafts' : 'multilingual-drafts', draftedOn: '2026-11-25', records,
    pendingLocales: PHASE5_LOCALES.filter(locale => !requested.includes(locale)),
    professionalOpinion: false, publicationHeld: true,
    readyForOwnerPublication: records.every(record => record.review.documentary !== 'pending' && record.review.linguistic !== 'pending'),
  };
}
