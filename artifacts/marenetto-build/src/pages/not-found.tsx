import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import { isLocaleCatalogLoaded, loadLocaleCatalog, translateText } from '@/localization/runtime';
import { publicPath } from '@/localization/paths';
import { getLocale, getLocaleDirection } from '@/localization/locales';
import { withCampaignParams } from '@/lib/campaign';
import { localeLoadErrors } from '@/localization/load-errors';

export default function NotFound({ lang: requestedLang }: { lang?: string }) {
  const candidate = requestedLang ?? window.location.pathname.split('/')[1];
  const lang = getLocale(candidate) ? candidate : 'it';
  const [, refresh] = useState(0);
  const [failed, setFailed] = useState(false);
  useEffect(() => { loadLocaleCatalog(lang).then(() => refresh(x => x + 1)).catch(() => setFailed(true)); }, [lang]);
  const t = (text: string) => translateText(lang, text);
  if (failed) return <div role="alert" lang={lang}>{localeLoadErrors[lang]}</div>;
  if (!isLocaleCatalogLoaded(lang)) return <div aria-busy="true" lang={lang}>{getLocale(lang)?.nativeName}…</div>;
  return (
    <div lang={lang} dir={getLocaleDirection(lang)} className="min-h-screen w-full flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md mx-4">
        <CardContent className="pt-6">
          <div className="flex mb-4 gap-2">
            <AlertCircle className="h-8 w-8 text-red-500" />
            <h1 className="text-2xl font-bold text-gray-900">
              404 · {t('Pagina non trovata')}
            </h1>
          </div>

          <p className="mt-4 text-sm text-gray-600">
            <Link href={withCampaignParams(publicPath(lang, 'home'))}>{t('Torna alla homepage')}</Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
