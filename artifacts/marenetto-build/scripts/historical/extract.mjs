// Executed in an inert DOMParser document. No remote scripts, forms or image requests.
export function extractDocument({ html, url, side }) {
  const d = new DOMParser().parseFromString(html, 'text/html');
  const clean = value => (value ?? '').replace(/\u00a0/g, ' ').replace(/\s+/g, ' ').trim();
  const absolute = value => {
    if (!value || /^(?:javascript|data|blob):/i.test(value)) return null;
    try { return new URL(value, url).href; } catch { return null; }
  };
  const main = d.querySelector('#main-content') ?? d.querySelector('main') ?? d.body;
  const isArticle = side === 'original' ? d.body.classList.contains('blog-post') : Boolean(d.querySelector('article.article-body'));
  let content = main;
  let extraction = main.id === 'main-content' ? '#main-content' : main.tagName.toLowerCase();
  if (side === 'new' && d.querySelector('[data-historical-body]')) {
    content = d.querySelector('[data-historical-body]');
    extraction = 'restored original body in approved React shell';
  } else if (isArticle && side === 'original') {
    content = main.querySelector('.ms-block-content.articolo') ?? [...main.querySelectorAll('.ms-block-content')].sort((a, b) => b.textContent.length - a.textContent.length)[0] ?? main;
    extraction = content === main ? 'main fallback: inspect manually' : 'Framework360 article content block';
  } else if (isArticle && side === 'new') {
    const article = d.querySelector('article.article-body');
    const isolated = d.createElement('div');
    let collecting = false;
    for (const child of article.children) {
      if (child.tagName === 'H2' && clean(child.textContent) === 'Articolo completo') { collecting = true; continue; }
      if (child.tagName === 'H2' && clean(child.textContent) === 'Domande utili da porsi') break;
      if (collecting) isolated.append(child.cloneNode(true));
    }
    content = collecting ? isolated : article;
    extraction = collecting ? 'served article children between editorial headings' : 'article fallback: inspect manually';
  }
  const clone = content.cloneNode(true);
  clone.querySelectorAll('script,style,noscript,template').forEach(node => node.remove());
  clone.querySelectorAll('[data-preserved-ui]').forEach(node => node.remove());
  const blocks = [...clone.querySelectorAll('h1,h2,h3,h4,h5,h6,p,li,blockquote,figcaption')].filter(node =>
    !node.parentElement?.closest('li,blockquote') || node.tagName === 'LI'
  ).map(node => ({ tag: node.tagName.toLowerCase(), text: clean(node.textContent) })).filter(block => block.text);
  const body = clean(clone.textContent);
  const links = [...d.querySelectorAll('a[href]')].map(a => ({
    href: absolute(a.getAttribute('href')), label: clean(a.textContent), download: a.hasAttribute('download'),
    context: a.closest('[class*="languages"],[class*="language"]') ? 'language-selector' :
      a.closest('[class*="pagination"],[class*="pager"]') || a.rel === 'next' ? 'pagination' :
      a.closest('.ms-visualbuilder-block-header,header,nav') ? 'navigation' : 'content-link',
  })).filter(link => link.href);
  const mediaScope = isArticle ? main : content;
  const images = [...mediaScope.querySelectorAll('img')].map(img => ({
    src: absolute(img.getAttribute('data-src') || img.getAttribute('src')),
    srcset: img.getAttribute('data-srcset') || img.getAttribute('srcset'),
    alt: img.getAttribute('alt'), width: img.getAttribute('width'), height: img.getAttribute('height'),
  }));
  const backgrounds = [...mediaScope.querySelectorAll('[style]')].flatMap(node =>
    [...(node.getAttribute('style') ?? '').matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)].map(match => ({ src: absolute(match[1]), context: 'inline background', alt: null }))
  ).filter(image => image.src);
  return {
    title: clean(d.title), htmlLang: d.documentElement.lang, isArticle, extraction, body, blocks,
    h1: [...main.querySelectorAll('h1')].map(node => clean(node.textContent)),
    headings: [...content.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(node => ({ tag: node.tagName.toLowerCase(), text: clean(node.textContent) })),
    mainText: clean(main.textContent), images: [...images, ...backgrounds], links,
    stylesheets: [...d.querySelectorAll('link[rel="stylesheet"]')].map(link => absolute(link.getAttribute('href'))),
    forms: [...main.querySelectorAll('form')].map(form => ({ action: absolute(form.getAttribute('action') || url), method: form.getAttribute('method') || 'get', fields: [...form.querySelectorAll('[name]')].map(input => input.getAttribute('name')) })),
    attachments: links.filter(link => link.download || /\.(?:pdf|docx?|xlsx?|odt|txt|zip)(?:\?|$)/i.test(link.href)),
    canonical: absolute(d.querySelector('link[rel="canonical"]')?.getAttribute('href')),
    alternates: [...d.querySelectorAll('link[rel="alternate"][hreflang]')].map(link => ({ href: absolute(link.getAttribute('href')), lang: link.getAttribute('hreflang') })),
    feeds: [...d.querySelectorAll('link[rel="alternate"]')].filter(link => /rss|atom/.test(link.type)).map(link => absolute(link.getAttribute('href'))),
    next: absolute(d.querySelector('link[rel="next"]')?.getAttribute('href')),
    cms: d.querySelector('[src*="framework360"],[href*="framework360"]') ? 'Framework360' : null,
  };
}
