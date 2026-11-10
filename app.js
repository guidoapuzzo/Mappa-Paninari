'use strict';

const MILANO = [45.4642, 9.19];
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTfES7XOCgqkVs8u8H5jdAUSsLliB6a6OXX2nSBXhcaXpvGS4KQSYDJUp0hCnQ7Cn-9MQSOoKzlMAe1/pub?gid=2113170927&single=true&output=csv';

/** Escape dei caratteri HTML: i dati del foglio non vanno mai inseriti "grezzi" nel DOM. */
function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Accetta solo URL http(s); altrimenti restituisce null (blocca javascript:, data:, ecc.). */
function safeUrl(value) {
  try {
    const url = new URL(String(value ?? '').trim());
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

function link(href, label, className = 'popup-btn') {
  const url = safeUrl(href);
  return url
    ? `<a class="${className}" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`
    : '';
}

function hasValue(value) {
  return Boolean(value && value.trim() !== '');
}

function buildPopup(row, lat, lng) {
  const actions = [];

  const video = link(row.video, 'Guarda il video');
  if (video) actions.push(video);

  if (hasValue(row.instagram)) {
    const instagram = link(row.instagram, 'Pagina Instagram');
    if (instagram) actions.push(instagram);
  }

  // La partenza viene rilevata automaticamente da Google Maps.
  const directionsURL = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  actions.push(link(directionsURL, 'Ottieni Indicazioni', 'popup-btn popup-btn--primary'));

  const notes = [];
  if (hasValue(row.dettagli_posizione)) {
    notes.push(`<p class="popup-note">${escapeHtml(row.dettagli_posizione)}</p>`);
  }
  if (isApproximate(row)) {
    notes.push('<p class="popup-note popup-note--approx">(Posizione approssimativa)</p>');
  }

  return `
    <div class="popup">
      <h3 class="popup-title">${escapeHtml(row.nome)}</h3>
      ${notes.join('')}
      <div class="popup-actions">${actions.join('')}</div>
    </div>`;
}

function isApproximate(row) {
  return hasValue(row.approssimativo) && row.approssimativo.trim().toLowerCase() === 'sì';
}

function addMarker(layer, row) {
  const lat = parseFloat(row.lat);
  const lng = parseFloat(row.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;

  // Marker semitrasparente se la posizione è approssimativa
  const options = { icon: createIcon(isApproximate(row)), title: row.nome };
  if (isApproximate(row)) options.opacity = 0.7;

  L.marker([lat, lng], options)
    .addTo(layer)
    .bindPopup(buildPopup(row, lat, lng), { maxWidth: 260, autoPanPadding: [24, 24] });
  return true;
}

/** Pin arancione con panino, più riconoscibile del marker blu di default. */
function createIcon(approximate) {
  return L.divIcon({
    className: 'pin-wrapper',
    html: `<div class="pin${approximate ? ' pin--approx' : ''}"><span>🥪</span></div>`,
    iconSize: [40, 48],
    iconAnchor: [20, 46],
    popupAnchor: [0, -42],
  });
}

function showError(message) {
  const box = document.createElement('div');
  box.className = 'map-error';
  box.setAttribute('role', 'alert');
  box.textContent = message;
  document.body.appendChild(box);
}

function loadPlaces(map) {
  // Raggruppa i pin vicini: si aprono con un tocco/zoom
  const cluster = L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 45 });
  map.addLayer(cluster);

  Papa.parse(SHEET_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const added = results.data.filter((row) => addMarker(cluster, row)).length;
      if (added === 0) showError('Nessun locale trovato nei dati.');
    },
    error: () => showError('Impossibile caricare i dati. Riprova più tardi.'),
  });
}

const map = L.map('map', { zoomControl: false, maxZoom: 19 }).setView(MILANO, 12);

// Sfondo vettoriale OpenFreeMap (gratuito, senza chiave API): più moderno e leggibile.
// Stili alternativi: 'bright' (più saturo), 'positron' (grigio chiaro minimale).
const MAP_STYLE = 'liberty';
L.maplibreGL({ style: `https://tiles.openfreemap.org/styles/${MAP_STYLE}` }).addTo(map);
map.attributionControl.addAttribution(
  '<a href="https://openfreemap.org" target="_blank" rel="noopener">OpenFreeMap</a> ' +
  '© <a href="https://www.openmaptiles.org/" target="_blank" rel="noopener">OpenMapTiles</a> ' +
  'Data from <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
);

// Controlli in basso a destra: a portata di pollice su mobile
L.control.zoom({ position: 'bottomright' }).addTo(map);
L.control.locate({ position: 'bottomright' }).addTo(map);
loadPlaces(map);
