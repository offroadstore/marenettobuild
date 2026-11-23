---
name: Budget del monitoraggio della visibilità IA
description: Decisione del titolare su provider e condizioni di avvio del controllo della visibilità nelle risposte IA.
---

Il monitoraggio interno della visibilità IA deve considerare OpenAI con ricerca web, Gemini con grounding Google Search e Claude con ricerca web. Budget mensile iniziale zero: nessuna chiamata reale automatica finché il titolare non imposta un budget positivo dal pannello. Controlli settimanali e avvio manuale condividono lo stesso limite; non inviare dati personali dei clienti.

**Why:** Il titolare ha esplicitamente sostituito la precedente proposta che prevedeva solo Gemini operativo e un blocco delle chiamate live indipendente dal budget.

**How to apply:** Trattare la capacità tecnica dei tre provider e l'autorizzazione a spendere come cose diverse. Testare con provider simulati; non assumere che la presenza delle chiavi autorizzi richieste pagate. Verificare tariffe e costi massimi documentati prima di abilitare ciascuna chiamata.

Il titolare ha successivamente richiesto di mantenere Gemini bloccato e usare
OpenAI e Claude economici con ricerca web per dieci domande ciascuno, puntando
a un controllo completo ben sotto 1 USD. L'avvio manuale deve operare dal server
del sito senza dipendere da un worker esterno; la pianificazione settimanale
può usare un deployment programmato, ma non un timer in-process come garanzia
su un servizio Autoscale sospendibile.

**Why:** I precedenti massimi prudenziali superavano il budget del titolare e
l'obbligo di heartbeat esterno impediva anche gli avvii manuali.

**How to apply:** Il limite mensile esistente non va azzerato durante gli
aggiornamenti. Il target di costo non autorizza a sottostimare input e ricerca
fatturati: verificare limiti applicabili, mantenere prenotazioni atomiche ed
esiti incerti. Nessuna chiamata reale durante sviluppo o test.

Le impostazioni `low`, il limite output e una ricerca per domanda non
dimostrano un tetto numerico dell’input ricerca: una stima economica non
può essere usata come prenotazione massima garantita.

**Why:** Le documentazioni consultate distinguono il limite alle ricerche
dal contenuto fatturato; il target sotto 1 USD non giustifica un limite
contabile inferiore al peggiore caso documentato.

**How to apply:** Dichiarare separatamente stima, prenotazione prudenziale
e possibile completamento parziale; non presentare test sintetici entro
budget come prove di fatturazione reale.

Il grounding Google Search non può essere assimilato a un normale output generativo liberamente analizzabile: i termini consultati il 23 novembre 2026 vietano analisi e raccolta automatizzata dei Grounded Results per costruire uno storico di monitoraggio. Un budget positivo non supera questo vincolo.

**Why:** Il caso d'uso approvato richiede un database analitico, mentre le eccezioni Google riguardano display e cronologia chat, non misurazione della visibilità. La presenza dell'adapter non prova il diritto di eseguirlo.

**How to apply:** Prima di rendere Gemini operativo per il monitoraggio richiedere termini applicabili o autorizzazione Google scritta, oltre a una stima massima dimostrabile. Non sostituire questo controllo con un'accettazione UI del titolare.
