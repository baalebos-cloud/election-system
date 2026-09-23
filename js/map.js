// ============================================================
//  js/map.js  —  Pure ES5
//  National dashboard map + agent GPS picker
// ============================================================

var dashMap      = null;
var pickerMap    = null;
var pickerMarker = null;
var pickedLat    = null;
var pickedLng    = null;
var stateMarkers = {};

// ── NATIONAL DASHBOARD MAP ────────────────────────────────
function initDashMap() {
  if (!document.getElementById('dash-map')) return;
  if (dashMap) { dashMap.invalidateSize(); return; }

  // Centre on Nigeria
  dashMap = L.map('dash-map', { zoomControl: true, scrollWheelZoom: false })
    .setView([9.0820, 8.6753], 6);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors', maxZoom: 18
  }).addTo(dashMap);

  // Plot each state as a circle marker sized by PU count
  var i, s, rep, reported, pct, col, radius, pop, circle;
  for (i = 0; i < NIGERIA_STATES.length; i++) {
    s        = NIGERIA_STATES[i];
    reported = getStateReported(s.code);
    pct      = s.pus > 0 ? reported / s.pus : 0;
    col      = pct >= 0.9 ? '#00B04F' : pct >= 0.5 ? '#E8A020' : pct > 0 ? '#1A6FA8' : '#8FA598';
    radius   = Math.max(8, Math.min(22, s.pus / 500));

    (function(st, rp, pt) {
      circle = L.circleMarker([st.lat, st.lng], {
        radius: radius, fillColor: col, color: '#fff',
        weight: 2, opacity: 1, fillOpacity: 0.85
      }).addTo(dashMap);

      pop = '<b>' + st.name + ' State</b><br>' +
            'Zone: ' + st.zone + '<br>' +
            'Capital: ' + st.capital + '<br>' +
            'LGAs: ' + st.lgas + ' &middot; Total PUs: ' + st.pus.toLocaleString() + '<br>' +
            'Reported: <strong>' + rp + '</strong> (' + Math.round(pt * 100) + '%)';
      circle.bindPopup(pop);
      circle.on('click', function() { zoomToState(st); });
      stateMarkers[st.code] = circle;
    })(s, reported, pct);
  }

  // Legend
  var legend = L.control({ position: 'bottomright' });
  legend.onAdd = function() {
    var d = L.DomUtil.create('div');
    d.style.cssText = 'background:#fff;padding:8px 11px;border-radius:8px;font-size:10px;box-shadow:0 2px 8px rgba(0,0,0,.15);line-height:1.8';
    d.innerHTML = '<b style="display:block;margin-bottom:3px">Reporting Status</b>' +
      '<div style="display:flex;align-items:center;gap:5px"><div style="width:9px;height:9px;border-radius:50%;background:#00B04F"></div>&gt;90% reported</div>' +
      '<div style="display:flex;align-items:center;gap:5px"><div style="width:9px;height:9px;border-radius:50%;background:#E8A020"></div>50%&ndash;90%</div>' +
      '<div style="display:flex;align-items:center;gap:5px"><div style="width:9px;height:9px;border-radius:50%;background:#1A6FA8"></div>&lt;50%</div>' +
      '<div style="display:flex;align-items:center;gap:5px"><div style="width:9px;height:9px;border-radius:50%;background:#8FA598"></div>Not started</div>';
    return d;
  };
  legend.addTo(dashMap);
}

function getStateReported(stateCode) {
  var count = 0, k, u;
  for (k in reportedResults) {
    u = reportedResults[k];
    if (u.stateCode === stateCode) count++;
  }
  return count;
}

function zoomToState(st) {
  dashMap.flyTo([st.lat, st.lng], 9, { duration: 1.2 });
  var stSel = document.getElementById('state-filter');
  if (stSel) stSel.value = st.name;
  filterByState(st.name);
}

function refreshMapMarkers() {
  if (!dashMap) return;
  var i, s, rep, pct, col;
  for (i = 0; i < NIGERIA_STATES.length; i++) {
    s   = NIGERIA_STATES[i];
    rep = getStateReported(s.code);
    pct = s.pus > 0 ? rep / s.pus : 0;
    col = pct >= 0.9 ? '#00B04F' : pct >= 0.5 ? '#E8A020' : pct > 0 ? '#1A6FA8' : '#8FA598';
    if (stateMarkers[s.code]) {
      stateMarkers[s.code].setStyle({ fillColor: col });
    }
  }
}

