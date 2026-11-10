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

/**
 * Pulsante principale del popup.
 * - Se nel foglio c'è un link Google Maps del locale (colonna `maps`) apre la scheda esatta del posto.
 * - Altrimenti (es. food truck) calcola le indicazioni verso le coordinate.
 */
function directionsButton(row, lat, lng) {
  const className = 'popup-btn popup-btn--primary';

  if (hasValue(row.maps)) {
    const place = link(row.maps, 'Apri su Google Maps', className);
    if (place) return place;
  }

  // La partenza viene rilevata automaticamente da Google Maps.
  const directionsURL = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  return link(directionsURL, 'Ottieni Indicazioni', className);
}

function buildPopup(row, lat, lng) {
  const actions = [];

  const video = link(row.video, 'Guarda il video');
  if (video) actions.push(video);

  if (hasValue(row.instagram)) {
    const instagram = link(row.instagram, 'Pagina Instagram');
    if (instagram) actions.push(instagram);
  }

  actions.push(directionsButton(row, lat, lng));

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
  if (Number.isNaN(lat) || Number.isNaN(lng)) return null;

  // Marker semitrasparente se la posizione è approssimativa
  const options = { icon: createIcon(isApproximate(row)), title: row.nome };
  if (isApproximate(row)) options.opacity = 0.7;

  const marker = L.marker([lat, lng], options)
    .addTo(layer)
    .bindPopup(buildPopup(row, lat, lng), { maxWidth: 260, autoPanPadding: [24, 24] });
  marker.placeName = String(row.nome ?? '').trim();
  return marker;
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

/** Minuscolo e senza accenti, così "pizzà" trova "Pizza". */
function normalize(text) {
  return String(text ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

/** Zoom sul locale scelto e apertura del popup (anche se il pin è dentro un cluster). */
function showPlace(map, cluster, marker) {
  map.setView(marker.getLatLng(), Math.max(map.getZoom(), 16), { animate: false });
  cluster.zoomToShowLayer(marker, () => marker.openPopup());
}

/** Barra di ricerca per nome dei locali, in alto a sinistra. */
function addSearchControl(map, cluster, markers) {
  const MAX_RESULTS = 8;
  const searchable = markers
    .filter((marker) => marker.placeName)
    .map((marker) => ({ marker, key: normalize(marker.placeName) }));

  const control = L.control({ position: 'topleft' });
  control.onAdd = () => {
    const box = L.DomUtil.create('div', 'map-search');
    const input = L.DomUtil.create('input', 'map-search-input', box);
    input.type = 'search';
    input.placeholder = 'Cerca un locale…';
    input.autocomplete = 'off';
    input.setAttribute('aria-label', 'Cerca un locale');
    const list = L.DomUtil.create('ul', 'map-search-results', box);
    list.setAttribute('role', 'listbox');
    list.hidden = true;

    let results = [];
    let active = -1;

    const setActive = (index) => {
      active = index;
      [...list.children].forEach((li, i) => li.classList.toggle('is-active', i === active));
    };

    const clear = () => {
      results = [];
      list.replaceChildren();
      list.hidden = true;
    };

    const choose = (item) => {
      input.value = item.marker.placeName;
      clear();
      input.blur();
      showPlace(map, cluster, item.marker);
    };

    const render = () => {
      const query = normalize(input.value);
      if (!query) return clear();

      results = searchable
        .filter((item) => item.key.includes(query))
        .sort((a, b) => a.key.indexOf(query) - b.key.indexOf(query) || a.key.localeCompare(b.key))
        .slice(0, MAX_RESULTS);

      list.replaceChildren();
      if (results.length === 0) {
        const empty = L.DomUtil.create('li', 'map-search-empty', list);
        empty.textContent = 'Nessun locale trovato';
      }
      results.forEach((item, i) => {
        const li = L.DomUtil.create('li', 'map-search-item', list);
        li.setAttribute('role', 'option');
        li.textContent = item.marker.placeName;
        li.addEventListener('mousedown', (event) => event.preventDefault());
        li.addEventListener('click', () => choose(item));
        li.addEventListener('mouseenter', () => setActive(i));
      });
      active = -1;
      list.hidden = false;
    };

    input.addEventListener('input', render);
    input.addEventListener('focus', render);
    input.addEventListener('blur', () => setTimeout(clear, 150));
    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown' && results.length) {
        event.preventDefault();
        setActive((active + 1) % results.length);
      } else if (event.key === 'ArrowUp' && results.length) {
        event.preventDefault();
        setActive((active - 1 + results.length) % results.length);
      } else if (event.key === 'Enter' && results.length) {
        event.preventDefault();
        choose(results[active >= 0 ? active : 0]);
      } else if (event.key === 'Escape') {
        input.value = '';
        clear();
        input.blur();
      }
    });

    // Evita che clic, trascinamenti e scroll sul box muovano la mappa
    L.DomEvent.disableClickPropagation(box);
    L.DomEvent.disableScrollPropagation(box);
    return box;
  };
  control.addTo(map);
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
      const markers = results.data.map((row) => addMarker(cluster, row)).filter(Boolean);
      if (markers.length === 0) showError('Nessun locale trovato nei dati.');
      addSearchControl(map, cluster, markers);
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
