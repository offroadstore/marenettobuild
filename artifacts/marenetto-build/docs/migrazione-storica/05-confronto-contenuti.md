# Confronto dei contenuti

Primo confronto sull'intero inventario: 437 URL, inclusi indisponibili, feed e alias. Vedere differenze.csv e diffs/ nel pacchetto.

184 corrispondenze integrali corpo/titolo; 73 corrispondenze salvo sostituzioni esplicite. Normalizzazione limitata agli spazi, NBSP e tag di presentazione; numeri, negazioni e punteggiatura non vengono eliminati.

Ogni diff contiene corpi integrali e confronto di blocchi, titoli di sezione, elenchi, tabelle, immagini, didascalie, allegati, dati editoriali, metadati, lingua e HTTP. Le differenze non vengono automaticamente giustificate perché corpo e titolo coincidono. L'adattamento H1→H2 dei titoli subordinati è già dichiarato nella baseline. Grafica, hero e logo approvati non sono modificati.

## Altre dimensioni

Controlli atomici di struttura, risorse, link e metadati: {"total":6118,"counts":{"superato":1868,"differente":1730,"non verificato":2520},"justifiedDifferences":506,"openDifferences":1224}. Registro: controlli-dimensioni.csv. Una differenza aperta resta tale anche quando è una conseguenza probabile della nuova impaginazione: non viene approvata per deduzione. Una stessa pagina può avere più differenze.

## Risorse

78 risorse archiviate con hash e provenienza; 33 immagini distinte servite dall'API e verificate contro i byte indipendenti. Le associazioni originali e la mappatura sono nel diff e in media-delivery.json. Il backup di CSS e font non implica che quei CSS siano usati dalla grafica approvata. Occorrenze immagine ancora su hosting remoto nel corpo servito: 0.