// ── AGENT MAP PICKER ──────────────────────────────────────
function openMapModal() {
  var modal = document.getElementById('map-modal');
  if (!modal) return;
  modal.classList.add('open');

  setTimeout(function() {
    var center = agentPU ? [agentPU.lat, agentPU.lng] : [9.0820, 8.6753];
    var zoom   = agentPU ? 14 : 6;

    if (pickerMap) {
      pickerMap.invalidateSize({ animate: false });
      pickerMap.setView(center, zoom);
      return;
    }

    pickerMap = L.map('picker-map', { center: center, zoom: zoom, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 19
    }).addTo(pickerMap);

    if (agentPU) {
      L.circleMarker([agentPU.lat, agentPU.lng], {
        radius: 10, fillColor: '#1A6FA8', color: '#fff', weight: 2, fillOpacity: 0.85
      }).bindPopup('<b>' + agentPU.code + '</b><br>' + agentPU.name)
        .addTo(pickerMap).openPopup();
    }

    pickerMap.on('click', function(e) {
      pickedLat = e.latlng.lat; pickedLng = e.latlng.lng;
      if (pickerMarker) pickerMarker.remove();
      pickerMarker = L.marker([pickedLat, pickedLng])
        .addTo(pickerMap)
        .bindPopup('Your position: ' + pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6))
        .openPopup();
      var cd = document.getElementById('picked-coords');
      if (cd) cd.textContent = 'Lat: ' + pickedLat.toFixed(6) + ', Lng: ' + pickedLng.toFixed(6);
    });

    setTimeout(function() { pickerMap.invalidateSize({ animate: false }); }, 300);
  }, 100);
}

function closeMap() {
  var modal = document.getElementById('map-modal');
  var panel = document.getElementById('manual-coord-panel');
  if (modal) modal.classList.remove('open');
  if (panel) panel.style.display = 'none';
  if (pickerMap) setTimeout(function() { pickerMap.invalidateSize({ animate: false }); }, 50);
}
var closeMapModal = closeMap;

function useGPS() {
  if (!navigator.geolocation) { showManualCoordPanel(); toast('GPS not available \u2014 use manual entry', 'warn'); return; }
  toast('Requesting GPS...', 'info');
  navigator.geolocation.getCurrentPosition(
    function(pos) {
      pickedLat = pos.coords.latitude; pickedLng = pos.coords.longitude;
      var acc = Math.round(pos.coords.accuracy);
      function plot() {
        if (!pickerMap) { setTimeout(plot, 200); return; }
        pickerMap.setView([pickedLat, pickedLng], 16);
        if (pickerMarker) pickerMarker.remove();
        pickerMarker = L.marker([pickedLat, pickedLng]).addTo(pickerMap)
          .bindPopup('GPS: ' + pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6)).openPopup();
        var cd = document.getElementById('picked-coords');
        if (cd) cd.textContent = 'GPS \u2014 ' + pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6) + ' (\u00b1' + acc + 'm)';
        toast('GPS acquired (\u00b1' + acc + 'm)', 'ok');
      }
      plot();
    },
    function(err) {
      SEC.log('warn', 'GPS failed', 'Code: ' + err.code);
      showManualCoordPanel();
      if (agentPU) {
        var ml = document.getElementById('manual-lat'), mg = document.getElementById('manual-lng');
        if (ml) ml.value = agentPU.lat.toFixed(6);
        if (mg) mg.value = agentPU.lng.toFixed(6);
      }
      toast('GPS unavailable \u2014 use manual entry or click map', 'warn');
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

function showManualCoordPanel() {
  var p = document.getElementById('manual-coord-panel');
  if (p) p.style.display = 'block';
}

function applyManualCoords() {
  var latEl = document.getElementById('manual-lat'), lngEl = document.getElementById('manual-lng');
  if (!latEl || !lngEl) return;
  var lat = parseFloat(latEl.value), lng = parseFloat(lngEl.value);
  if (isNaN(lat) || isNaN(lng)) { toast('Enter valid decimal coordinates', 'err'); return; }
  pickedLat = lat; pickedLng = lng;
  function plot() {
    if (!pickerMap) { setTimeout(plot, 200); return; }
    pickerMap.setView([pickedLat, pickedLng], 15);
    if (pickerMarker) pickerMarker.remove();
    pickerMarker = L.marker([pickedLat, pickedLng]).addTo(pickerMap)
      .bindPopup('Manual: ' + pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6)).openPopup();
    var cd = document.getElementById('picked-coords');
    if (cd) cd.textContent = 'Manual \u2014 ' + pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6);
  }
  plot();
  toast('Coordinates applied \u2014 click Confirm to save', 'ok');
}

function useUnitCoords() {
  if (!agentPU) { toast('Select a polling unit first', 'warn'); return; }
  var ml = document.getElementById('manual-lat'), mg = document.getElementById('manual-lng');
  if (ml) ml.value = agentPU.lat.toFixed(6);
  if (mg) mg.value = agentPU.lng.toFixed(6);
  showManualCoordPanel();
  applyManualCoords();
}

function confirmLoc() {
  if (pickedLat === null) { toast('Click the map or enter coordinates first', 'warn'); return; }
  closeMap();
  var lb=document.getElementById('loc-box'), mb=document.getElementById('map-btn'),
      rp=document.getElementById('repick-btn'), ln=document.getElementById('loc-nm'),
      lc=document.getElementById('loc-coords');
  if (lb) lb.style.display = 'flex';
  if (mb) mb.style.display = 'none';
  if (rp) rp.style.display = 'block';
  if (ln) ln.textContent   = 'Location confirmed \u2713';
  if (lc) lc.textContent   = pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6);
  toast('Location confirmed', 'ok');
}

function reopenMap() {
  var lb=document.getElementById('loc-box'), mb=document.getElementById('map-btn'), rp=document.getElementById('repick-btn');
  if (lb) lb.style.display = 'none';
  if (mb) mb.style.display = 'flex';
  if (rp) rp.style.display = 'none';
  openMapModal();
}
