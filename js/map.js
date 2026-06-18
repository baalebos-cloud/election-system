// ============================================================
//  js/map.js  —  Pure ES5
//  Dashboard map, GPS picker, manual coords
// ============================================================

var dashMap      = null;
var pickerMap    = null;
var pickerMarker = null;
var pickedLat    = null;
var pickedLng    = null;

// ── DASHBOARD MAP ─────────────────────────────────────────
function initDashMap() {
  if (!document.getElementById('dash-map')) return;
  if (dashMap) { dashMap.invalidateSize(); return; }

  dashMap = L.map('dash-map', { zoomControl:true, scrollWheelZoom:false }).setView([7.72,5.31],9);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; OpenStreetMap', maxZoom: 18
  }).addTo(dashMap);

  var i;
  for (i = 0; i < ALL_POLLING_UNITS.length; i++) {
    (function(u) {
      var rep    = reportedResults[u.code];
      var circle = L.circleMarker([u.lat, u.lng], {
        radius: rep ? 8 : 4,
        fillColor: rep ? '#00B04F' : '#E8A020',
        color: '#fff', weight: 1.5, opacity: 1, fillOpacity: 0.85
      }).addTo(dashMap);

      var pop = '<b>' + u.code + '</b><br>' + u.name + '<br>' + u.ward + ' &middot; ' + u.lga;
      if (rep) {
        var entries = [], k;
        for (k in rep.results) entries.push([k, rep.results[k]]);
        entries.sort(function(a,b){return b[1]-a[1];});
        if (entries.length) {
          var top = entries[0];
          var p   = null;
          var j;
          for (j = 0; j < PARTIES.length; j++) { if (PARTIES[j].id === top[0]) { p = PARTIES[j]; break; } }
          if (p) pop += '<br><span style="color:' + p.color + ';font-weight:600">Leading: ' + p.abbr + ' (' + top[1].toLocaleString() + ')</span>';
        }
      } else {
        pop += '<br><span style="color:#E8A020">Awaiting results</span>';
      }
      circle.bindPopup(pop);
    })(ALL_POLLING_UNITS[i]);
  }

  var legend = L.control({ position: 'bottomright' });
  legend.onAdd = function() {
    var d = L.DomUtil.create('div');
    d.style.cssText = 'background:#fff;padding:7px 10px;border-radius:8px;font-size:11px;box-shadow:0 2px 8px rgba(0,0,0,.15)';
    d.innerHTML = '<b style="display:block;margin-bottom:4px">Status</b>' +
      '<div style="display:flex;align-items:center;gap:5px;margin-bottom:2px">' +
        '<div style="width:9px;height:9px;border-radius:50%;background:#00B04F"></div>Reported</div>' +
      '<div style="display:flex;align-items:center;gap:5px">' +
        '<div style="width:6px;height:6px;border-radius:50%;background:#E8A020;margin-left:1px"></div>Pending</div>';
    return d;
  };
  legend.addTo(dashMap);
}

