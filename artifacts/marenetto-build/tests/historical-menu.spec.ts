import { expect, test } from '@playwright/test';

const sourceMenus = [
  { locale: 'it', home: '/', archive: '/articoli/', categories: ['/general-contractor/', '/edilizia-e-ristrutturazioni/', '/bonus-edilizi-e-permessi/', '/cantieri-e-lavori/', '/outdoor-e-garden-design/', '/assistenza-e-pronto-intervento/'] },
  { locale: 'en', home: '/en/', archive: '/en/articles/', categories: ['/en/general-contractor/', '/en/construction-and-renovations/', '/en/building-bonuses-and-permits/', '/en/shipyards-and-construction/', '/en/outdoor-and-garden-design/', '/en/support-and-emergency-service/'] },
  { locale: 'fr', home: '/fr/', archive: '/fr/articles/', categories: ['/fr/entrepreneur-general/', '/fr/construction-et-renovations/', '/fr/bonus-de-construction-et-permis/', '/fr/chantiers-et-travaux/', '/fr/conception-d-exterieur-et-de-jardin/', '/fr/assistance-et-intervention-d-urgence/'] },
  { locale: 'de', home: '/de/', archive: '/de/artikel/', categories: ['/de/generalunternehmer/', '/de/bau-und-renovierung/', '/de/bau-boni-und-genehmigungen/', '/de/baustellen-und-arbeiten/', '/de/aussenbereich-und-gartengestaltung/', '/de/support-und-notfallhilfe/'] },
  { locale: 'es', home: '/es/', archive: '/es/articulos/', categories: ['/es/contratista-general/', '/es/construccion-y-renovaciones/', '/es/bonos-de-construccion-y-permisos/', '/es/obras-y-construcciones/', '/es/diseno-de-exteriores-y-jardines/', '/es/asistencia-y-servicio-de-emergencia/'] },
  { locale: 'nl', home: '/nl/', archive: '/nl/artikelen/', categories: ['/nl/aannemer/', '/nl/bouw-en-renovaties/', '/nl/bouwbonussen-en-vergunningen/', '/nl/scheepswerven-en-werken/', '/nl/buiten-en-tuinontwerp/', '/nl/ondersteuning-en-spoedhulp/'] },
  { locale: 'ru', home: '/ru/', archive: '/ru/stati/', categories: ['/ru/generalnyj-podrjadchik/', '/ru/stroitelstvo-i-remont/', '/ru/stroitelnye-bonusy-i-razreshenija/', '/ru/stroitelnye-ploschadki-i-raboty/', '/ru/dizajn-ulicy-i-sada/', '/ru/podderzhka-i-ekstrennoe-reagirovanie/'] },
  { locale: 'pt', home: '/pt/', archive: '/pt/artigos/', categories: ['/pt/empreiteiro-geral/', '/pt/construcao-e-reformas/', '/pt/bonus-de-construcao-e-licencas/', '/pt/construcoes-e-obras/', '/pt/design-para-exterior-e-jardim/', '/pt/assistencia-e-atendimento-imediato/'] },
  { locale: 'pl', home: '/pl/', archive: '/pl/artykuly/', categories: ['/pl/glowny-wykonawca/', '/pl/budownictwo-i-remonty/', '/pl/bonus-budowlane-i-zezwolenia/', '/pl/budowy-i-prace/', '/pl/projektowanie-przestrzeni-zewnetrznych-i-ogrodow/', '/pl/wsparcie-i-szybka-interwencja/'] },
];

test('desktop menus preserve the original article and six category URLs in nine locales', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const menu of sourceMenus) {
    const response = await page.goto(menu.home);
    expect(response?.status(), menu.locale).toBe(200);
    const archive = page.getByTestId('nav-articles');
    await expect(archive, menu.locale).toHaveAttribute('href', menu.archive);
    const disclosure = page.getByTestId('button-desktop-article-categories');
    await disclosure.click();
    await expect(disclosure).toHaveAttribute('aria-expanded', 'true');

    const categories = page.locator(`#article-categories-desktop-${menu.locale} a`);
    await expect(categories).toHaveCount(6);
    for (let index = 0; index < menu.categories.length; index += 1) {
      await expect(categories.nth(index)).toHaveAttribute('href', menu.categories[index]);
    }
    const firstCategoryResponse = await page.goto(menu.categories[0]);
    expect(firstCategoryResponse?.status(), menu.categories[0]).toBe(200);
    await expect(page.locator('main h1').first()).toBeVisible();
  }
});

test('mobile article submenu can be opened and its historic links remain visible', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await page.getByTestId('button-menu').click();
  await expect(page.getByTestId('mobile-nav-articles')).toBeVisible();
  const disclosure = page.getByTestId('button-mobile-article-categories');
  await disclosure.click();
  await expect(disclosure).toHaveAttribute('aria-expanded', 'true');
  const categories = page.locator('#article-categories-mobile-it a');
  await expect(categories).toHaveCount(6);
  await expect(categories.first()).toHaveAttribute('href', '/general-contractor/');
});
