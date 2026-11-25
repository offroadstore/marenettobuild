import { ImageDisclosure } from '@/components/ImageDisclosure';
import type { HistoricalCategory, CategoryGroup } from '@/content/historical-category';
import { useContext } from 'react';
import { LibraryLocale } from '@/localization/library-context';
import { imageDescription } from '@/content/image-descriptions';

const keyOf = (href: string) => href.replace(/[?#].*$/, '').replace(/\/+$/, '') || '/';
const slug = (href: string) => keyOf(href).split('/').filter(Boolean).pop() ?? 'home';

function Secondary({ group, kind }: { group: CategoryGroup | null; kind: 'latest' | 'tags' }) {
  if (!group || !group.links.length) return null;
  const id = `mb-cat-${kind}-title`;
  return <nav className={`mb-cat-aside__group mb-cat-aside__group--${kind}`} aria-labelledby={id} data-testid={`nav-category-${kind}`}>
    <h2 id={id} className="mb-cat-aside__title">{group.heading}</h2>
    <ul role="list">
      {group.links.map((link, i) => <li key={`${link.href}-${i}`}>
        <a href={link.href} data-testid={`link-category-${kind}-${i}`}>{link.label}</a>
      </li>)}
    </ul>
  </nav>;
}

export function HistoricalCategoryView({ data, h1, currentKey }: { data: HistoricalCategory; h1: string; currentKey: string }) {
  const locale = useContext(LibraryLocale);
  const { breadcrumb, articles, emptyMessage, categories, latest, tags } = data;
  const single = articles.length === 1;
  const layout = articles.length === 0 ? 'empty' : single ? 'single' : 'grid';
  return <div className="mb-cat" data-category-layout={layout}>
    <header className="mb-cat-head">
      <div className="container">
        {breadcrumb.length > 0 && <nav className="mb-cat-crumbs" aria-label={breadcrumb[0].label} data-testid="nav-category-breadcrumb">
          <ol role="list">
            {breadcrumb.map((crumb, i) => {
              const last = i === breadcrumb.length - 1;
              return <li key={i}>{crumb.href && !last
                ? <a href={crumb.href}>{crumb.label}</a>
                : <span aria-current={last ? 'page' : undefined}>{crumb.label}</span>}</li>;
            })}
          </ol>
        </nav>}
        <h1 className="mb-cat-title" data-testid="text-category-title">{h1}</h1>
        {categories && categories.links.length > 0 && <nav className="mb-cat-switch" aria-label={categories.heading} data-testid="nav-category-switch">
          <ul role="list">
            {categories.links.map(link => {
              const current = keyOf(link.href) === currentKey;
              return <li key={link.href}>
                <a href={link.href} aria-current={current ? 'page' : undefined} data-testid={`link-category-${slug(link.href)}`}>{link.label}</a>
              </li>;
            })}
          </ul>
        </nav>}
      </div>
    </header>

    <div className="container mb-cat-body">
      <section className="mb-cat-results" aria-labelledby="mb-cat-results-title">
        <h2 id="mb-cat-results-title" className="mb-visually-hidden">{h1}</h2>
        {layout === 'empty' && emptyMessage && <p className="mb-cat-empty" role="status" data-testid="status-category-empty">{emptyMessage}</p>}
        {layout !== 'empty' && <ol role="list" className={`mb-cat-list mb-cat-list--${layout}`} data-count={articles.length}>
          {articles.map((article, i) => <li key={article.href} className="mb-cat-card" data-testid={`card-category-article-${i}`}>
            {article.image
              ? <a className="mb-cat-card__media" href={article.href} tabIndex={-1} aria-hidden="true">
                <img src={article.image} alt={imageDescription(article.image, locale)} loading={i < 2 ? 'eager' : 'lazy'} decoding="async" />
              </a>
              : <div className="mb-cat-card__media mb-cat-card__media--plain" aria-hidden="true"><span>{String(i + 1).padStart(2, '0')}</span></div>}
            <div className="mb-cat-card__copy">
              {article.image && <ImageDisclosure src={article.image} />}
              <h3 className="mb-cat-card__title"><a href={article.href} data-testid={`link-category-article-${i}`}>{article.title}</a></h3>
              {article.excerpt && <p className="mb-cat-card__excerpt">{article.excerpt}</p>}
              {article.readLabel && <a className="mb-cat-card__read" href={article.href} aria-hidden="true" tabIndex={-1}>{article.readLabel}<span aria-hidden="true" className="mb-cat-card__arrow" /></a>}
            </div>
          </li>)}
        </ol>}
      </section>
      {((latest?.links.length ?? 0) > 0 || (tags?.links.length ?? 0) > 0) && <aside className="mb-cat-aside">
        <Secondary group={latest} kind="latest" />
        <Secondary group={tags} kind="tags" />
      </aside>}
    </div>
  </div>;
}
