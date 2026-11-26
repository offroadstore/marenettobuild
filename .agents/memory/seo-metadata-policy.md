---
name: Multilingual SEO metadata policy
description: Separate historical provenance from localized search metadata and preserve server/client consistency.
---

Il titolare richiede metadati specifici per ogni pagina e lingua pubblica,
con il brand «Marenetto Build», non il dominio. Le etichette di navigazione
storiche non sono titoli SEO adeguati. Title, description e Open Graph devono
essere presenti nell'HTML iniziale, non soltanto dopo JavaScript.

**Why:** Il recupero fedele delle pagine aveva ripristinato anche titoli come
«Home» e «Startseite», prevalendo sui metadati descrittivi localizzati.
La fedeltà documentale dei corpi non impone di mantenere metadati SEO generici.

**How to apply:** Trattare i metadati di ricerca come un livello distinto dalla
provenienza storica e dalle revisioni delle traduzioni. Usare la stessa politica
per HTML statico, revisioni editoriali attive e navigazione client; preservare
le scelte SEO editoriali specifiche e non cambiare gli stati di approvazione
solo per correggere i metadati. Verificare le risposte HTTP senza JavaScript,
anche con archivio editoriale attivo, prima di consegnare.

Per le nuove sezioni, applicare gli stessi criteri richiesti dal titolare:
title con limiti bloccanti 30–65 caratteri Unicode e description 70–165;
target preferenziali rispettivamente 50–60 e 140–160, specifici,
unici e nativi; niente tagli meccanici, località dedotte o promesse non provate.
Gli obiettivi editoriali di parole ammettono eccezioni documentate, non testo
riempitivo o copie per città. I corpi legali autorizzati non si riscrivono
per raggiungere una lunghezza SEO.

**Why:** Il titolare richiede che le fasi future adottino queste regole quando
vengono integrate, senza attendere tali fasi per ottimizzare il sito corrente.

**How to apply:** Distinguere obiettivi editoriali da quote rigide e segnalare
le eccezioni. Preservare le scelte SEO esplicite del titolare nelle revisioni
attive; correggere la presentazione non concede nuove approvazioni né cambia
l'esclusione di bozze, ritiri o anteprime.

Google's FAQ rich result documentation changed in 2026: the requested FAQPage
documentation URL now leads to the Search updates notice stating that FAQ rich
results are no longer shown (May 2026 deprecation, subsequent documentation
removal). Visible, matching FAQPage semantics can remain useful, but do not
describe the old government/health eligibility exception as a current promise.

**Why:** The official source checked on 2026-11-25 contradicted the older
task reference, which described eligibility as merely limited.

**How to apply:** Recheck https://developers.google.com/search/updates before
making Google-specific FAQ display claims. Never promise rich results.
