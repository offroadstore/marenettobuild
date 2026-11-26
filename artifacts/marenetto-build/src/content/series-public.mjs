/** Public rendering helpers contain no draft text or private review dossier. */
export const seriesCardLabels = {
  it:['Edizione attiva','Leggi l’articolo'], en:['Active edition','Read the article'],
  de:['Aktuelle Fassung','Artikel lesen'], nl:['Actieve versie','Lees het artikel'],
  fr:['Édition active','Lire l’article'], es:['Edición activa','Leer el artículo'],
  pt:['Edição ativa','Ler o artigo'], pl:['Aktywna wersja','Przeczytaj artykuł'],
  ru:['Опубликованная версия','Читать статью'], sv:['Aktuell version','Läs artikeln'],
  no:['Aktiv versjon','Les artikkelen'], da:['Aktiv version','Læs artiklen'],
};
export const seriesLabels = {
  it: ['Costruire a Cefalù e nelle Madonie', 'Video non ancora disponibile', 'Preferenze media esterni', 'Per guardare il video, abilita i media esterni nelle preferenze cookie.', 'Lingua parlata', 'Trascrizione', 'Domande frequenti', 'va verificato con il tecnico sul caso specifico'],
  en: ['Building in Cefalù and the Madonie', 'Video not yet available', 'External media preferences', 'To watch this video, enable external media in cookie preferences.', 'Spoken language', 'Transcript', 'Frequently asked questions', 'this must be checked with a qualified professional for the specific case'],
  de: ['Bauen in Cefalù und den Madonie', 'Video noch nicht verfügbar', 'Einstellungen für externe Medien', 'Aktivieren Sie externe Medien in den Cookie-Einstellungen, um das Video anzusehen.', 'Gesprochene Sprache', 'Transkript', 'Häufige Fragen', 'dies muss im konkreten Einzelfall mit einer qualifizierten Fachperson geprüft werden'],
  nl: ['Bouwen in Cefalù en de Madonie', 'Video nog niet beschikbaar', 'Voorkeuren voor externe media', 'Schakel externe media in de cookievoorkeuren in om deze video te bekijken.', 'Gesproken taal', 'Transcriptie', 'Veelgestelde vragen', 'dit moet voor het specifieke geval met een bevoegde deskundige worden nagegaan'],
  fr: ['Construire à Cefalù et dans les Madonie', 'Vidéo pas encore disponible', 'Préférences des médias externes', 'Pour regarder cette vidéo, activez les médias externes dans les préférences des cookies.', 'Langue parlée', 'Transcription', 'Questions fréquentes', 'cela doit être vérifié avec un professionnel compétent pour le cas particulier'],
  es: ['Construir en Cefalù y las Madonie', 'Vídeo aún no disponible', 'Preferencias de medios externos', 'Para ver este vídeo, activa los medios externos en las preferencias de cookies.', 'Idioma hablado', 'Transcripción', 'Preguntas frecuentes', 'debe verificarse con un técnico competente para el caso concreto'],
  pt: ['Construir em Cefalù e nas Madonie', 'Vídeo ainda não disponível', 'Preferências de conteúdos externos', 'Para ver este vídeo, ative os conteúdos externos nas preferências de cookies.', 'Língua falada', 'Transcrição', 'Perguntas frequentes', 'deve ser verificado com um técnico competente para o caso específico'],
  pl: ['Budowa w Cefalù i Madonie', 'Film nie jest jeszcze dostępny', 'Preferencje mediów zewnętrznych', 'Aby obejrzeć film, włącz media zewnętrzne w ustawieniach plików cookie.', 'Język nagrania', 'Transkrypcja', 'Najczęstsze pytania', 'należy to sprawdzić z uprawnionym specjalistą w odniesieniu do konkretnego przypadku'],
  ru: ['Строительство в Чефалу и Мадоние', 'Видео пока недоступно', 'Настройки внешних медиа', 'Чтобы посмотреть видео, разрешите внешние медиа в настройках файлов cookie.', 'Язык видео', 'Расшифровка', 'Частые вопросы', 'это необходимо проверить с компетентным специалистом применительно к конкретному случаю'],
  sv: ['Bygga i Cefalù och Madonie', 'Videon är ännu inte tillgänglig', 'Inställningar för externa medier', 'Aktivera externa medier i cookieinställningarna för att se videon.', 'Talat språk', 'Transkription', 'Vanliga frågor', 'detta måste kontrolleras med en behörig fackperson i det enskilda fallet'],
  no: ['Bygge i Cefalù og Madonie', 'Videoen er ennå ikke tilgjengelig', 'Innstillinger for eksterne medier', 'Aktiver eksterne medier i innstillingene for informasjonskapsler for å se videoen.', 'Talespråk', 'Transkripsjon', 'Vanlige spørsmål', 'dette må avklares med en kvalifisert fagperson i det konkrete tilfellet'],
  da: ['Bygge i Cefalù og Madonie', 'Videoen er endnu ikke tilgængelig', 'Indstillinger for eksterne medier', 'Aktivér eksterne medier i cookieindstillingerne for at se videoen.', 'Talt sprog', 'Transskription', 'Ofte stillede spørgsmål', 'dette skal afklares med en kvalificeret fagperson i det konkrete tilfælde'],
};
export const sourceLabels = {it:'Fonti',en:'Sources',de:'Quellen',nl:'Bronnen',fr:'Sources',es:'Fuentes',pt:'Fontes',pl:'Źródła',ru:'Источники',sv:'Källor',no:'Kilder',da:'Kilder'};
export function readyVideo(video) {
  return Boolean(video && /^[A-Za-z0-9_-]{11}$/.test(video.youtubeId) &&
    video.title?.trim() && video.description?.trim() && video.author?.trim() && video.rights?.trim() &&
    /^\/media\/[\w/.-]+$/.test(video.thumbnail) && !video.thumbnail.includes('..') &&
    /^\d{4}-\d{2}-\d{2}$/.test(video.uploadDate) &&
    Number.isFinite(Date.parse(video.uploadDate)) && new Date(video.uploadDate).toISOString().slice(0, 10) === video.uploadDate &&
    video.uploadDate <= new Date().toISOString().slice(0, 10) &&
    /^[a-z]{2}$/.test(video.spokenLanguage) && /^[a-z]{2}$/.test(video.transcriptLanguage) &&
    video.transcript?.trim() && video.transcriptReviewed === true);
}
export const embedURL = video => `https://www.youtube-nocookie.com/embed/${video.youtubeId}`;
export function seriesStructuredData(edition, origin) {
  const content = edition.content, guide = content?.guide;
  if (!guide || edition.revisionId === 'withdrawn') return [];
  const canonical = new URL(edition.path, origin).href;
  const graph = [{
    '@type': 'Article', headline: content.title, description: content.summary,
    inLanguage: content.contentLanguage, mainEntityOfPage: canonical,
    author: { '@type': 'Organization', name: 'Marenetto Build' },
    publisher: { '@type': 'Organization', name: 'Marenetto Build' },
    isPartOf: { '@type': 'CreativeWorkSeries', name: seriesLabels[edition.locale]?.[0] ?? seriesLabels.it[0] },
    ...(content.image ? {image: new URL(content.image, origin).href} : {}),
  }];
  if (guide.faq?.length) graph.push({
    '@type': 'FAQPage', inLanguage: content.contentLanguage,
    mainEntity: guide.faq.map(faq => ({'@type': 'Question', name: faq.question, acceptedAnswer: {'@type': 'Answer', text: faq.answer}})),
  });
  if (readyVideo(guide.video)) {
    const video = guide.video;
    graph.push({
      '@type': 'VideoObject', name: video.title, description: video.description,
      thumbnailUrl: new URL(video.thumbnail, origin).href, uploadDate: video.uploadDate,
      embedUrl: embedURL(video), inLanguage: video.spokenLanguage,
      ...(video.duration ? {duration: video.duration} : {}),
      transcript: video.transcript, creditText: video.author,
    });
  }
  return graph;
}
