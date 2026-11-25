import { Link } from 'wouter';
import { COMPANY_CONTACT, COMPANY_PHONE } from '@/config/contact';
import { legalPath, noticeCopy, projectPrivacyHeading, NOTICE_VERSION, type LegalKind } from '@/content/legal-notices';
import { callCopy, type CallLang } from '@/content/call-request-copy';
import { googleReviewsDetails } from '@/config/google-reviews-details';

export function LegalNoticePage({lang, kind}: {lang: string; kind: LegalKind}) {
  const c = noticeCopy[lang];
  if (!c) throw new Error(`Missing notice ${lang}`);
  const paragraphs = kind === 'privacy' ? c.privacyText : kind === 'cookies' ? c.cookieText : c.aiText;
  return <main className="section container" lang={lang} data-testid={kind === 'ai' ? 'page-ai-use' : `page-legal-${kind}`}>
    <article className="article-body">
      <h1 className="display-title">{c[kind]}</h1>
      <p><time dateTime={NOTICE_VERSION}>{NOTICE_VERSION}</time> · v1</p>
      <p role="note" className="language-note" data-testid="legal-candidate-status">{c.pending}</p>
      <address>
        <strong>{COMPANY_CONTACT.legalName}</strong><br />
        {COMPANY_CONTACT.streetAddress}, {COMPANY_CONTACT.localityLine}<br />
        P.IVA {COMPANY_CONTACT.vatId}<br />
        <a href={`mailto:${COMPANY_CONTACT.email}`}>{COMPANY_CONTACT.email}</a> · <a href={`tel:${COMPANY_PHONE.e164}`}>{COMPANY_PHONE.display}</a>
      </address>
      {kind === 'privacy' ? <>
        <p>{paragraphs[0]}</p>
        <section aria-labelledby="project-privacy-heading">
          <h2 id="project-privacy-heading">{projectPrivacyHeading[lang]}</h2>
          {paragraphs.slice(1).map((paragraph,index)=><p key={index}>{paragraph}</p>)}
        </section>
        <section aria-labelledby="callback-privacy-heading" data-testid="legal-callback-processing">
          <h2 id="callback-privacy-heading">{callCopy[lang as CallLang].privacyTitle}</h2>
          {callCopy[lang as CallLang].privacy.map((paragraph,index)=><p key={index}>{paragraph}</p>)}
        </section>
        <p data-testid="legal-google-review-transport">{googleReviewsDetails[lang].privacy}</p>
      </> : paragraphs.map((paragraph,index)=><p key={index}>{paragraph}</p>)}
      <nav aria-label={c.privacy}><ul>{(['privacy', 'cookies', 'ai'] as const).filter(other => other !== kind).map(other =>
        <li key={other}><Link href={legalPath(lang, other)}>{c[other]}</Link></li>)}</ul></nav>
      <p><a href="https://www.garanteprivacy.it/faq/cookie" target="_blank" rel="noopener noreferrer">Garante — FAQ cookie</a> · <a href="https://ai-act-service-desk.ec.europa.eu/it/ai-act/article-50" target="_blank" rel="noopener noreferrer">AI Act — Art. 50</a></p>
    </article>
  </main>;
}
