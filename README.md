# 🥪 Mappa Paninari

Mappa interattiva dei paninari di Milano e dintorni visitati da **sandrinoalpepe** nella serie *"Il miglior paninaro"*.

**🔗 Demo:** https://guidoapuzzo.github.io/Mappa-Paninari/

## Funzionalità

- Mappa interattiva (dati OpenStreetMap) centrata su Milano
- **Ricerca per nome**: scrivi nella barra in alto a sinistra e scegli un locale, la mappa ci zooma e apre il popup (senza distinguere maiuscole e accenti)
- Pin personalizzati raggruppati in cluster numerati quando sono vicini (si aprono con un tocco o con lo zoom)
- Un marker per ogni locale, con popup che si apre al passaggio del mouse (e si chiude quando esci) oppure al clic (resta aperto), e che contiene nome, link al video, pagina Instagram e dettagli sulla posizione
- Pulsante **"Apri su Google Maps"** con il link esatto del locale, oppure **"Ottieni indicazioni"** verso le coordinate per le posizioni approssimative (es. food truck)
- Geolocalizzazione dell'utente
- Marker semitrasparenti per le posizioni solo approssimative
- Aggiornamento dei dati senza toccare il codice: basta modificare il foglio Google

## Stack

| Ambito | Tecnologia |
| --- | --- |
| Frontend | HTML5, CSS3, JavaScript (ES6+, nessun framework né build) |
| Mappa | [Leaflet](https://leafletjs.com/) 1.9.4 |
| Sfondo mappa | Tile vettoriali [OpenFreeMap](https://openfreemap.org/) (dati OpenStreetMap) via [MapLibre GL JS](https://maplibre.org/) 4.7.1, senza chiavi API |
| Geolocalizzazione | [leaflet.locatecontrol](https://github.com/domoritz/leaflet-locatecontrol) |
| Raggruppamento marker | [Leaflet.markercluster](https://github.com/Leaflet/Leaflet.markercluster) 1.5.3 |
| Parsing dati | [PapaParse](https://www.papaparse.com/) 5.3.2 |
| "Backend" / dati | Google Sheets pubblicato come CSV, con copia di riserva nel repo (`data/locali.csv`) |
| Hosting | GitHub Pages |

Le librerie sono incluse nel repo (cartella [`vendor/`](vendor/README.md)): nessuna dipendenza da CDN esterni.

## Come funziona

1. All'avvio il browser scarica il CSV del foglio Google pubblicato.
2. Se il foglio non risponde (o Google limita le richieste e restituisce una pagina d'errore) usa la copia di riserva `data/locali.csv`.
3. PapaParse converte il CSV in oggetti, uno per riga.
4. Per ogni riga con coordinate valide viene creato un marker Leaflet con il suo popup.

Colonne del foglio:

| Colonna | Obbligatoria | Descrizione |
| --- | --- | --- |
| `nome` | sì | Nome del locale |
| `lat`, `lng` | sì | Coordinate in gradi decimali |
| `video` | sì | URL del video |
| `maps` | no | Link Google Maps della scheda del locale. Se presente, il pulsante apre quella scheda (posizione esatta); se vuoto si usano le coordinate |
| `instagram` | no | URL della pagina Instagram |
| `dettagli_posizione` | no | Note per trovare il locale |
| `approssimativo` | no | `sì` se la posizione è indicativa |

## Aggiornare i dati

Basta aggiungere una riga al foglio Google: la mappa la mostra entro qualche minuto.

La copia di riserva va invece riallineata a mano dopo aver aggiunto locali. Serve solo se il foglio smette di rispondere:

```bash
./scripts/aggiorna-dati.sh
git add data/locali.csv && git commit -m "chore: aggiorna la copia di riserva dei dati" && git push
```

Lo script rifiuta di sovrascrivere la copia se il file scaricato non sembra il CSV dei locali.

## Sicurezza

- I dati arrivano da una fonte esterna, quindi non sono considerati affidabili: i valori vengono sottoposti a escape prima di essere inseriti nei popup e i link sono accettati solo se `http(s)`, per prevenire XSS.
- Le librerie sono servite dal repo e non da CDN di terzi, così il codice che gira sul sito è quello verificato.
- Nel repo non ci sono chiavi, password o token. Il foglio è pubblicato solo in lettura.

## Avvertenze

Progetto indipendente e **non ufficiale**, realizzato a scopo personale e informativo.

Le informazioni (posizione, esistenza e dettagli dei locali) sono **indicative**: possono contenere errori o non essere aggiornate e sono fornite "così come sono", senza garanzie di alcun tipo. Prima di spostarti, verifica sempre direttamente con il locale. L'autore non risponde di eventuali inesattezze né di danni derivanti dall'uso della mappa.

I nomi, i marchi e i contenuti citati (video, immagini, pagine social) appartengono ai rispettivi proprietari. I link rimandano ai servizi originali: i contenuti non sono copiati né ospitati qui. Per segnalare un errore o chiedere la rimozione di un riferimento, apri una issue su GitHub.

## Privacy

Il sito non usa cookie, strumenti di analisi né account e non raccoglie dati personali. La posizione, se l'utente preme il pulsante di geolocalizzazione, resta nel suo browser e non viene inviata a nessuno.

Caricando la pagina il browser contatta Google Sheets (dati dei locali) e OpenFreeMap (sfondo della mappa): come per ogni sito, questi servizi ricevono l'indirizzo IP del visitatore. I link verso Google Maps, video e social portano a servizi di terzi, con le loro informative.

## Eseguire in locale

Non servono dipendenze da installare. Serve solo un server statico (i browser non permettono di scaricare il CSV da `file://`):

```bash
git clone https://github.com/guidoapuzzo/Mappa-Paninari.git
cd Mappa-Paninari
python3 -m http.server 8000
```

Poi apri http://localhost:8000.

## Struttura

```
├── index.html   # struttura della pagina
├── style.css    # stili
├── app.js       # logica: caricamento CSV, marker, popup, ricerca, gestione errori
├── data/        # copia di riserva dei dati (locali.csv)
├── scripts/     # aggiorna-dati.sh
└── vendor/      # librerie di terze parti con le loro licenze
```

## Licenza e crediti

- **Codice**: licenza MIT, vedi [LICENSE](LICENSE). La licenza copre solo il codice di questo repository, non i dati dei locali né i contenuti di terzi collegati.
- **Librerie** in `vendor/`: ciascuna con la propria licenza (BSD, ISC, MIT), vedi [vendor/README.md](vendor/README.md).
- **Mappa**: dati © [contributori di OpenStreetMap](https://www.openstreetmap.org/copyright) (licenza ODbL), tile di [OpenFreeMap](https://openfreemap.org/) con schema [OpenMapTiles](https://www.openmaptiles.org/).