// ── AGENT MAP PICKER ──────────────────────────────────────
function openMapModal() {
  var modal = document.getElementById('map-modal');
  if (!modal) return;
  modal.classList.add('open');

  setTimeout(function() {
    var center = agentPU ? [agentPU.lat, agentPU.lng] : [7.72, 5.31];
    var zoom   = agentPU ? 14 : 10;

    if (pickerMap) {
      pickerMap.invalidateSize({ animate: false });
      pickerMap.setView(center, zoom);
      if (pickedLat !== null && pickerMarker) {
        pickerMarker.remove();
        pickerMarker = L.marker([pickedLat, pickedLng]).addTo(pickerMap);
      }
      return;
    }

    pickerMap = L.map('picker-map', { center: center, zoom: zoom, scrollWheelZoom: true });
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap', maxZoom: 19
    }).addTo(pickerMap);

    if (agentPU) {
      L.circleMarker([agentPU.lat, agentPU.lng], {
        radius: 10, fillColor: '#1A6FA8', color: '#fff', weight: 2, opacity: 1, fillOpacity: 0.8
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

// ── GPS ───────────────────────────────────────────────────
function useGPS() {
  if (!navigator.geolocation) {
    showManualCoordPanel();
    toast('GPS not available \u2014 enter coordinates manually', 'warn');
    return;
  }
  toast('Requesting GPS...', 'info');
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
          .bindPopup('GPS: ' + pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6))
          .openPopup();
        var cd = document.getElementById('picked-coords');
        if (cd) cd.textContent = 'GPS \u2014 ' + pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6) + ' (\u00b1' + acc + 'm)';
        toast('GPS acquired (\u00b1' + acc + 'm)', 'ok');
      }
      plotGPS();
    },
    function(err) {
      SEC.log('warn', 'GPS failed', 'Code: ' + err.code);
      showManualCoordPanel();
      if (agentPU) {
        var ml = document.getElementById('manual-lat');
        var mg = document.getElementById('manual-lng');
        var mm = document.getElementById('manual-coord-msg');
        if (ml) ml.value = agentPU.lat.toFixed(6);
        if (mg) mg.value = agentPU.lng.toFixed(6);
        if (mm) { mm.textContent = 'GPS unavailable. Pre-filled with unit coordinates.'; mm.style.color = 'var(--gold)'; }
      }
      toast('GPS unavailable \u2014 use manual entry or click the map', 'warn');
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
  );
}

function showManualCoordPanel() {
  var p = document.getElementById('manual-coord-panel');
  if (p) p.style.display = 'block';
}

function applyManualCoords() {
  var latEl = document.getElementById('manual-lat');
  var lngEl = document.getElementById('manual-lng');
  if (!latEl || !lngEl) return;
  var lat = parseFloat(latEl.value);
  var lng = parseFloat(lngEl.value);
  if (isNaN(lat) || isNaN(lng)) { toast('Enter valid decimal coordinates', 'err'); return; }
  if (lat < 6.5 || lat > 9.0 || lng < 4.0 || lng > 6.5) toast('Coordinates may be outside Ekiti \u2014 verify', 'warn');
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
    if (cd) cd.textContent = 'Manual \u2014 ' + pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6);
  }
  plotManual();
  toast('Coordinates applied \u2014 click Confirm to save', 'ok');
}

function useUnitCoords() {
  if (!agentPU) { toast('Select a polling unit first', 'warn'); return; }
  var ml = document.getElementById('manual-lat');
  var mg = document.getElementById('manual-lng');
  if (ml) ml.value = agentPU.lat.toFixed(6);
  if (mg) mg.value = agentPU.lng.toFixed(6);
  showManualCoordPanel();
  applyManualCoords();
}

function confirmLoc() {
  if (pickedLat === null) { toast('Click the map or enter coordinates first', 'warn'); return; }
  closeMap();
  var lb = document.getElementById('loc-box');
  var mb = document.getElementById('map-btn');
  var rp = document.getElementById('repick-btn');
  var ln = document.getElementById('loc-nm');
  var lc = document.getElementById('loc-coords');
  if (lb) lb.style.display = 'flex';
  if (mb) mb.style.display = 'none';
  if (rp) rp.style.display = 'block';
  if (ln) ln.textContent   = 'Location confirmed \u2713';
  if (lc) lc.textContent   = pickedLat.toFixed(6) + ', ' + pickedLng.toFixed(6);
  toast('Location confirmed', 'ok');
}

function reopenMap() {
  var lb = document.getElementById('loc-box');
  var mb = document.getElementById('map-btn');
  var rp = document.getElementById('repick-btn');
  if (lb) lb.style.display = 'none';
  if (mb) mb.style.display = 'flex';
  if (rp) rp.style.display = 'none';
  openMapModal();
}
