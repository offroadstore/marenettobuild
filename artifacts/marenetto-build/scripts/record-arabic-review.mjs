/**
 * Materializes the exact Arabic comparison receipt after the AI-assisted review.
 * Does not approve or modify any existing locale, publish, or notify search engines.
 * Re-running requires an explicit acknowledgement; changed text revokes the receipt.
 */
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createServer } from 'vite';
import path from 'node:path';
import { readFile, writeFile } from 'node:fs/promises';

if (!process.argv.includes('--record-ai-assisted-comparison')) throw new Error('Explicit AI-assisted comparison acknowledgement required');
process.env.PORT ||= '4188';
process.env.BASE_PATH ||= '/';
const root = path.resolve(import.meta.dirname, '..');
const vite = await createServer({ configFile: path.join(root, 'vite.config.ts'), server: { middlewareMode: true }, appType: 'custom', optimizeDeps: { noDiscovery: true, include: [] } });
const sha = text => createHash('sha256').update(text).digest('hex');
try {
  const network = await vite.ssrLoadModule('/src/content/network/index.ts');
  const { ARABIC_EDITORIAL_ARTICLES } = await vite.ssrLoadModule('/src/content/arabic-editorial/index.ts');
  const sourceRoot = path.join(root, 'src/content');
  const source = { ...JSON.parse(await readFile(path.join(sourceRoot, 'historical/it.json'), 'utf8')),
    ...JSON.parse(await readFile(path.join(sourceRoot, 'historical-editorial/it.json'), 'utf8')) };
  const networkReviews = {};
  const at = new Date().toISOString();
  for (const page of network.NETWORK_PAGES.filter(p => p.locale === 'ar')) {
    const a = network.networkCopy('ar').articles[page.id];
    const original = network.networkCopy('it').articles[page.id];
    assert.equal(a.sections.length, original.sections.length);
    assert.equal(a.faq.length, original.faq.length);
    assert.equal(a.checklist.length, original.checklist.length);
    assert.equal(a.imageAlts.length, original.imageAlts.length);
    for (let i = 0; i < a.sections.length; i++) {
      assert.equal(a.sections[i].paragraphs.length, original.sections[i].paragraphs.length);
      for (const paragraph of a.sections[i].paragraphs) assert.match(paragraph, /\p{Script=Arabic}/u);
    }
    const evidence = text => ({ reviewer: 'AI-assisted bilingual comparison, not independent professional certification', at, evidence: text });
    networkReviews[`ar:${page.id}`] = {
      reviewedContent: network.networkRevisionPayload(page), createdAt: at, modifiedAt: at,
      checks: {
        seo: evidence('Compared Arabic headline, title, description and image alt with the visible Arabic composition; no measured ranking or volume claim.'),
        linguistic: evidence('Read the complete Arabic MSA composition against the Italian/English sections, FAQ and checklist; retained conditional professional roles and Gulf-market terminology. No native-speaker sign-off.'),
        technical: evidence('Compared the same professional-role distinctions and source limitations; no project-specific engineering, legal, licensing or safety approval. Source dates are consultation dates, not a new check of current law.'),
        ai: evidence('Images retain visible AI illustration labels; no customers, executed works, certifications, offices or prior served countries inferred.'),
      },
    };
  }
  assert.equal(Object.keys(networkReviews).length, 12);
  await writeFile(path.join(sourceRoot, 'network/reviews-ar.json'), JSON.stringify(networkReviews, null, 2) + '\n');
  const receipts = ARABIC_EDITORIAL_ARTICLES.map(article => {
    const sourceKey = article.sourcePath.replace(/\/+$/, '') || '/';
    assert.ok(source[sourceKey], sourceKey);
    return { id: article.id, sourcePath: article.sourcePath, sourceDocumentSHA256: sha(JSON.stringify(source[sourceKey])),
      translationSHA256: sha(JSON.stringify(article)),
      mode: 'new-arabic-adaptation-with-ai-assisted-bilingual-review',
      qualifications: 'Absolute historical claims qualified, not repeated as guarantees; no invented native-speaker or professional sign-off.' };
  });
  await writeFile(path.join(sourceRoot, 'arabic-editorial/reviews.json'), JSON.stringify({
    reviewedAt: at, nativeSpeakerCertification: false, professionalSignOff: false, receipts,
  }, null, 2) + '\n');
  console.log(`Recorded ${Object.keys(networkReviews).length} Arabic network comparisons and ${receipts.length} source-bound editorial comparisons; no publication.`);
} finally { await vite.close(); }
