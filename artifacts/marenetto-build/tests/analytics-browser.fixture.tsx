// Isolated browser fixture, bundled only by analytics.spec.ts. Never imported
// into the app or registered as a public route.
import { createRoot } from 'react-dom/client';
import { Router, Link } from 'wouter';
import { AnalyticsPreferences } from '../src/components/AnalyticsPreferences';
import { EditorialRuntime } from '../src/lib/editorial-runtime';
import { trackSavedRequest } from '../src/lib/analytics/browser';
import publicHosts from '../src/config/public-hosts.json';

// Only this test entrypoint admits these synthetic origins.
Object.assign(publicHosts, { siteHosts: ['analytics-test.example.com'], analyticsRuntimeHosts: ['metrics-runtime.example.net'] });

const publicEditions = [{ path: '/', locale: 'it' }, { path: '/servizi', locale: 'it' }];
function Harness() {
  return <EditorialRuntime initial={[]}><Router><AnalyticsPreferences publicEditions={publicEditions} />
    <main><h1>Isolated analytics browser fixture</h1>
      <Link href="/">Home</Link>
      <Link href="/servizi?email=private@example.com#secret">Servizi</Link>
      <Link href="/internal?private=secret">Console</Link>
      <Link href="/sign-in">Login</Link>
      <Link href="/owner-demo">Demo</Link>
      <Link href="/__localization-review/it/home">Review</Link>
      <a href="tel:+39000000000">Phone</a>
      <a href="mailto:private@example.com?body=secret">Email</a>
      <a href="https://wa.me/3900000000?text=private" target="_blank">WhatsApp</a>
      <button onClick={async () => {
        const r = await fetch('/api/project-requests', { method: 'POST' });
        if (r.ok) trackSavedRequest(await r.json());
      }}>Submit fixture</button>
    </main>
  </Router></EditorialRuntime>;
}
createRoot(document.getElementById('root')!).render(<Harness />);
