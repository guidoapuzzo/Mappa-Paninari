'use strict';

const MILANO = [45.4642, 9.19];
const SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vTqWxIz8pycWc_XJr3tuLPB3YoyggnvoXRABjGw2XBan4_OC9JuX3ukQnQ95qIFgJwX8_p_NHMBekjA/pub?output=csv';

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

function link(href, label) {
  const url = safeUrl(href);
  return url
    ? `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">${label}</a>`
    : '';
}

function hasValue(value) {
  return Boolean(value && value.trim() !== '');
}

function buildPopup(row, lat, lng) {
  const parts = [`<b>${escapeHtml(row.nome)}</b>`];

  const video = link(row.video, 'Guarda il video');
  if (video) parts.push(video);

  if (hasValue(row.instagram)) {
    const instagram = link(row.instagram, 'Pagina Instagram');
    if (instagram) parts.push(instagram);
  }

  // La partenza viene rilevata automaticamente da Google Maps.
  const directionsURL = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  parts.push(link(directionsURL, '<b>Ottieni Indicazioni</b>'));

  if (hasValue(row.dettagli_posizione)) {
    parts.push(`<i>${escapeHtml(row.dettagli_posizione)}</i>`);
  }

  if (isApproximate(row)) {
    parts.push('<i>(Posizione approssimativa)</i>');
  }

  return parts.join('<br>');
}

function isApproximate(row) {
  return hasValue(row.approssimativo) && row.approssimativo.trim().toLowerCase() === 'sì';
}

function addMarker(map, row) {
  const lat = parseFloat(row.lat);
  const lng = parseFloat(row.lng);
  if (Number.isNaN(lat) || Number.isNaN(lng)) return false;

  // Marker semitrasparente se la posizione è approssimativa
  const options = isApproximate(row) ? { opacity: 0.7 } : {};
  L.marker([lat, lng], options).addTo(map).bindPopup(buildPopup(row, lat, lng));
  return true;
}

function showError(message) {
  const box = document.createElement('div');
  box.className = 'map-error';
  box.setAttribute('role', 'alert');
  box.textContent = message;
  document.body.appendChild(box);
}

function loadPlaces(map) {
  Papa.parse(SHEET_URL, {
    download: true,
    header: true,
    skipEmptyLines: true,
    complete: (results) => {
      const added = results.data.filter((row) => addMarker(map, row)).length;
      if (added === 0) showError('Nessun locale trovato nei dati.');
    },
    error: () => showError('Impossibile caricare i dati. Riprova più tardi.'),
  });
}

const map = L.map('map').setView(MILANO, 12);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors',
}).addTo(map);

L.control.locate().addTo(map);
loadPlaces(map);
