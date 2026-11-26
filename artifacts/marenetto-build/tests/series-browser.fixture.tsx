// Isolated browser fixture only. Never imported by a production entry point.
import {createRoot} from 'react-dom/client';
import {Router} from 'wouter';
import {AnalyticsPreferences} from '../src/components/AnalyticsPreferences';
import {CookiePreferencesLink} from '../src/components/CookiePreferencesLink';
import {SeriesArticle} from '../src/components/SeriesArticle';
import {EditorialRuntime} from '../src/lib/editorial-runtime';
import type {EditorialActive} from '@workspace/api-client-react';
const guide={episode:8,faq:[{question:'Test question',answer:'Test answer'}],technicalReview:'',editorialReview:'',languageReview:'',sourcesCurrent:false,searchConsoleVerified:false};
const video={youtubeId:'TEST_ONLY01',title:'Synthetic consent fixture',description:'Not a real company film',thumbnail:'/media/test-only.jpg',uploadDate:'2025-01-10',spokenLanguage:'it',author:'Synthetic fixture',rights:'Test-only fixture',transcriptLanguage:'en',transcript:'Reviewed transcript fixture. Never published.',transcriptReviewed:true};
const active:EditorialActive={identity:'synthetic-series',path:'/',locale:'it',kind:'article',revisionId:'synthetic',content:{title:'Synthetic series fixture',summary:'Test only',body:'<p>Test</p>',category:'',tags:[],image:'',imageAlt:'',sources:[],seoTitle:'Test',seoDescription:'Test',contentLanguage:'it',guide:{...guide,...(!location.search.includes('placeholder')?{video}:{})}}};
(window as unknown as {testEdition:EditorialActive}).testEdition=active;
createRoot(document.getElementById('root')!).render(<EditorialRuntime initial={[active]}><Router>
  <AnalyticsPreferences publicEditions={[{path:'/',locale:'it'}]} />
  <main><h1>Isolated external-media consent test</h1><p>Official-source fixture</p><SeriesArticle guide={active.content.guide!} locale="it" /></main>
  <footer><CookiePreferencesLink lang="it" /></footer>
</Router></EditorialRuntime>);
