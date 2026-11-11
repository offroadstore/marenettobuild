# Che cosa rappresentano i 102 URL con HTTP 429

I 102 sono le risposte finali 429 nell’acquisizione; non sono 102 articoli mancanti. Tutti mostravano il blocco anti-bot, senza titolo editoriale o H1. Le richieste Playwright sono state inviate solo all’anteprima locale: zero richieste al sito storico.

| Provenienza | URL |
|---|---:|
| configured-redirect-not-proof-of-history | 89 |
| content-link | 4 |
| public-cms-feed | 9 |

Catena HTTP iniziale della fonte: {"301":4,"429":98}; status finale: {"429":102}. Titoli del challenge: {"Azione necessaria":102}. Retry-After presente su 1 risposte.

## Esplorazione del routing locale

Playwright ha verificato 102 percorsi. Status della nuova anteprima: {"200":92,"404":1,"503":9}. L’app ha portato 89 URL a un percorso diverso dopo il rendering; 3 hanno cambiato solo slash finale. I percorsi cambiati dall’app non sono prova di redirect HTTP né di alias storico accertato.

Gli 89 candidati provenienti dalle rotte configurate comprendono 72 URL /{lingua}/articles/... in otto lingue (nove slug per lingua), otto /{lingua}/contact/, otto /{lingua}/how-we-work/ e /come-lavoriamo/. L’anteprima reindirizza gli articoli verso slug localizzati e i contatti/pagine lavoro verso le pagine attuali; il sito storico non ha potuto confermare che questi percorsi esistessero. Non vanno contati come 89 pagine storiche acquisite.

I nove feed /{lingua}/m/blog/feed/ (incluso quello senza prefisso lingua) ricevono 503 in anteprima perché i contenuti del feed restano in attesa di conferma.

Dei quattro link trovati nei contenuti, /contatti, /pt e /ru restituiscono una pagina in anteprima (le due homepage mostrano contenuti in portoghese e russo); /contatos restituisce 404. Per quest’ultimo la risposta 429 originale non consente di stabilire se sia un refuso o una pagina storica reale.

## Righe per URL

