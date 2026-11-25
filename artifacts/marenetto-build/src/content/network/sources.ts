import type { NetworkId } from './types';

export type NetworkSource = {
  title: string; url: string; checkedAt: string; scope: string;
  status: 'document-consulted' | 'historical-text-consulted' | 'http-head-200';
};
// Documentary consultation, not professional sign-off or proof of current
// legal completeness. The dated regional consolidation itself stops in 2025.
const building: NetworkSource = {
  title: 'Regione Siciliana — L.R. 16/2016, testo coordinato al 28 febbraio 2025',
  url: 'https://www.regione.sicilia.it/system/files/2025-04/lr%2016_2016%20agg%2028%20feb%202025.pdf',
  checkedAt: '2026-11-25', status: 'historical-text-consulted',
  scope: 'Testo coordinato alla L.R. 27/2024, vigente al 28 febbraio 2025. Le eventuali modifiche successive non verificate, i vincoli e la disciplina del singolo intervento sono da verificare con il tecnico incaricato.',
};
const systems: NetworkSource = {
  title: 'Gazzetta Ufficiale — D.M. 37/2008, pubblicazione originaria',
  url: 'https://www.gazzettaufficiale.it/eli/id/2008/03/12/008G0060/sg',
  checkedAt: '2026-11-25', status: 'historical-text-consulted',
  scope: 'Impianti negli edifici; il testo originario non attesta da solo tutte le modifiche vigenti.',
};
const water: NetworkSource = {
  title: 'Regione Siciliana — Genio Civile di Palermo, modulistica acque pubbliche',
  url: 'https://www.regione.sicilia.it/istituzioni/regione/strutture-regionali/genio-civile-palermo/modulistica-acque-pubbliche',
  checkedAt: '2026-11-25', status: 'document-consulted',
  scope: 'Pagina aggiornata il 4 novembre 2026: ricerca idrica, autorizzazioni e concessioni nella provincia di Palermo. Non prova il rilascio di titoli né la presenza di acqua nel sito.',
};
const systemsGuide: NetworkSource = {
  title: 'Camera di Commercio di Genova — Guida all’attività di impiantistica, 4 marzo 2026',
  url: 'https://www.ge.camcom.gov.it/it/avvia/attivita-con-requisiti/copy_of_imprese-di-impiantistica/guida-impiantistica-rev-4-3-2026.pdf',
  checkedAt: '2026-11-25', status: 'document-consulted',
  scope: 'Guida istituzionale consultata integralmente su attività, requisiti e dichiarazioni. Non verifica abilitazioni aziendali e non sostituisce il testo normativo vigente.',
};
const structuralRules: NetworkSource = {
  title: 'Gazzetta Ufficiale — D.M. 17 gennaio 2018, norme tecniche per le costruzioni',
  url: 'https://www.gazzettaufficiale.it/eli/id/2018/2/20/18A00716/sg',
  checkedAt: '2026-11-25', status: 'historical-text-consulted',
  scope: 'Consultato l’atto di approvazione, non l’intero allegato tecnico. Dimensionamento, materiali e ancoraggi restano verifiche del progetto.',
};
const notarialChecks: NetworkSource = {
  title: 'Consiglio Nazionale del Notariato — I controlli classici',
  url: 'https://www.notariato.it/it/casa/i-controlli-classici',
  checkedAt: '2026-11-25', status: 'document-consulted',
  scope: 'Controlli di legalità, identità, vincoli e documentazione: informazione generale, senza svolgere verifiche o consulenza sull’acquisto del lettore.',
};
const purchase: NetworkSource = {
  title: 'Agenzia delle Entrate — L’acquisto della casa, guida marzo 2024',
  url: 'https://www1.agenziaentrate.gov.it/web_app_entrate/guida_acquisto_casa.html/1000',
  checkedAt: '2026-11-25', status: 'historical-text-consulted',
  scope: 'Distinzione delle verifiche catastali e ipotecarie; nessuna aliquota o agevolazione viene trasferita al caso attuale.',
};
const heritage: NetworkSource = {
  title: 'Normattiva — D.Lgs. 42/2004, Codice dei beni culturali e del paesaggio',
  url: 'https://www.normattiva.it/eli/id/2004/02/24/004G0066/CONSOLIDATED/20260510',
  checkedAt: '2026-11-25', status: 'document-consulted',
  scope: 'Tutela del patrimonio; la consultazione del codice non verifica i vincoli di un immobile.',
};
const excavation: NetworkSource = {
  title: 'Normattiva — D.P.R. 120/2017, terre e rocce da scavo',
  url: 'https://www.normattiva.it/eli/stato/DECRETO_DEL_PRESIDENTE_DELLA_REPUBBLICA/2017/06/13/120/CONSOLIDATED',
  checkedAt: '2026-11-25', status: 'document-consulted',
  scope: 'Disciplina delle terre da scavo; include nota di abrogazione condizionata da valutare con la disciplina sopravvenuta.',
};
const cooling: NetworkSource = {
  title: 'ENEA — Raffrescamento, consigli d’uso',
  url: 'https://www.efficienzaenergetica.enea.it/servizi-per/cittadini/interventi-di-efficienza-e-risparmio-energetico-nelle-abitazioni/impianti/raffrescamento/consigli-d-uso.html',
  checkedAt: '2026-11-25', status: 'document-consulted',
  scope: 'Scelta, posizione e uso della climatizzazione; non è una verifica del progetto radiante.',
};
const radiant: NetworkSource = {
  title: 'UNI — UNI EN 1264-5:2021, sommario pubblico',
  url: 'https://store.uni.com/uni-en-1264-5-2021',
  checkedAt: '2026-11-25', status: 'document-consulted',
  scope: 'Ambito dei sistemi radianti ad acqua e applicazioni a pavimento/parete in raffrescamento; consultato il sommario, non il testo integrale a pagamento.',
};
const radiantHumidity: NetworkSource = {
  title: 'Q-RAD — Raffrescamento radiante: trattamento dell’aria',
  url: 'https://q-rad.it/newseventi/raffrescamento-radiante-trattamento-dellaria/',
  checkedAt: '2026-11-25', status: 'document-consulted',
  scope: 'Approfondimento del consorzio tecnico del 20 febbraio 2025 su umidità e condensa. Fonte tecnica, non autorità normativa né attestazione di affiliazione.',
};
const regionalUpdate: NetworkSource = {
  title: 'Regione Siciliana — Circolare 1/2025 del 28 maggio 2025',
  url: 'https://www.regione.sicilia.it/system/files/2025-05/Circolare%20n.%201_2025%20prot.%20n.%208325%20%20del%2028.05.2025.pdf',
  checkedAt: '2026-11-25', status: 'document-consulted',
  scope: 'Chiarimenti sul recepimento regionale delle modifiche edilizie; non costituisce conferma esaustiva della normativa successiva.',
};
const authorizedPartner: NetworkSource = {
  title: 'CefaluApartments.it',
  url: 'https://www.cefaluapartments.it/',
  checkedAt: '2026-11-25', status: 'http-head-200',
  scope: 'Recapito web del partner nominativamente autorizzato: HTTP 200 text/html, non verifica indipendente dei servizi dichiarati dal titolare.',
};
export function networkSourcesFor(id: NetworkId): NetworkSource[] {
  if (id === 'network') return [building, regionalUpdate, authorizedPartner];
  if (id === 'ground') return [building, water, excavation];
  if (id === 'buying') return [purchase, notarialChecks, building];
  if (id === 'comfort') return [systems, systemsGuide, building, cooling, radiant, radiantHumidity];
  if (id === 'systems') return [systems, systemsGuide, building];
  if (id === 'design') return [building, regionalUpdate, heritage];
  if (id === 'roofs') return [building, heritage, structuralRules];
  if (id === 'craft') return [building, structuralRules];
  if (id === 'stone' || id === 'outdoors') return [building, heritage];
  return [building];
}
