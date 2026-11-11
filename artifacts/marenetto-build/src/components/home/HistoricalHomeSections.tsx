import type { HistoricalHome } from '@/content/historical-home';

function Arrow() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
}

/** Semantic presentation of the recovered homepage. Texts come verbatim from the archive. */
export function HistoricalHomeSections({ home }: { home: HistoricalHome }) {
  const { intro, support, articles, news, story, reviews } = home;
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

    {articles.length > 0 && <section className="mbx-section mbx-articles" aria-labelledby="mbx-news-h">
      <div className="mbh-wrap">
        <header className="mbx-head">
          <h2 id="mbx-news-h" className="mbh-h2">{news?.heading}</h2>
          {news?.subtitle && <p>{news.subtitle}</p>}
        </header>
        <ul className="mbx-grid">
          {articles.map((article, i) => <li key={article.href}>
            <a className="mbx-card" href={article.href} data-testid={`link-article-${i}`}>
              <span className="mbx-card__media">{article.image && <img src={article.image} alt="" loading="lazy" decoding="async" width={600} height={400} />}</span>
              <span className="mbx-card__body">
                {article.date && <span className="mbx-card__date">{article.date}</span>}
                <span className="mbx-card__title">{article.title}</span>
                {news?.readLabel && <span className="mbx-card__more">{news.readLabel}<Arrow /></span>}
              </span>
            </a>
          </li>)}
        </ul>
      </div>
    </section>}

    {(story || reviews) && <section className="mbx-section mbx-story" aria-labelledby={story ? 'mbx-story-h' : 'mbx-reviews-h'}>
      <div className="mbh-wrap mbx-story__grid">
        {story && <div className="mbx-story__copy">
          <h2 id="mbx-story-h" className="mbh-h2">{story.heading}</h2>
          <p>{story.text}</p>
          {story.link && <a className="mbh-link" href={story.link.href} data-testid="link-story">{story.link.label}<Arrow /></a>}
        </div>}
        {reviews && <div className="mbx-reviews">
          <h2 id="mbx-reviews-h" className="mbx-reviews__h">{reviews.heading}</h2>
          <ul className="mbx-reviews__names" data-testid="list-reviewers">{reviews.names.map(name => <li key={name}>{name}</li>)}</ul>
        </div>}
      </div>
    </section>}
  </div>;
}
