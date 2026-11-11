#!/bin/sh
# Aggiorna la copia di riserva dei dati (data/locali.csv) scaricandola dal foglio pubblicato.
# Va rieseguita dopo aver aggiunto locali al foglio, poi: git add data/locali.csv && git commit && git push
set -eu

cd "$(dirname "$0")/.."

# Stesso URL di SHEET_URL in app.js
URL=$(sed -n "s/^const SHEET_URL = '\(.*\)';/\1/p" app.js)
[ -n "$URL" ] || { echo "SHEET_URL non trovato in app.js" >&2; exit 1; }

TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT

curl -fsSL "$URL" -o "$TMP"

# Sicurezza: non sovrascrivere la copia buona con una pagina d'errore o un file senza colonne/locali
head -1 "$TMP" | grep -q '^nome,.*lat,.*lng' || { echo "Il file scaricato non sembra il CSV dei locali: copia di riserva NON aggiornata" >&2; exit 1; }
[ "$(awk "END{print NR}" "$TMP")" -ge 3 ] || { echo "Troppo poche righe: copia di riserva NON aggiornata" >&2; exit 1; }

mv "$TMP" data/locali.csv
trap - EXIT
echo "Aggiornato data/locali.csv ($(($(awk "END{print NR}" data/locali.csv) - 1)) righe)"
