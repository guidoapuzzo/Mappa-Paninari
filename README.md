# 🥪 Mappa Paninari

Mappa interattiva dei paninari di Milano e dintorni visitati da **sandrinoalpepe** nella serie *"Il miglior paninaro"*.

**🔗 Demo:** https://guidoapuzzo.github.io/Mappa-Paninari/

## Funzionalità

- Mappa interattiva (OpenStreetMap) centrata su Milano
- Pin personalizzati raggruppati in cluster numerati quando sono vicini (si aprono con un tocco o con lo zoom)
- Un marker per ogni locale, con popup che contiene nome, link al video, pagina Instagram e dettagli sulla posizione
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
| Parsing dati | [PapaParse](https://www.papaparse.com/) |
| "Backend" / dati | Google Sheets pubblicato come CSV |
| Hosting | GitHub Pages |

## Come funziona

1. All'avvio il browser scarica il CSV del foglio Google pubblicato.
2. PapaParse lo converte in oggetti, uno per riga.
3. Per ogni riga con coordinate valide viene creato un marker Leaflet con il suo popup.

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

## Sicurezza

I dati arrivano da una fonte esterna, quindi non sono considerati affidabili: i valori vengono sottoposti a escape prima di essere inseriti nei popup e i link sono accettati solo se `http(s)`, per prevenire XSS.

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
├── index.html   # struttura della pagina e caricamento librerie
├── style.css    # stili
└── app.js       # logica: caricamento CSV, marker, popup, gestione errori
```

## Licenza

Distribuito con licenza MIT, vedi [LICENSE](LICENSE).
