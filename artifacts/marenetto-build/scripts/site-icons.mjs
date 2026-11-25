// Exact root allowlist shared by preview and production; never broaden HTML caching.
export const SITE_ICON_HEAD = `<link rel="icon" type="image/svg+xml" sizes="any" href="/favicon.svg" />
<link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png" />
<link rel="icon" type="image/png" sizes="96x96" href="/favicon-96x96.png" />
<link rel="icon" type="image/vnd.microsoft.icon" sizes="16x16 32x32 48x48" href="/favicon.ico" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<link rel="manifest" href="/site.webmanifest" />
<meta name="theme-color" content="#23211f" />
<meta name="apple-mobile-web-app-title" content="Marenetto" />`;

export const siteIconResources = new Map([
  ['/favicon.svg', 'image/svg+xml'],
  ['/favicon.ico', 'image/vnd.microsoft.icon'],
  ...['favicon-48x48.png', 'favicon-96x96.png', 'apple-touch-icon.png', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png'].map(file => [`/${file}`, 'image/png']),
  ['/site.webmanifest', 'application/manifest+json'],
].map(([url, type]) => [url, {
  type,
  cache: url === '/site.webmanifest' ? 'public, max-age=0, must-revalidate' : 'public, max-age=31536000',
}]));
