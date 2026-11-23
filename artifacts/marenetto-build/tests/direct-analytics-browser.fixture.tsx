import { createRoot } from 'react-dom/client';
import { Link, Router } from 'wouter';
import { AnalyticsPreferences } from '../src/components/AnalyticsPreferences';
import { EditorialRuntime } from '../src/lib/editorial-runtime';

createRoot(document.getElementById('root')!).render(<EditorialRuntime initial={[]}><Router>
  <AnalyticsPreferences publicEditions={[{ path: '/', locale: 'it' }, { path: '/servizi', locale: 'it' }]} />
  <main><h1>Direct consent fixture</h1>
    <Link href="/">Home</Link><Link href="/servizi?email=private@example.invalid#secret">Servizi</Link>
    <Link href="/internal">Console</Link><Link href="/sign-in">Login</Link><Link href="/sign-up">Register</Link>
    <a href="tel:+3900000000">Phone</a>
  </main>
</Router></EditorialRuntime>);
