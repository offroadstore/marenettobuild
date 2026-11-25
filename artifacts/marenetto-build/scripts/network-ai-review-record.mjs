/**
 * Records a completed AI-assisted documentary/linguistic check, NOT a release
 * approval. Run only after reading/adjudicating the actual review outputs.
 */
import { createServer } from 'vite';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
if (!process.argv.includes('--adjudicated')) throw new Error('Requires --adjudicated after an actual review and adjudication of current content. This command does not perform a review.');
process.env.PORT ||= '4193';
process.env.BASE_PATH ||= '/';
const root = path.resolve(import.meta.dirname, '..');
const out = path.resolve(root, '../../generated-artifacts/network/ai-review');
const hash = s => createHash('sha256').update(s).digest('hex');
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
try {
  const n = await vite.ssrLoadModule('/src/content/network/index.ts');
  const results = {};
  for (const locale of n.NETWORK_LOCALES) {
    const raw = await readFile(path.join(out, `${locale}-linguistic.json`), 'utf8');
    const result = JSON.parse(raw);
    if (result.locale !== locale || JSON.stringify([...new Set(result.reviewedArticleIds)].sort()) !== JSON.stringify([...n.NETWORK_IDS].sort())) throw new Error(`Incomplete AI coverage: ${locale}`);
    results[locale] = { raw, result, input: JSON.parse(await readFile(path.join(out, `${locale}-input.json`), 'utf8')) };
  }
  const at = new Date().toISOString();
  const sourceReceipts = await Promise.all((await readdir(out)).filter(name => /^source-.*\.json$/.test(name)).sort().map(async name => {
    const raw = await readFile(path.join(out, name), 'utf8');
    const s = JSON.parse(raw);
    return { id: s.id, url: s.url, consultedAt: s.consultedAt, receiptSHA256: hash(raw), truncated: Boolean(s.truncated),
      failure: s.failure, usableAsEvidence: Boolean(s.markdown) && !s.failure && s.usableAsEvidence !== false && !['notary', 'regional-ars'].includes(s.id) };
  }));
  const evidence = {
    mode: 'ai-assisted-documentary-linguistic', at, reviewer: 'Replit Agent — AI-assisted editorial check',
    professionalSignOff: false, nativeSpeakerCertification: false, publicationApproval: false,
    visualCoverage: 'All 34 originals inspected in nine larger four-scene panels; AI visual observation, not verification of materials, construction or invisible systems.',
    decisions: [
      'Removed Swedish, Norwegian and Danish comparisons with real-estate sales occupations; retained the distinction between Italian notaio and domestic notarial/legal roles. The two additional cases were found by the literal regression scan, not by the linguistic model.',
      'Clarified French dimensions and EV charging terminology, and Russian direzione lavori without asserting equivalence to a domestic statutory role.',
      'Corrected 24 localized alt texts: depict a timber pergola and metal terrace railing, not a close-up joint or a visually unverifiable stainless alloy.',
      'Kept authorized explanations of geometra, notaio, CIN and direzione lavori. Rejected suggestions to remove them merely because Italian readers do not need the same gloss.',
      'Rejected proposed Italian text inside Dutch content, geometra described as a real-estate expert, unnecessary statutory guarantees, and stylistic rewrites without a concrete defect.',
      'Replaced the Agrigento water reference with Palermo forms updated 4 November 2026; added the official 4 March 2026 installer guide and the Notariato checks page.',
      'Documentary model output used an inexact regional URL and loose English wording about internal design. Those are not accepted as source citations or substantive findings.',
      'Owner accepts the official L.R.16/2016 consolidation valid2025-02-28, with later unverified amendments left in a localized case-specific notice without blocking handoff. PDF confirmed: HTTP200 application/pdf, 23pages. Requested /sites/ aliases returned404; working official /system/ copy retained.',
      'Final AI check added all twelve localized regulatory notices and reviewed 34 originals in nine larger panels. Corrected 24 further roof alt texts: no assertion of visible drains, slopes or a skylight absent from the image.',
    ],
    remainingLimits: [
      'No qualified technical/legal opinion or native-speaker certification has been obtained.',
      'Regional legal consolidation is valid2025-02-28; later unverified changes remain a visible professional case-specific check, explicitly accepted by the owner as non-blocking.',
      'The ARS page supplies the original 2016 act, not a current consolidation. A 2026 GURS supplement could not be retrieved: reader error, then direct HTTP timeout after 35 seconds. No claim is made about its unseen contents.',
      'NTC approval notice and UNI public summary are not the full technical annex or paid standard.',
      'Design, permissions, qualifications, condensation, waterproofing, anchors, glass safety, heritage constraints, wells and purchase checks require competent assessment on the actual case.',
      'Images have AI visual acceptance, not owner certification or proof of actual works. The public release ledger remains unchanged; staged readiness does not itself activate the section.',
    ],
    sourceReceipts,
    editions: n.NETWORK_PAGES.map(page => ({
      id: page.id, locale: page.locale,
      inputSHA256: results[page.locale].input.revisions.find(r => r.id === page.id).sha256,
      contentSHA256: hash(n.networkRevisionPayload(page)),
      linguisticResultSHA256: hash(results[page.locale].raw),
      status: 'ai-reviewed-with-adjudicated-corrections',
    })),
  };
  await mkdir(out, { recursive: true });
  await writeFile(path.join(root, 'src/content/network/ai-checks.json'), JSON.stringify(evidence, null, 2) + '\n');
  await writeFile(path.join(out, 'adjudicated-review.json'), JSON.stringify({
    ...evidence, linguisticOutputs: Object.fromEntries(Object.entries(results).map(([locale, { result }]) => [locale, result])),
    documentaryOutputs: await Promise.all([1, 2].map(async group => JSON.parse(await readFile(path.join(out, `documentary-${group}.json`), 'utf8')))),
  }, null, 2));
  const cell = s => `"${String(s).replaceAll('"', '""')}"`;
  await writeFile(path.join(out, 'REVISIONI-IA.csv'), '\uFEFF' + [
    ['locale', 'article', 'status', 'contentSHA256', 'reviewedAt', 'professionalSignOff', 'publicationApproval'].join(','),
    ...evidence.editions.map(e => [e.locale, e.id, e.status, e.contentSHA256, at, false, false].map(cell).join(',')),
  ].join('\r\n'));
  console.log(`Recorded ${evidence.editions.length} actual AI checks. Professional/release approvals: false. Public editions: ${n.NETWORK_PUBLIC_PAGES.length}.`);
} finally { await vite.close(); }
