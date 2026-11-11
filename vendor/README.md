# Librerie di terze parti

Copie dei file distribuiti su npm, alle versioni indicate. Non sono modificate (identiche ai file
serviti dai CDN). Ogni cartella contiene la licenza originale, da conservare.

| Libreria | Versione | Licenza | Origine |
| --- | --- | --- | --- |
| Leaflet | 1.9.4 | BSD-2-Clause | https://www.npmjs.com/package/leaflet |
| MapLibre GL JS | 4.7.1 | BSD-3-Clause | https://www.npmjs.com/package/maplibre-gl |
| @maplibre/maplibre-gl-leaflet | 0.0.22 | ISC | https://www.npmjs.com/package/@maplibre/maplibre-gl-leaflet |
| Leaflet.markercluster | 1.5.3 | MIT | https://www.npmjs.com/package/leaflet.markercluster |
| leaflet.locatecontrol | 0.79.0 | MIT | https://www.npmjs.com/package/leaflet.locatecontrol |
| PapaParse | 5.3.2 | MIT | https://www.npmjs.com/package/papaparse |

Per aggiornare una libreria: `npm pack <nome>@<versione>`, copiare i file dalla cartella `dist` e
aggiornare i percorsi in `index.html`.
