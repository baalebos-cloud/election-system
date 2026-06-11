// ============================================================
//  js/map.js
//  Leaflet map init, GPS handler, manual coord entry
//  No template literals — plain string concat throughout
// ============================================================

var dashMap     = null;
var pickerMap   = null;
var pickerMarker = null;
var pickedLat   = null;
var pickedLng   = null;

// ── DASHBOARD MAP ─────────────────────────────────────────
function initDashMap() {
  if (!document.getElementById('dash-map')) return;
  if (dashMap) { dashMap.invalidateSize(); return; }

  dashMap = L.map('dash-map', { zoomControl: true, scrollWheelZoom: false })
    .setView([7.72, 5.31], 9);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap contributors', maxZoom: 18,
  }).addTo(dashMap);

  ALL_POLLING_UNITS.forEach(function(u) {
    var reported = reportedResults[u.code];
    var circle   = L.circleMarker([u.lat, u.lng], {
      radius: reported ? 8 : 4,
      fillColor: reported ? '#00B04F' : '#E8A020',
      color: '#fff', weight: 1.5, opacity: 1, fillOpacity: 0.85,
    }).addTo(dashMap);

    var popup = '<b>' + u.code + '</b><br>' + u.name + '<br>' + u.ward + ' &middot; ' + u.lga;
    if (reported) {
      var entries = Object.entries(reported.results || {}).sort(function(a,b){return b[1]-a[1];});
      var top = entries[0];
      if (top) {
        var p = null;
        for (var i = 0; i < PARTIES.length; i++) { if (PARTIES[i].id === top[0]) { p = PARTIES[i]; break; } }
        if (p) popup += '<br><span style="color:' + p.color + ';font-weight:600">Leading: ' + p.abbr + ' (' + top[1].toLocaleString() + ')</span>';
      }
      if (reported.agentId) popup += '<br><small>Agent: ' + reported.agentId + '</small>';
    } else {
      popup += '<br><span style="color:#E8A020">Awaiting results</span>';
    }
    circle.bindPopup(popup);
  });

  var legend = L.control({ position: 'bottomright' });
  legend.onAdd = function() {
    var d = L.DomUtil.create('div');
    d.style.cssText = 'background:#fff;padding:7px 10px;border-radius:8px;font-size:11px;box-shadow:0 2px 8px rgba(0,0,0,.15)';
    d.innerHTML =
      '<b style="display:block;margin-bottom:4px">Status</b>' +
      '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">' +
        '<div style="width:9px;height:9px;border-radius:50%;background:#00B04F"></div>Reported' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:5px">' +
        '<div style="width:6px;height:6px;border-radius:50%;background:#E8A020;margin-left:1px"></div>Pending' +
      '</div>';
    return d;
  };
  legend.addTo(dashMap);
}

// ── AGENT MAP PICKER ──────────────────────────────────────
function openMapModal() {
  var modal = document.getElementById('map-modal');
  if (!modal) return;
  modal.classList.add('open');

  requestAnimationFrame(function() {
    setTimeout(function() {
      var center = agentPU ? [agentPU.lat, agentPU.lng] : [7.72, 5.31];
      var zoom   = agentPU ? 14 : 10;

      if (pickerMap) {
        pickerMap.invalidateSize({ animate: false });
        pickerMap.setView(center, zoom);
        if (pickedLat !== null) {
          if (pickerMarker) pickerMarker.remove();
          pickerMarker = L.marker([pickedLat, pickedLng]).addTo(pickerMap);
        }
        return;
      }

      pickerMap = L.map('picker-map', { center: center, zoom: zoom, scrollWheelZoom: true });
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap', maxZoom: 19,
      }).addTo(pickerMap);

      if (agentPU) {
        L.circleMarker([agentPU.lat, agentPU.lng], {
          radius: 10, fillColor: '#1A6FA8', color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.8,
        }).bindPopup('<b>' + agentPU.code + '</b><br>' + agentPU.name + '<br><i>Your assigned unit</i>')
          .addTo(pickerMap).openPopup();
      }

      pickerMap.on('click', function(e) {
        pickedLat = e.latlng.lat;
        pickedLng = e.latlng.lng;
        if (pickerMarker) pickerMarker.remove();
        pickerMarker = L.marker([pickedLat, pickedLng])
          .addTo(pickerMap)
          .bindPopup('Your position: ' + pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6))
          .openPopup();
        var cd = document.getElementById('picked-coords');
        if (cd) cd.textContent = 'Lat: ' + pickedLat.toFixed(6) + ', Lng: ' + pickedLng.toFixed(6);
      });

      setTimeout(function() { pickerMap.invalidateSize({ animate: false }); }, 300);
    }, 80);
  });
}

// closeMap is the name used in agent.html — maps to closeMapModal
function closeMap() {
  var modal = document.getElementById('map-modal');
  if (modal) modal.classList.remove('open');
  var panel = document.getElementById('manual-coord-panel');
  if (panel) panel.style.display = 'none';
  if (pickerMap) setTimeout(function() { pickerMap.invalidateSize({ animate: false }); }, 50);
}
// Alias so both names work
var closeMapModal = closeMap;

