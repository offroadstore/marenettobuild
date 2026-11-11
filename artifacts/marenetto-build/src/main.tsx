import { createRoot, hydrateRoot } from 'react-dom/client';

import App from './App';
import { ErrorBoundary } from '@/components/error-boundary';

import './index.css';
import { loadLocaleCatalog, setTranslationReviewMode } from './localization/runtime';
import { loadHistorical } from './content/historical';

const root = document.getElementById('root')!;
setTranslationReviewMode(window.location.pathname.startsWith('/__localization-review/'));
const locale = document.documentElement.dataset.editionLocale ?? window.location.pathname.match(/^\/(?:__localization-review\/)?([a-z]{2})(?:\/|$)/)?.[1] ?? 'it';
// The first client render must use the exact same catalog as the server.
await Promise.all([loadLocaleCatalog(locale), loadHistorical(locale)]);
const options = {
  // Keeps caught errors off reportError(), which would raise the dev overlay.
  onCaughtError: (error: unknown, errorInfo: { componentStack?: string | null }) => {
    console.error(error, errorInfo.componentStack);
  },
};
const app = <ErrorBoundary><App /></ErrorBoundary>;
if (root.hasChildNodes()) hydrateRoot(root, app, options);
else createRoot(root, options).render(app);
