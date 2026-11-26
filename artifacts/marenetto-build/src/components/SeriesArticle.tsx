import type { EditorialGuide } from '@workspace/api-client-react';
import { useExternalMediaConsent } from '@/lib/analytics/external-media';
import { COOKIE_PREFERENCES_EVENT } from './CookiePreferencesLink';
import { embedURL, readyVideo, seriesLabels } from '@/content/series-public.mjs';
import { useActiveEditorial } from '@/lib/editorial-runtime';
import { Link } from 'wouter';
import './series-article.css';

export function SeriesArticle({ guide, locale }: { guide: EditorialGuide; locale: string }) {
  const consent = useExternalMediaConsent();
  const text = seriesLabels[locale] ?? seriesLabels.it;
  const video = readyVideo(guide.video) ? guide.video : undefined;
  const peers = useActiveEditorial().filter(e => e.locale === locale && e.revisionId !== 'withdrawn' && e.content.guide)
    .sort((a,b) => a.content.guide!.episode - b.content.guide!.episode);
  return <section data-testid="series-article" lang={locale}>
    <p>{text[0]} · {guide.episode}/10</p>
    {guide.reviewBasis === 'ai-assisted-internal' && <aside className="article-technical-notice" data-testid="technical-notice">
      <h2>{guide.technicalHeading}</h2>
      <p>{guide.technicalNotice}</p>
      <p>{guide.reviewDisclosure}</p>
    </aside>}
    {guide.faq.length > 0 && <section aria-label={text[6]}>
      <h2>{text[6]}</h2>{guide.faq.map(faq => <div key={faq.question}><h3>{faq.question}</h3><p>{faq.answer}</p></div>)}
    </section>}
    <section aria-label={`Video · ${text[0]} · ${guide.episode}`} data-testid="series-video">
      <h2>{video?.title ?? `Video · ${text[0]} · ${guide.episode}`}</h2>
      {!video ? <p role="status">{text[1]}</p> : <>
        <p>{text[4]}: <span lang={video.spokenLanguage}>{video.spokenLanguage.toUpperCase()}</span> · {video.author}</p>
        {consent ? <iframe key={video.youtubeId} src={embedURL(video)} title={video.title}
          width="720" height="405" style={{ maxWidth: '100%', border: 0 }} referrerPolicy="strict-origin-when-cross-origin"
          allow="encrypted-media; fullscreen; picture-in-picture" allowFullScreen data-testid="youtube-player" /> : <div data-testid="external-media-local">
          <img src={`${import.meta.env.BASE_URL.replace(/\/$/, '')}${video.thumbnail}`} alt={video.title} loading="lazy" style={{ maxWidth: '100%' }} />
          <p>{text[3]}</p>
          <button type="button" className="button outline" onClick={event => window.dispatchEvent(new CustomEvent(COOKIE_PREFERENCES_EVENT, { detail: event.currentTarget }))}>{text[2]}</button>
        </div>}
        <section lang={video.transcriptLanguage} aria-label={text[5]}>
          <h3>{text[5]} · {video.transcriptLanguage.toUpperCase()}</h3>
          {video.transcript.split(/\n\s*\n/).map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        </section>
      </>}
    </section>
    {peers.length > 1 && <nav aria-label={text[0]} data-testid="series-navigation">
      <h2>{text[0]}</h2><ol>{peers.map(peer => <li key={peer.identity}>
        <Link href={peer.path}>{peer.content.title}</Link>
      </li>)}</ol>
    </nav>}
    <p className="article-disclaimer">{text[7]}</p>
  </section>;
}