// ── GPS ───────────────────────────────────────────────────
function useGPS() {
  if (!navigator.geolocation) {
    showManualCoordPanel();
    toast('GPS not available \u2014 enter coordinates manually', 'warn');
    return;
  }
  toast('Requesting GPS location...', 'info');

  navigator.geolocation.getCurrentPosition(
    function(pos) {
      pickedLat = pos.coords.latitude;
      pickedLng = pos.coords.longitude;
      var acc   = Math.round(pos.coords.accuracy);
      function plotGPS() {
        if (!pickerMap) { setTimeout(plotGPS, 200); return; }
        pickerMap.setView([pickedLat, pickedLng], 16);
        if (pickerMarker) pickerMarker.remove();
        pickerMarker = L.marker([pickedLat, pickedLng])
          .addTo(pickerMap)
          .bindPopup('GPS: ' + pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6) + ' (\u00b1' + acc + 'm)')
          .openPopup();
        var cd = document.getElementById('picked-coords');
        if (cd) cd.textContent = 'GPS \u2014 Lat: ' + pickedLat.toFixed(6) + ', Lng: ' + pickedLng.toFixed(6) + ' (\u00b1' + acc + 'm)';
        toast('GPS acquired (\u00b1' + acc + 'm)', 'ok');
      }
      plotGPS();
    },
    function(err) {
      var reasons = {
        1: 'GPS permission denied \u2014 use manual entry or click the map',
        2: 'GPS unavailable \u2014 use manual entry or click the map',
        3: 'GPS timed out \u2014 use manual entry or click the map',
      };
      if (typeof SEC !== 'undefined') SEC.log('warn', 'GPS failed', 'Code: ' + err.code);
      showManualCoordPanel();
      if (agentPU) {
        var mlat = document.getElementById('manual-lat');
        var mlng = document.getElementById('manual-lng');
        var mmsg = document.getElementById('manual-coord-msg');
        if (mlat) mlat.value = agentPU.lat.toFixed(6);
        if (mlng) mlng.value = agentPU.lng.toFixed(6);
        if (mmsg) { mmsg.textContent = 'GPS unavailable. Pre-filled with your unit coordinates.'; mmsg.style.color = 'var(--gold)'; }
      }
      toast(reasons[err.code] || 'GPS failed \u2014 use manual entry', 'warn');
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

// ── MANUAL COORDINATE ENTRY ───────────────────────────────
function showManualCoordPanel() {
  var panel = document.getElementById('manual-coord-panel');
  if (panel) panel.style.display = 'block';
}

function applyManualCoords() {
  var latEl = document.getElementById('manual-lat');
  var lngEl = document.getElementById('manual-lng');
  if (!latEl || !lngEl) return;
  var lat = parseFloat(latEl.value);
  var lng = parseFloat(lngEl.value);
  if (isNaN(lat) || isNaN(lng)) { toast('Enter valid decimal coordinates', 'err'); return; }
  if (lat < 6.5 || lat > 9.0 || lng < 4.0 || lng > 6.5) {
    toast('Coordinates appear outside Ekiti State \u2014 please verify', 'warn');
  }
  pickedLat = lat; pickedLng = lng;
  function plotManual() {
    if (!pickerMap) { setTimeout(plotManual, 200); return; }
    pickerMap.setView([pickedLat, pickedLng], 15);
    if (pickerMarker) pickerMarker.remove();
    pickerMarker = L.marker([pickedLat, pickedLng])
      .addTo(pickerMap)
      .bindPopup('Manual: ' + pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6))
      .openPopup();
    var cd = document.getElementById('picked-coords');
    if (cd) cd.textContent = 'Manual \u2014 Lat: ' + pickedLat.toFixed(6) + ', Lng: ' + pickedLng.toFixed(6);
  }
  plotManual();
  toast('Coordinates applied \u2014 click Confirm to save', 'ok');
}

function useUnitCoords() {
  if (!agentPU) { toast('Select a polling unit first', 'warn'); return; }
  var mlat = document.getElementById('manual-lat');
  var mlng = document.getElementById('manual-lng');
  if (mlat) mlat.value = agentPU.lat.toFixed(6);
  if (mlng) mlng.value = agentPU.lng.toFixed(6);
  showManualCoordPanel();
  applyManualCoords();
}

function confirmLoc() {
  if (pickedLat === null) { toast('Click the map or enter coordinates first', 'warn'); return; }
  closeMap();
  var locBox   = document.getElementById('loc-box');
  var mapBtn   = document.getElementById('map-btn');
  var repickBtn= document.getElementById('repick-btn');
  var locNm    = document.getElementById('loc-nm');
  var locCoords= document.getElementById('loc-coords');
  if (locBox)    locBox.style.display    = 'flex';
  if (mapBtn)    mapBtn.style.display    = 'none';
  if (repickBtn) repickBtn.style.display = 'block';
  if (locNm)     locNm.textContent      = 'Location confirmed \u2713';
  if (locCoords) locCoords.textContent  = pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6);
  toast('Location confirmed and geo-tagged', 'ok');
  if (typeof SEC !== 'undefined') SEC.log('ok', 'Location confirmed', pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6));
}

function reopenMap() {
  var locBox    = document.getElementById('loc-box');
  var mapBtn    = document.getElementById('map-btn');
  var repickBtn = document.getElementById('repick-btn');
  if (locBox)    locBox.style.display    = 'none';
  if (mapBtn)    mapBtn.style.display    = 'flex';
  if (repickBtn) repickBtn.style.display = 'none';
  openMapModal();
}