| Percorso fonte | Provenienza | Status anteprima | Percorso dopo il rendering | Titolo |
|---|---|---:|---|---|
| /come-lavoriamo/ | about alias candidate | 200 | /chi-siamo/ | Chi siamo | marenettobuild.com |
| /contatos | content-link | 404 | /contatos | Pagina non trovata | Marenetto Build |
| /contatti | content-link | 200 | /contatti/ | Contatti - Marenetto Build |
| /de/articles/cappotto-termico-vs-intonaco-termico-cefalu/ | article alias candidate | 200 | /de/waermedaemmung-vs-waermedaermputz-die-beste-wahl-fuer-sizilien/ | Wärmedämmung vs Wärmedärmputz: Die beste Wahl für Sizilien | marenettobuild.com |
| /de/articles/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali/ | article alias candidate | 200 | /de/hauskauf-und-renovierung-in-cefalu-technischer-leitfaden-zu-den-5-wichtigsten-pruefungen/ | Hauskauf und Renovierung in Cefalù: Technischer Leitfaden zu den 5 wichtigsten Prüfungen | marenettobuild.com |
| /de/articles/garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto/ | article alias candidate | 200 | /de/10-jahre-bauarbeiten-garantie-die-marenetto-zehnjahresversicherung/ | 10 Jahre Bauarbeiten-Garantie: Die Marenetto Zehnjahresversicherung | marenettobuild.com |
| /de/articles/garden-design-esclusivo/ | article alias candidate | 200 | /de/exklusives-gartendesign/ | Exklusives Gartendesign | marenettobuild.com |
| /de/articles/gestione-manutenzione-immobile/ | article alias candidate | 200 | /de/gebaeudemanagement/ | Gebäudemanagement | marenettobuild.com |
| /de/articles/impresa-edile-a-cefalu/ | article alias candidate | 200 | /de/bauunternehmen-in-cefalu-wir-verwandeln-ihre-vision-in-wirklichkeit/ | Bauunternehmen in Cefalù: Wir verwandeln Ihre Vision in Wirklichkeit | marenettobuild.com |
| /de/articles/pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete/ | article alias candidate | 200 | /de/isoplam-aussenboeden-umfassender-leitfaden-zu-stempelbeton-und-skyconcrete/ | Isoplam Außenböden: Umfassender Leitfaden zu Stempelbeton und Skyconcrete | marenettobuild.com |
| /de/articles/ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni/ | article alias candidate | 200 | /de/suche-nach-wassereintritt-und-feuchtigkeit-wie-man-ohne-abrissmassnahmen-vorgeht/ | Suche nach Wassereintritt und Feuchtigkeit: Wie man ohne Abrissmaßnahmen vorgeht | marenettobuild.com |
| /de/articles/ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam/ | article alias candidate | 200 | /de/sanieren-ohne-abriss-der-umfassende-leitfaden-fuer-microverlayr-isoplam-mikrozement/ | Sanieren Ohne Abriss: Der Umfassende Leitfaden für Microverlay® Isoplam Mikrozement | marenettobuild.com |
| /de/contact/ | contact alias candidate | 200 | /de/contatti/ | Contatti | marenettobuild.com |
| /de/how-we-work/ | about alias candidate | 200 | /de/chi-siamo/ | Chi siamo | marenettobuild.com |
| /de/m/blog/feed/ | feed | 503 | /de/m/blog/feed/ | nessun titolo |
| /en/articles/cappotto-termico-vs-intonaco-termico-cefalu/ | article alias candidate | 200 | /en/thermal-insulation-vs-thermal-plaster-the-best-choice-for-sicily/ | Thermal Insulation vs Thermal Plaster: The Best Choice for Sicily | marenettobuild.com |
| /en/articles/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali/ | article alias candidate | 200 | /en/buying-and-renovating-a-house-in-cefalu-a-technical-guide-to-the-5-essential-checks/ | Buying and Renovating a House in Cefalù: A Technical Guide to the 5 Essential Checks | marenettobuild.com |
| /en/articles/garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto/ | article alias candidate | 200 | /en/10-year-warranty-on-construction-work-the-marenetto-decennial-insurance-policy/ | 10-Year Warranty on Construction Work: The Marenetto Decennial Insurance Policy | marenettobuild.com |
| /en/articles/garden-design-esclusivo/ | article alias candidate | 200 | /en/exclusive-garden-design/ | Exclusive Garden Design | marenettobuild.com |
| /en/articles/gestione-manutenzione-immobile/ | article alias candidate | 200 | /en/property-maintenance-management/ | Property Maintenance Management | marenettobuild.com |
| /en/articles/impresa-edile-a-cefalu/ | article alias candidate | 200 | /en/construction-company-in-cefalu-turning-your-vision-into-reality/ | Construction Company in Cefalù: Turning Your Vision into Reality | marenettobuild.com |
| /en/articles/pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete/ | article alias candidate | 200 | /en/isoplam-outdoor-floors-complete-guide-to-stamped-concrete-and-skyconcrete/ | Isoplam Outdoor Floors: Complete Guide to Stamped Concrete and Skyconcrete | marenettobuild.com |
| /en/articles/ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni/ | article alias candidate | 200 | /en/water-and-moisture-leak-detection-how-to-address-it-without-demolition/ | Water and Moisture Leak Detection: How to Address It Without Demolition | marenettobuild.com |
| /en/articles/ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam/ | article alias candidate | 200 | /en/renovate-without-demolition-the-complete-guide-to-microverlayr-isoplam-microcement/ | Renovate Without Demolition: The Complete Guide to Microverlay® Isoplam Microcement | marenettobuild.com |
| /en/contact/ | contact alias candidate | 200 | /en/contatti/ | Contatti | marenettobuild.com |
| /en/how-we-work/ | about alias candidate | 200 | /en/chi-siamo/ | Chi siamo | marenettobuild.com |
| /en/m/blog/feed/ | feed | 503 | /en/m/blog/feed/ | nessun titolo |
| /es/articles/cappotto-termico-vs-intonaco-termico-cefalu/ | article alias candidate | 200 | /es/aislamiento-termico-exterior-vs-revoque-termico-la-mejor-opcion-para-sicilia/ | Aislamiento Térmico Exterior vs Revoque Térmico: La Mejor Opción para Sicilia | marenettobuild.com |
| /es/articles/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali/ | article alias candidate | 200 | /es/comprar-y-renovar-casa-en-cefalu-guia-tecnica-de-los-5-controles-esenciales/ | Comprar y Renovar Casa en Cefalù: Guía Técnica de los 5 Controles Esenciales | marenettobuild.com |
| /es/articles/garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto/ | article alias candidate | 200 | /es/garantia-de-10-anos-en-trabajos-de-construccion-la-poliza-decenal-marenetto/ | Garantía de 10 Años en Trabajos de Construcción: La Póliza Decenal Marenetto | marenettobuild.com |
| /es/articles/garden-design-esclusivo/ | article alias candidate | 200 | /es/diseno-de-jardines-exclusivo/ | Diseño de Jardines Exclusivo | marenettobuild.com |
| /es/articles/gestione-manutenzione-immobile/ | article alias candidate | 200 | /es/gestion-del-mantenimiento-de-la-propiedad/ | Gestión del Mantenimiento de la Propiedad | marenettobuild.com |
| /es/articles/impresa-edile-a-cefalu/ | article alias candidate | 200 | /es/empresa-constructora-en-cefalu-convertimos-tu-vision-en-realidad/ | Empresa Constructora en Cefalù: Convertimos tu Visión en Realidad | marenettobuild.com |
| /es/articles/pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete/ | article alias candidate | 200 | /es/suelos-exteriores-isoplam-guia-completa-de-hormigon-impreso-y-skyconcrete/ | Suelos Exteriores Isoplam: Guía Completa de Hormigón Impreso y Skyconcrete | marenettobuild.com |
| /es/articles/ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni/ | article alias candidate | 200 | /es/deteccion-de-filtraciones-de-agua-y-humedad-como-actuar-sin-realizar-demoliciones/ | Detección de Filtraciones de Agua y Humedad: Cómo actuar sin realizar demoliciones | marenettobuild.com |
| /es/articles/ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam/ | article alias candidate | 200 | /es/reformar-sin-derribar-la-guia-completa-del-microcemento-microverlayr-isoplam/ | Reformar Sin Derribar: La Guía Completa del Microcemento Microverlay® Isoplam | marenettobuild.com |
| /es/contact/ | contact alias candidate | 200 | /es/contatti/ | Contatti | marenettobuild.com |
| /es/how-we-work/ | about alias candidate | 200 | /es/chi-siamo/ | Chi siamo | marenettobuild.com |
| /es/m/blog/feed/ | feed | 503 | /es/m/blog/feed/ | nessun titolo |
| /fr/articles/cappotto-termico-vs-intonaco-termico-cefalu/ | article alias candidate | 200 | /fr/isolation-thermique-par-exterieur-vs-enduit-thermique-le-meilleur-choix-pour-la-sicile/ | Isolation Thermique par Extérieur vs Enduit Thermique : Le Meilleur Choix pour la Sicile | marenettobuild.com |
| /fr/articles/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali/ | article alias candidate | 200 | /fr/acheter-et-renover-une-maison-a-cefalu-guide-technique-des-5-controles-essentiels/ | Acheter et Rénover une Maison à Cefalù : Guide Technique des 5 Contrôles Essentiels | marenettobuild.com |
| /fr/articles/garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto/ | article alias candidate | 200 | /fr/garantie-decennale-sur-les-travaux-de-construction-la-police-decennale-marenetto/ | Garantie décennale sur les travaux de construction : La police décennale Marenetto | marenettobuild.com |
| /fr/articles/garden-design-esclusivo/ | article alias candidate | 200 | /fr/conception-de-jardin-exclusive/ | Conception de Jardin Exclusive | marenettobuild.com |
| /fr/articles/gestione-manutenzione-immobile/ | article alias candidate | 200 | /fr/gestion-de-la-maintenance-immobiliere/ | Gestion de la maintenance immobilière | marenettobuild.com |
| /fr/articles/impresa-edile-a-cefalu/ | article alias candidate | 200 | /fr/entreprise-de-construction-a-cefalu-nous-donnons-vie-a-votre-vision/ | Entreprise de Construction à Cefalù : Nous donnons vie à votre vision | marenettobuild.com |
| /fr/articles/pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete/ | article alias candidate | 200 | /fr/revetements-exterieurs-isoplam-guide-complet-du-beton-imprime-et-skyconcrete/ | Revêtements Extérieurs Isoplam : Guide Complet du Béton Imprimé et Skyconcrete | marenettobuild.com |
| /fr/articles/ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni/ | article alias candidate | 200 | /fr/recherche-de-fuites-d-eau-et-d-humidite-comment-agir-sans-demolir/ | Recherche de fuites d'eau et d'humidité : comment agir sans démolir | marenettobuild.com |
| /fr/articles/ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam/ | article alias candidate | 200 | /fr/renover-sans-demolir-le-guide-complet-du-microciment-microverlayr-isoplam/ | Rénover Sans Démolir : Le Guide Complet du Microciment Microverlay® Isoplam | marenettobuild.com |
| /fr/contact/ | contact alias candidate | 200 | /fr/contatti/ | Contatti | marenettobuild.com |
| /fr/how-we-work/ | about alias candidate | 200 | /fr/chi-siamo/ | Chi siamo | marenettobuild.com |
| /fr/m/blog/feed/ | feed | 503 | /fr/m/blog/feed/ | nessun titolo |
| /m/blog/feed/ | feed | 503 | /m/blog/feed/ | nessun titolo |
| /nl/articles/cappotto-termico-vs-intonaco-termico-cefalu/ | article alias candidate | 200 | /nl/thermische-isolatie-vs-thermische-pleister-de-beste-keuze-voor-sicilie/ | Thermische Isolatie vs Thermische Pleister: De Beste Keuze voor Sicilië | marenettobuild.com |
| /nl/articles/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali/ | article alias candidate | 200 | /nl/een-huis-kopen-en-renoveren-in-cefalu-technische-gids-voor-de-5-essentiele-controles/ | Een Huis Kopen en Renoveren in Cefalù: Technische Gids voor de 5 Essentiële Controles | marenettobuild.com |
| /nl/articles/garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto/ | article alias candidate | 200 | /nl/10-jaar-garantie-op-bouwwerkzaamheden-de-decennialijnse-polis-van-marenetto/ | 10 Jaar Garantie op Bouwwerkzaamheden: De Decennialijnse Polis van Marenetto | marenettobuild.com |
| /nl/articles/garden-design-esclusivo/ | article alias candidate | 200 | /nl/exclusief-tuinontwerp/ | Exclusief Tuinontwerp | marenettobuild.com |
| /nl/articles/gestione-manutenzione-immobile/ | article alias candidate | 200 | /nl/gebouwonderhoud-beheer/ | Gebouwonderhoud Beheer | marenettobuild.com |
| /nl/articles/impresa-edile-a-cefalu/ | article alias candidate | 200 | /nl/bouwbedrijf-in-cefalu-wij-brengen-jouw-visie-tot-leven/ | Bouwbedrijf in Cefalù: Wij Brengen Jouw Visie tot Leven | marenettobuild.com |
| /nl/articles/pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete/ | article alias candidate | 200 | /nl/isoplam-buitenvloeren-uitgebreide-gids-voor-gestempeld-beton-en-skyconcrete/ | Isoplam Buitenvloeren: Uitgebreide Gids voor Gestempeld Beton en Skyconcrete | marenettobuild.com |
| /nl/articles/ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni/ | article alias candidate | 200 | /nl/opsporing-van-water-en-vochtinfiltraties-hoe-te-handelen-zonder-sloopwerkzaamheden/ | Opsporing van water- en vochtinfiltraties: hoe te handelen zonder sloopwerkzaamheden | marenettobuild.com |
| /nl/articles/ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam/ | article alias candidate | 200 | /nl/renoveren-zonder-slopen-de-complete-gids-voor-microverlayr-isoplam-microcement/ | Renoveren zonder slopen: De complete gids voor Microverlay® Isoplam microcement | marenettobuild.com |
| /nl/contact/ | contact alias candidate | 200 | /nl/contatti/ | Contatti | marenettobuild.com |
| /nl/how-we-work/ | about alias candidate | 200 | /nl/chi-siamo/ | Chi siamo | marenettobuild.com |
| /nl/m/blog/feed/ | feed | 503 | /nl/m/blog/feed/ | nessun titolo |
| /pl/articles/cappotto-termico-vs-intonaco-termico-cefalu/ | article alias candidate | 200 | /pl/ocieplenie-zewnetrzne-kontra-tynk-termiczny-najlepszy-wybor-dla-sycylii/ | Ocieplenie zewnętrzne kontra tynk termiczny: najlepszy wybór dla Sycylii | marenettobuild.com |
| /pl/articles/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali/ | article alias candidate | 200 | /pl/kupno-i-remont-domu-w-cefalu-techniczny-przewodnik-po-5-kluczowych-kontrolach/ | Kupno i remont domu w Cefalù: techniczny przewodnik po 5 kluczowych kontrolach | marenettobuild.com |
| /pl/articles/garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto/ | article alias candidate | 200 | /pl/10-letnia-gwarancja-na-prace-budowlane-polisa-dekenalna-marenetto/ | 10-letnia Gwarancja na Prace Budowlane: Polisa Dekenalna Marenetto | marenettobuild.com |
| /pl/articles/garden-design-esclusivo/ | article alias candidate | 200 | /pl/ekskluzywny-projekt-ogrodu/ | Ekskluzywny Projekt Ogrodu | marenettobuild.com |
| /pl/articles/gestione-manutenzione-immobile/ | article alias candidate | 200 | /pl/zarzadzanie-konserwacja-nieruchomosci/ | Zarządzanie konserwacją nieruchomości | marenettobuild.com |
| /pl/articles/impresa-edile-a-cefalu/ | article alias candidate | 200 | /pl/firma-budowlana-w-cefalu-przeksztalcamy-twoja-wizje-w-rzeczywistosc/ | Firma Budowlana w Cefalù: Przekształcamy Twoją Wizję w Rzeczywistość | marenettobuild.com |
| /pl/articles/pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete/ | article alias candidate | 200 | /pl/podlogi-zewnetrzne-isoplam-kompletny-przewodnik-po-betonie-wzorcowym-i-skyconcrete/ | Podłogi Zewnętrzne Isoplam: Kompletny Przewodnik po Betonie Wzorcowym i Skyconcrete | marenettobuild.com |
| /pl/articles/ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni/ | article alias candidate | 200 | /pl/wykrywanie-przeciekow-wody-i-wilgoci-jak-dzialac-bez-koniecznosci-rozbiorek/ | Wykrywanie Przecieków Wody i Wilgoci: Jak działać bez konieczności rozbiórek | marenettobuild.com |
| /pl/articles/ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam/ | article alias candidate | 200 | /pl/renowacja-bez-rozbiorki-kompletny-przewodnik-po-mikrocemencie-microverlayr-isoplam/ | Renowacja Bez Rozbiórki: Kompletny Przewodnik po Mikrocemencie Microverlay® Isoplam | marenettobuild.com |
| /pl/contact/ | contact alias candidate | 200 | /pl/contatti/ | Contatti | marenettobuild.com |
| /pl/how-we-work/ | about alias candidate | 200 | /pl/chi-siamo/ | Chi siamo | marenettobuild.com |
| /pl/m/blog/feed/ | feed | 503 | /pl/m/blog/feed/ | nessun titolo |
| /pt | content-link | 200 | /pt/ | Início | marenettobuild.com |
| /pt/articles/cappotto-termico-vs-intonaco-termico-cefalu/ | article alias candidate | 200 | /pt/isolamento-termico-exterior-vs-revestimento-termico-a-melhor-escolha-para-a-sicilia/ | Isolamento Térmico Exterior vs Revestimento Térmico: A Melhor Escolha para a Sicília | marenettobuild.com |
| /pt/articles/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali/ | article alias candidate | 200 | /pt/comprar-e-reformar-casa-em-cefalu-guia-tecnica-dos-5-controles-essenciais/ | Comprar e Reformar Casa em Cefalù: Guia Técnica dos 5 Controles Essenciais | marenettobuild.com |
| /pt/articles/garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto/ | article alias candidate | 200 | /pt/garantia-de-10-anos-para-obras-de-construcao-a-apolice-decenal-marenetto/ | Garantia de 10 Anos para Obras de Construção: A Apólice Decenal Marenetto | marenettobuild.com |
| /pt/articles/garden-design-esclusivo/ | article alias candidate | 200 | /pt/design-de-jardim-exclusivo/ | Design de Jardim Exclusivo | marenettobuild.com |
| /pt/articles/gestione-manutenzione-immobile/ | article alias candidate | 200 | /pt/gestao-de-manutencao-do-imovel/ | Gestão de Manutenção do Imóvel | marenettobuild.com |
| /pt/articles/impresa-edile-a-cefalu/ | article alias candidate | 200 | /pt/empresa-de-construcao-em-cefalu-transformamos-a-sua-visao-em-realidade/ | Empresa de Construção em Cefalù: Transformamos a sua Visão em Realidade | marenettobuild.com |
| /pt/articles/pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete/ | article alias candidate | 200 | /pt/pavimentos-externos-isoplam-guia-completo-de-concreto-estampado-e-skyconcrete/ | Pavimentos Externos Isoplam: Guia Completo de Concreto Estampado e Skyconcrete | marenettobuild.com |
| /pt/articles/ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni/ | article alias candidate | 200 | /pt/deteccao-de-infiltracoes-e-umidade-como-agir-sem-demolicoes/ | Detecção de Infiltrações e Umidade: Como agir sem demolições | marenettobuild.com |
| /pt/articles/ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam/ | article alias candidate | 200 | /pt/reformar-sem-demolir-o-guia-completo-do-microcimento-microverlayr-isoplam/ | Reformar Sem Demolir: O Guia Completo do Microcimento Microverlay® Isoplam | marenettobuild.com |
| /pt/contact/ | contact alias candidate | 200 | /pt/contatti/ | Contatti | marenettobuild.com |
| /pt/how-we-work/ | about alias candidate | 200 | /pt/chi-siamo/ | Chi siamo | marenettobuild.com |
| /pt/m/blog/feed/ | feed | 503 | /pt/m/blog/feed/ | nessun titolo |
| /ru | content-link | 200 | /ru/ | Главная | marenettobuild.com |
| /ru/articles/cappotto-termico-vs-intonaco-termico-cefalu/ | article alias candidate | 200 | /ru/teplyj-fasad-protiv-teploizoljacionnoj-shtukaturki-luchshij-vybor-dlja-sicilii/ | Теплый фасад против теплоизоляционной штукатурки: Лучший выбор для Сицилии | marenettobuild.com |
| /ru/articles/comprare-e-ristrutturare-casa-a-cefalu-guida-tecnica-ai-5-controlli-essenziali/ | article alias candidate | 200 | /ru/pokupka-i-remont-doma-v-chefalu-tehnicheskoe-rukovodstvo-po-5-osnovnym-proverkam/ | Покупка и ремонт дома в Чефалу: техническое руководство по 5 основным проверкам | marenettobuild.com |
| /ru/articles/garanzia-10-anni-sui-lavori-edili-la-polizza-decennale-marenetto/ | article alias candidate | 200 | /ru/10-letnjaja-garantija-na-stroitelnye-raboty-desjatiletnij-polis-marenetto/ | 10-летняя гарантия на строительные работы: Десятилетний полис Marenetto | marenettobuild.com |
| /ru/articles/garden-design-esclusivo/ | article alias candidate | 200 | /ru/ekskljuzivnyj-dizajn-sada/ | Эксклюзивный дизайн сада | marenettobuild.com |
| /ru/articles/gestione-manutenzione-immobile/ | article alias candidate | 200 | /ru/upravlenie-tehnicheskim-obsluzhivaniem-zdanija/ | Управление техническим обслуживанием здания | marenettobuild.com |
| /ru/articles/impresa-edile-a-cefalu/ | article alias candidate | 200 | /ru/stroitelnaja-kompanija-v-chefalu-prevraschaem-vashi-idei-v-realnost/ | Строительная компания в Чефалу: Превращаем ваши идеи в реальность | marenettobuild.com |
| /ru/articles/pavimenti-esterni-isoplam-guida-completa-a-cemento-stampato-e-skyconcrete/ | article alias candidate | 200 | /ru/naruzhnye-pokrytija-isoplam-polnoe-rukovodstvo-po-shtampovannomu-betonu-i-skyconcrete/ | Наружные покрытия Isoplam: Полное руководство по штампованному бетону и Skyconcrete | marenettobuild.com |
| /ru/articles/ricerca-infiltrazioni-d-acqua-e-umidita-come-intervenire-senza-demolizioni/ | article alias candidate | 200 | /ru/poisk-protechek-vody-i-vlazhnosti-kak-ustranit-bez-snosa/ | Поиск протечек воды и влажности: как устранить без сноса | marenettobuild.com |
| /ru/articles/ristrutturare-senza-demolire-la-guida-completa-al-microcemento-microverlay-isoplam/ | article alias candidate | 200 | /ru/remont-bez-snosa-polnoe-rukovodstvo-po-mikrocementu-microverlayr-isoplam/ | Ремонт без сноса: Полное руководство по микроцементу Microverlay® Isoplam | marenettobuild.com |
| /ru/contact/ | contact alias candidate | 200 | /ru/contatti/ | Contatti | marenettobuild.com |
| /ru/how-we-work/ | about alias candidate | 200 | /ru/chi-siamo/ | Chi siamo | marenettobuild.com |
| /ru/m/blog/feed/ | feed | 503 | /ru/m/blog/feed/ | nessun titolo |

Il CSV e il JSON allegati contengono anche lingua, canonical, H1, metadati noindex, link, immagini, errori e catene di risposta. Il sito storico non è stato modificato.