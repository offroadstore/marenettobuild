import type { HistoricalHome } from '@/content/historical-home';
import { GoogleReviews } from './GoogleReviews';

function Arrow() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

/** Semantic presentation of the recovered homepage. Texts come verbatim from the archive. */
export function HistoricalHomeSections({ home, locale }: { home: HistoricalHome; locale: string }) {
  const { intro, support, story } = home;
  return <div className="mbx" data-testid="historical-home-sections">
    {intro && <section className="mbx-section mbx-intro" aria-labelledby="mbx-intro-h">
      <div className="mbh-wrap mbx-intro__grid">
        <h2 id="mbx-intro-h" className="mbh-h2">{intro.heading}</h2>
        <div className="mbx-intro__body">
          {intro.paragraphs.map((text, i) => <p key={i}>{text}</p>)}
          {support && <p className="mbx-support" data-testid="text-support">{support}</p>}
        </div>
      </div>
    </section>}

    <section className="mbx-section mbx-story" aria-labelledby={story ? 'mbx-story-h' : 'mbx-reviews-h'}>
      <div className="mbh-wrap mbx-story__grid">
        {story && <div className="mbx-story__copy">
          <h2 id="mbx-story-h" className="mbh-h2">{story.heading}</h2>
          <p>{story.text}</p>
          {story.link && <a className="mbh-link" href={story.link.href} data-testid="link-story">{story.link.label}<Arrow /></a>}
        </div>}
        <GoogleReviews locale={locale} />
      </div>
    </section>
  </div>;
}
