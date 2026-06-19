// ============================================================
//  js/results.js  —  Pure ES5
//  PU picker, results form, evidence upload, submit,
//  dashboard render, live results screen, security screen
//  LIVE DATA: Fetches real agents and results from API
// ============================================================

var API_BASE = window.location.origin;
var reportedResults = {};
var totalSubCount = 0;
var liveAgents = [];
var liveFeed = [];

// Party colors lookup
var PARTY_COLORS = {
  'APC': '#006B3F',
  'PDP': '#E30A17',
  'LP': '#1A6FA8',
  'NNPP': '#E8A020',
  'SDP': '#BF360C',
  'APGA': '#4CAF50',
  'ADC': '#9C27B0',
  'YPP': '#FF9800',
  'ZLP': '#795548',
  'AAC': '#607D8B',
  'NRM': '#3F51B5',
  'PRP': '#E91E63'
};

// ── HTML ESCAPE HELPER ────────────────────────────────────
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// ── FETCH LIVE DATA FROM API ──────────────────────────────
function fetchLiveAgents() {
  fetch(API_BASE + '/api/agents/list')
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.agents) {
        liveAgents = data.agents;
        renderAgentMon();
        updateAgentCount();
      }
    })
    .catch(function(err) {
      console.error('Failed to fetch agents:', err);
    });
}

function fetchLiveResults() {
  fetch(API_BASE + '/api/results/live')
    .then(function(response) { return response.json(); })
    .then(function(data) {
      if (data.results) {
        reportedResults = {};
        liveFeed = [];
        data.results.forEach(function(r) {
          reportedResults[r.unit_code] = {
            code: r.unit_code,
            name: r.unit_name || r.unit_code,
            ward: r.ward || '',
            lga: r.lga || '',
            lat: r.lat,
            lng: r.lng,
            results: typeof r.votes === 'string' ? JSON.parse(r.votes) : r.votes,
            time: r.submitted_at ? new Date(r.submitted_at).toTimeString().slice(0, 5) : '',
            evidenceUrl: r.evidence_url,
            agentId: r.agent_id,
            hash: r.integrity_hash,
            submittedAt: r.submitted_at
          };
          // Build live feed
          liveFeed.push({
            u: r.unit_code,
            lga: r.lga || '',
            d: 'Results submitted — ' + r.total_votes + ' votes counted',
            time: r.submitted_at,
            agentId: r.agent_id
          });
        });
        totalSubCount = data.count;
        refreshDashDisplay();
        renderResults();
      }
    })
    .catch(function(err) {
      console.error('Failed to fetch results:', err);
    });
}

function updateAgentCount() {
  var onlineCount = liveAgents.filter(function(a) { return a.status === 'on'; }).length;
  var el = document.getElementById('st-agents');
  if (el) el.textContent = onlineCount;
}

// ── POLLING UNIT PICKER (FIXED) ───────────────────────────
function filterAPU() {
  var lgaEl  = document.getElementById('a-lga-filt');
  var srchEl = document.getElementById('a-pu-srch');
  var dd     = document.getElementById('a-pu-dd');
  var cntEl  = document.getElementById('pu-count');
  if (!lgaEl || !srchEl || !dd) return;

  var lga  = lgaEl.value;
  var q    = srchEl.value.toLowerCase().trim();
  var list = ALL_POLLING_UNITS;
  var i, u, html, idx;

  if (lga) list = list.filter(function(u){ return u.lga === lga; });
  if (q)   list = list.filter(function(u){
    return u.code.toLowerCase().indexOf(q) > -1 ||
           u.name.toLowerCase().indexOf(q) > -1 ||
           u.ward.toLowerCase().indexOf(q) > -1;
  });

  if (cntEl) cntEl.textContent = list.length + ' unit' + (list.length !== 1 ? 's' : '');
  if (!q && !lga) { dd.classList.remove('open'); return; }
  if (!list.length) {
    dd.innerHTML = '<div class="pu-opt" style="color:var(--tm);font-style:italic">No units found \u2014 try a different search</div>';
    dd.classList.add('open');
    return;
  }

  html = '';
  for (i = 0; i < Math.min(list.length, 80); i++) {
    u = list[i];
    idx = ALL_POLLING_UNITS.indexOf(u);
    html += '<div class="pu-opt" data-pu-index="' + idx + '">' +
      '<div class="pu-code">' + escapeHtml(u.code) + '</div>' +
      '<div class="pu-name">' + escapeHtml(u.name) + '</div>' +
      '<div class="pu-meta">' + escapeHtml(u.ward) + ' &middot; ' + escapeHtml(u.lga) + '</div></div>';
  }
  if (list.length > 80) {
    html += '<div class="pu-opt" style="color:var(--tm);font-style:italic">&hellip; and ' + (list.length - 80) + ' more \u2014 type to narrow</div>';
  }
  dd.innerHTML = html;
  dd.classList.add('open');
}

function openAPUDD() {
  var lga = document.getElementById('a-lga-filt') ? document.getElementById('a-lga-filt').value : '';
  var dd  = document.getElementById('a-pu-dd');
  var list = lga ? ALL_POLLING_UNITS.filter(function(u){ return u.lga === lga; }) : ALL_POLLING_UNITS;
  var show = list.slice(0, 80);
  var html = '', i, u, idx;
  for (i = 0; i < show.length; i++) {
    u = show[i];
    idx = ALL_POLLING_UNITS.indexOf(u);
    html += '<div class="pu-opt" data-pu-index="' + idx + '">' +
      '<div class="pu-code">' + escapeHtml(u.code) + '</div>' +
      '<div class="pu-name">' + escapeHtml(u.name) + '</div>' +
      '<div class="pu-meta">' + escapeHtml(u.ward) + ' &middot; ' + escapeHtml(u.lga) + '</div></div>';
  }
  if (!lga) html += '<div class="pu-opt" style="color:var(--tm);font-style:italic">Select an LGA or type to search all 2,195 units</div>';
  if (dd) { dd.innerHTML = html; dd.classList.add('open'); }
}

function searchAPU() {
  filterAPU();
  var dd = document.getElementById('a-pu-dd');
  if (dd) dd.classList.add('open');
}

function selAPU(u) {
  agentPU = u;
  var s = document.getElementById('a-pu-srch');
  var d = document.getElementById('a-pu-dd');
  var h = document.getElementById('unit-hdr');
  if (s) s.value = u.code + ' \u2014 ' + u.name;
  if (d) d.classList.remove('open');
  if (h) h.textContent = u.code;
  renderAgentPUSel(u);
  updateChain();
}

function renderAgentPUSel(u) {
  var el = document.getElementById('a-pu-sel');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = '<div class="pu-sel">' +
    '<div class="pu-sel-code">' + escapeHtml(u.code) + '</div>' +
    '<div class="pu-sel-name">' + escapeHtml(u.name) + '</div>' +
    '<div class="pu-sel-meta">' + escapeHtml(u.ward) + ' &middot; ' + escapeHtml(u.lga) + ' &middot; ' + u.lat.toFixed(5) + ', ' + u.lng.toFixed(5) + '</div>' +
    '</div>';
}

// ── EVENT DELEGATION FOR AGENT PORTAL DROPDOWN ────────────
document.addEventListener('click', function(e) {
  var puOpt = e.target.closest('.pu-opt[data-pu-index]');
  if (puOpt) {
    var puDd = puOpt.closest('#a-pu-dd');
    if (puDd) {
      var puIdx = parseInt(puOpt.getAttribute('data-pu-index'), 10);
      if (!isNaN(puIdx) && ALL_POLLING_UNITS[puIdx]) {
        selAPU(ALL_POLLING_UNITS[puIdx]);
      }
      return;
    }
  }
  
  if (!e.target.closest('#a-pu-srch') && !e.target.closest('#a-pu-dd')) {
    var add = document.getElementById('a-pu-dd');
    if (add) add.classList.remove('open');
  }
});

// ── RESULTS FORM ──────────────────────────────────────────
function buildResultsForm() {
  var container = document.getElementById('rform');
  if (!container) return;
  var html = '', i, p;
  for (i = 0; i < PARTIES.length; i++) {
    p = PARTIES[i];
    html += '<div class="rrow">' +
      '<div class="rr-p">' +
        '<div class="plog" style="background:' + p.color + '">' + p.abbr.slice(0,2) + '</div>' +
        '<div><div class="pabbr">' + p.abbr + '</div>' +
        '<div class="pfull">' + p.name + '</div></div></div>' +
      '<input type="number" class="rr-inp" id="v-' + p.id + '" min="0" value="0" oninput="calcTotals()">' +
      '<span class="rr-lbl">votes</span></div>';
  }
  container.innerHTML = html;
  calcTotals();
}

function calcTotals() {
  var tot = 0, maxV = 0, lead = null, i, p, el, v;
  for (i = 0; i < PARTIES.length; i++) {
    p  = PARTIES[i];
    el = document.getElementById('v-' + p.id);
    v  = el ? (parseInt(el.value) || 0) : 0;
    tot += v;
    if (v > maxV) { maxV = v; lead = p; }
  }
  var tv = document.getElementById('tot-votes');
  var lp = document.getElementById('lead-party');
  if (tv) tv.textContent = tot.toLocaleString();
  if (lp) lp.textContent = (lead && maxV > 0) ? lead.abbr + ' (' + maxV.toLocaleString() + ')' : '\u2014';
  updateChain();
}

function updateChain() {
  var votes = {}, i, p, el;
  for (i = 0; i < PARTIES.length; i++) {
    p  = PARTIES[i];
    el = document.getElementById('v-' + p.id);
    votes[p.id] = el ? (parseInt(el.value) || 0) : 0;
  }
  var h  = SEC.hash({ votes: votes, unit: agentPU ? agentPU.code : '', agent: currentAgent ? currentAgent.id : '' });
  var cd = document.getElementById('chain-disp');
  var ci = document.getElementById('chain-ind');
  if (cd) cd.textContent = 'Integrity hash: ' + h + ' \u00b7 ' + new Date().toTimeString().slice(0,8);
  if (ci) ci.textContent = 'HASH: ' + h;
}

// ── EVIDENCE UPLOAD ───────────────────────────────────────
function handleEvidence() {
  var inp = document.getElementById('ev-inp');
  if (!inp || !inp.files || !inp.files[0]) { toast('No file selected', 'warn'); return; }
  var file    = inp.files[0];
  var allowed = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','application/pdf'];
  var ok = false, i;
  for (i = 0; i < allowed.length; i++) { if (file.type === allowed[i]) { ok = true; break; } }
  if (!ok)                          { toast('Only JPG, PNG or PDF allowed', 'err'); return; }
  if (file.size > 10*1024*1024)     { toast('File too large \u2014 max 10MB', 'err'); return; }

  toast('Reading file...', 'info');
  var reader = new FileReader();
  reader.onload = function(e) {
    evidenceDataUrl = e.target.result;
    var thumb = document.getElementById('ev-thumb');
    var upBox = document.getElementById('ev-up');
    var info  = document.getElementById('ev-info');
    var fname = document.getElementById('ev-filename');
    if (file.type.indexOf('image') === 0 && thumb) {
      thumb.src           = evidenceDataUrl;
      thumb.style.display = 'block';
      thumb.classList.add('show');
    }
    if (upBox) upBox.classList.add('done');
    if (info)  info.style.display  = 'block';
    if (fname) fname.textContent   = file.name + ' (' + Math.round(file.size/1024) + 'KB)';
    toast('EC8A sheet uploaded \u2713', 'ok');
    SEC.log('ok', 'Evidence uploaded', (currentAgent ? currentAgent.id : '?') + ' ' + file.name);
  };
  reader.onerror = function() { toast('Failed to read file \u2014 try again', 'err'); };
  reader.readAsDataURL(file);
}

// ── SUBMIT ────────────────────────────────────────────────
function submitResults() {
  if (!currentAgent)      return;
  if (!agentPU)           { toast('Select a polling unit first', 'warn'); return; }
  if (pickedLat === null) { toast('Set your GPS location on the map first', 'warn'); return; }
  if (!evidenceDataUrl)   { toast('Upload the EC8A result sheet photo first', 'warn'); return; }

  var votes = {}, total = 0, i, p, el, v;
  for (i = 0; i < PARTIES.length; i++) {
    p  = PARTIES[i];
    el = document.getElementById('v-' + p.id);
    v  = el ? (parseInt(el.value) || 0) : 0;
    votes[p.id] = v; total += v;
  }
  if (total === 0) { toast('Enter vote counts before submitting', 'warn'); return; }

  var submitBtn = document.getElementById('sub-btn');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Submitting...'; }

  fetch(API_BASE + '/api/results/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + authToken
    },
    body: JSON.stringify({
      unitCode: agentPU.code,
      votes: votes,
      lat: pickedLat,
      lng: pickedLng,
      evidenceBase64: evidenceDataUrl,
      officerName: document.getElementById('officer') ? document.getElementById('officer').value : null,
      registeredVoters: document.getElementById('reg-v') ? parseInt(document.getElementById('reg-v').value) || null : null,
      accreditedVoters: document.getElementById('acc-v') ? parseInt(document.getElementById('acc-v').value) || null : null,
      rejectedBallots: document.getElementById('rej-v') ? parseInt(document.getElementById('rej-v').value) || 0 : 0,
      remarks: document.getElementById('remarks') ? document.getElementById('remarks').value : null
    })
  })
  .then(function(response) { return response.json(); })
  .then(function(result) {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Transmit Results to Central Server'; }

    if (!result.success) {
      toast(result.error || 'Submission failed', 'err');
      return;
    }

    totalSubCount++;
    var ss = document.getElementById('sb-subs');
    if (ss) ss.textContent = totalSubCount;

    var now = new Date();
    var sl = document.getElementById('sub-log');
    if (sl) sl.innerHTML = '<div style="background:var(--gl);border:1px solid rgba(0,176,79,.2);border-radius:var(--r6);padding:7px 9px">' +
      '<div style="font-weight:700;color:var(--gd);font-size:10px">\u2705 Submitted</div>' +
      '<div style="font-family:\'JetBrains Mono\',monospace;font-size:9px;color:var(--tm)">' + result.refId.slice(0,18) + '</div>' +
      '<div style="font-size:9px;color:var(--tm)">' + now.toTimeString().slice(0,8) + '</div></div>';

    var rows = [
      ['Ref ID',      result.refId.slice(0,20)],
      ['Unit',        agentPU.code],
      ['Agent',       currentAgent.id],
      ['Total Votes', total.toLocaleString()],
      ['GPS',         pickedLat.toFixed(5) + ', ' + pickedLng.toFixed(5)],
      ['Time',        now.toTimeString().slice(0,8)],
      ['Hash',        result.hash]
    ];
    var rHtml = '', j;
    for (j = 0; j < rows.length; j++) {
      rHtml += '<div class="rc-r"><span class="rc-l">' + rows[j][0] + '</span><span class="rc-v">' + rows[j][1] + '</span></div>';
    }
    var sr = document.getElementById('sub-receipt');
    if (sr) sr.innerHTML = rHtml;

    var body  = document.getElementById('agent-body');
    var sucOv = document.getElementById('suc-ov');
    if (body)  body.style.display = 'none';
    if (sucOv) sucOv.classList.add('show');

    SEC.log('ok', 'Results submitted: ' + agentPU.code, 'Ref: ' + result.refId + ' Votes: ' + total);
    fetchLiveResults();
    toast('Results sealed and transmitted \u2713', 'ok');
  })
  .catch(function(err) {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.innerHTML = '<i class="fas fa-paper-plane"></i> Transmit Results to Central Server'; }
    console.error('Submit error:', err);
    toast('Submission failed \u2014 check your connection', 'err');
  });
}

function resetForm() {
  var sucOv = document.getElementById('suc-ov');
  var body  = document.getElementById('agent-body');
  var thumb = document.getElementById('ev-thumb');
  var evUp  = document.getElementById('ev-up');
  var evInfo= document.getElementById('ev-info');
  var evInp = document.getElementById('ev-inp');
  if (sucOv) sucOv.classList.remove('show');
  if (body)  body.style.display = 'grid';
  evidenceDataUrl = null;
  if (thumb)  { thumb.classList.remove('show'); thumb.style.display = 'none'; }
  if (evUp)   evUp.classList.remove('done');
  if (evInfo) evInfo.style.display = 'none';
  if (evInp)  evInp.value = '';
  buildResultsForm();
}

// ── DASHBOARD ─────────────────────────────────────────────
function refreshDash() {
  fetchLiveAgents();
  fetchLiveResults();
}

function refreshDashDisplay() {
  var rep = 0, tot = 0, k, u, v, j;
  for (k in reportedResults) {
    rep++;
    u = reportedResults[k];
    for (j = 0; j < PARTIES.length; j++) {
      v = u.results ? (u.results[PARTIES[j].id] || 0) : 0;
      tot += v;
    }
  }
  var ids = ['st-rep','st-votes','st-alerts','st-subs'];
  var vals = [
    rep,
    tot.toLocaleString(),
    SEC.auditLog.filter(function(e){ return e.type === 'crit'; }).length,
    totalSubCount
  ];
  var el, i;
  for (i = 0; i < ids.length; i++) {
    el = document.getElementById(ids[i]);
    if (el) el.textContent = vals[i];
  }
  var pb = document.getElementById('pct-bdg');
  if (pb) pb.textContent = Math.round(rep / 2195 * 100) + '% reported';
  renderPartyTable();
  renderFeed();
}

function renderPartyTable() {
  var tbl = document.getElementById('rtbl');
  if (!tbl) return;
  var tots = {}, i, p, grand = 0, sorted, v, pct, bw, tr, badge;
  for (i = 0; i < PARTIES.length; i++) tots[PARTIES[i].id] = 0;
  var k, u;
  for (k in reportedResults) {
    u = reportedResults[k];
    for (i = 0; i < PARTIES.length; i++) {
      tots[PARTIES[i].id] += (u.results && u.results[PARTIES[i].id]) ? u.results[PARTIES[i].id] : 0;
    }
  }
  for (k in tots) grand += tots[k];
  sorted = PARTIES.slice().sort(function(a,b){ return tots[b.id]-tots[a.id]; });
  tbl.innerHTML = '<tr><th style="padding-left:12px">Party</th><th>Votes</th><th style="width:150px">Share</th><th>%</th></tr>';
  for (i = 0; i < sorted.length; i++) {
    p     = sorted[i];
    v     = tots[p.id];
    pct   = grand > 0 ? (v/grand*100).toFixed(1) : '0.0';
    bw    = grand > 0 ? (v/grand*100).toFixed(1)  : '0';
    badge = i === 0 && v > 0 ? '<span style="font-size:8px;background:var(--gol);color:#7a5600;padding:1px 5px;border-radius:20px;font-weight:700">\uD83C\uDFC6 Leading</span>' : '';
    tr    = document.createElement('tr');
    tr.innerHTML =
      '<td><div style="display:flex;align-items:center;gap:6px;padding:0 4px">' +
        '<div style="width:20px;height:20px;border-radius:3px;background:' + p.color + ';display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:800;color:#fff;flex-shrink:0">' + p.abbr.slice(0,2) + '</div>' +
        '<div><div style="font-weight:700;font-size:10px">' + p.abbr + '</div>' + badge + '</div>' +
      '</div></td>' +
      '<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;font-size:10px">' + v.toLocaleString() + '</td>' +
      '<td><div style="background:var(--g100);height:4px;border-radius:2px;overflow:hidden">' +
        '<div style="width:' + bw + '%;background:' + p.color + ';height:100%;border-radius:2px"></div>' +
      '</div></td>' +
      '<td style="font-size:9px;color:var(--tm);font-weight:600">' + pct + '%</td>';
    tbl.appendChild(tr);
  }
}

function renderFeed() {
  var list = document.getElementById('feed-list');
  var bdg  = document.getElementById('feed-bdg');
  if (!list) return;
  list.innerHTML = '';
  
  if (liveFeed.length === 0) {
    list.innerHTML = '<div style="text-align:center;color:var(--tm);padding:20px;font-size:11px">No results submitted yet</div>';
    if (bdg) bdg.textContent = '0 updates';
    return;
  }

  var i, f, d, el, age;
  for (i = 0; i < Math.min(liveFeed.length, 15); i++) {
    f  = liveFeed[i];
    d  = f.time ? new Date(f.time) : new Date();
    var minsAgo = (Date.now() - d.getTime()) / 60000;
    if (minsAgo < 5) age = 'fn';
    else if (minsAgo < 30) age = 'fr';
    else if (minsAgo < 60) age = 'fo';
    else age = 'fa';
    
    el = document.createElement('div');
    el.className = 'fi';
    el.innerHTML = '<div class="fdot ' + age + '"></div>' +
      '<div style="flex:1"><div class="fu">' + escapeHtml(f.u) + ' &middot; ' + escapeHtml(f.lga) + '</div>' +
      '<div class="fd">' + escapeHtml(f.d) + '</div></div>' +
      '<div class="ft">' + d.toTimeString().slice(0,5) + '</div>';
    list.appendChild(el);
  }
  if (bdg) bdg.textContent = liveFeed.length + ' update' + (liveFeed.length !== 1 ? 's' : '');
}

function renderAgentMon() {
  var mon = document.getElementById('agent-mon');
  if (!mon) return;

  if (liveAgents.length === 0) {
    mon.innerHTML = '<div style="text-align:center;color:var(--tm);padding:20px;font-size:11px">No agents registered yet</div>';
    return;
  }

  var html = '', i, a, init, sl, sc, col;
  for (i = 0; i < Math.min(liveAgents.length, 10); i++) {
    a = liveAgents[i];
    init = a.name ? a.name.split(' ').map(function(n){ return n[0]; }).join('').toUpperCase() : '?';
    col = PARTY_COLORS[a.party] || '#00B04F';
    
    if (a.status === 'on') {
      sl = 'Online';
      sc = 'var(--g)';
    } else if (a.status === 'pend') {
      sl = 'Away';
      sc = 'var(--gold)';
    } else {
      sl = 'Offline';
      sc = 'var(--g400)';
    }
    
    html += '<div class="ami">' +
      '<div class="ami-av" style="background:' + col + '">' + init + '</div>' +
      '<div style="flex:1"><div class="ami-nm">' + escapeHtml(a.name) + '</div>' +
      '<div class="ami-u">' + escapeHtml(a.unit_code) + ' &middot; ' + escapeHtml(a.party) + ' &middot; ' + escapeHtml(a.lga) + '</div></div>' +
      '<div class="ami-s" style="color:' + sc + '"><div class="sdot ' + a.status + '"></div>' + sl + '</div></div>';
  }
  mon.innerHTML = html;
}

// ── LIVE RESULTS ──────────────────────────────────────────
function renderResults() {
  renderLGAChips();
  renderUnitCards('all');
}

function renderLGAChips() {
  var el = document.getElementById('lga-chips');
  if (!el) return;
  el.innerHTML = '';
  var all = document.createElement('button');
  all.className   = 'chip active';
  all.textContent = 'All LGAs';
  all.onclick = function(){ setChip(all); renderUnitCards('all'); };
  el.appendChild(all);
  var lgas = [], k, u;
  for (k in reportedResults) {
    u = reportedResults[k];
    if (lgas.indexOf(u.lga) === -1 && u.lga) lgas.push(u.lga);
  }
  lgas.sort();
  var i, c;
  for (i = 0; i < lgas.length; i++) {
    c = document.createElement('button');
    c.className   = 'chip';
    c.textContent = lgas[i];
    (function(lga){ c.onclick = function(){ setChip(c); renderUnitCards(lga); }; })(lgas[i]);
    el.appendChild(c);
  }
}

function setChip(chip) {
  var chips = document.querySelectorAll('.chip');
  var i;
  for (i = 0; i < chips.length; i++) chips[i].classList.remove('active');
  chip.classList.add('active');
}

function filterUnits() {
  var active = document.querySelector('.chip.active');
  var lga    = active ? active.textContent : 'All LGAs';
  renderUnitCards(lga === 'All LGAs' ? 'all' : lga);
}

function renderUnitCards(lgaFilter) {
  var grid = document.getElementById('unit-grid');
  if (!grid) return;
  grid.innerHTML = '';
  var srch = document.getElementById('u-srch');
  var q    = srch ? srch.value.toLowerCase() : '';
  var units = [], k, u;
  for (k in reportedResults) {
    u = reportedResults[k];
    var ml = lgaFilter === 'all' || u.lga === lgaFilter;
    var ms = !q || u.code.toLowerCase().indexOf(q) > -1 || (u.name && u.name.toLowerCase().indexOf(q) > -1) || (u.lga && u.lga.toLowerCase().indexOf(q) > -1);
    if (ml && ms) units.push(u);
  }
  if (!units.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--tm);padding:30px;font-size:12px">No results match your filter.</div>';
    return;
  }
  var i, j, p, v, pct, tot, sorted, leadP, leadCol, evHtml, bars, agRow, hRow, card;
  for (i = 0; i < units.length; i++) {
    u   = units[i];
    tot = 0;
    for (j = 0; j < PARTIES.length; j++) tot += (u.results[PARTIES[j].id] || 0);
    sorted = PARTIES.slice().sort(function(a,b){ return (u.results[b.id]||0)-(u.results[a.id]||0); });
    leadP   = sorted[0] || {};
    leadCol = PARTY_COLORS[leadP.id] || '#000';

    evHtml = u.evidenceUrl
      ? '<img class="ev-sm" src="' + u.evidenceUrl + '" alt="EC8A" onclick="openLB(this.src)" title="View EC8A sheet">'
      : '<span style="font-size:8px;color:var(--tm)">No image</span>';

    bars = '';
    for (j = 0; j < Math.min(sorted.length, 6); j++) {
      p   = sorted[j];
      v   = u.results[p.id] || 0;
      pct = tot > 0 ? (v/tot*100).toFixed(1) : '0';
      bars += '<div class="mbr">' +
        '<div class="mp" style="background:' + p.color + '">' + p.abbr.slice(0,2) + '</div>' +
        '<div class="mbt"><div class="mbf" style="width:' + pct + '%;background:' + p.color + '"></div></div>' +
        '<div class="mv">' + v.toLocaleString() + '</div></div>';
    }
    agRow = u.agentId ? '<div style="font-size:8px;color:var(--tm);margin-top:3px;font-family:\'JetBrains Mono\',monospace">Agent: ' + escapeHtml(u.agentId) + '</div>' : '';
    hRow  = u.hash    ? '<div style="font-size:8px;color:var(--tm);margin-top:1px;font-family:\'JetBrains Mono\',monospace">Hash: '  + escapeHtml(u.hash)    + '</div>' : '';

    card = document.createElement('div');
    card.className = 'ruc';
    card.innerHTML =
      '<div class="ruc-h">' +
        '<div><div class="ruc-code">' + escapeHtml(u.code) + '</div>' +
        '<div class="ruc-nm">' + escapeHtml(u.name || '') + ' &middot; ' + escapeHtml(u.ward||'') + '</div>' +
        '<div class="ruc-nm" style="color:var(--blue)">' + escapeHtml(u.lga || '') + '</div></div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">' +
          '<div class="ruc-time">' + (u.time||'') + '</div>' + evHtml +
        '</div>' +
      '</div>' +
      '<div class="ruc-b">' + bars +
        '<div style="margin-top:7px;padding-top:6px;border-top:1px solid var(--g100);display:flex;justify-content:space-between;font-size:9px;color:var(--tm)">' +
          '<span>Total: <strong style="color:var(--tp)">' + tot.toLocaleString() + '</strong></span>' +
          '<span style="color:' + leadCol + ';font-weight:700">' + (leadP.abbr||'\u2014') + ' leading</span>' +
        '</div>' + agRow + hRow +
      '</div>';
    grid.appendChild(card);
  }
}

function openLB(src) {
  var lb  = document.getElementById('lightbox');
  var img = document.getElementById('lb-img');
  if (lb && img) { img.src = src; lb.classList.add('open'); }
}
function closeLightbox() {
  var lb = document.getElementById('lightbox');
  if (lb) lb.classList.remove('open');
}

// ── SECURITY SCREEN ───────────────────────────────────────
function renderSecLog() {
  var el = document.getElementById('sec-log');
  if (!el) return;
  var html = '', i, e, cls, ic;
  for (i = 0; i < Math.min(SEC.auditLog.length, 100); i++) {
    e   = SEC.auditLog[i];
    cls = e.type==='crit'?'ev-c':e.type==='warn'?'ev-w':e.type==='ok'?'ev-k':'ev-i';
    ic  = e.type==='crit'?'\u26D4':e.type==='warn'?'\u26A0\uFE0F':e.type==='ok'?'\u2705':'\u2139\uFE0F';
    html += '<div class="sev"><div class="sev-ic ' + cls + '">' + ic + '</div>' +
      '<div class="sev-msg">' + escapeHtml(e.msg) + (e.detail ? '<br><span style="font-size:8px;opacity:.7">' + escapeHtml(e.detail) + '</span>' : '') + '</div>' +
      '<div class="sev-ts">' + e.time + '</div></div>';
  }
  el.innerHTML = html;
}

function updateSecStats() {
  var ids = ['sec-sessions','sec-blocked','sec-failed','sec-events'];
  var onlineCount = liveAgents.filter(function(a) { return a.status === 'on'; }).length;
  var vals = [onlineCount, SEC.blockedSessions.length, SEC.attempts, SEC.auditLog.length];
  var i, el;
  for (i = 0; i < ids.length; i++) {
    el = document.getElementById(ids[i]);
    if (el) el.textContent = vals[i];
  }
  var bb = document.getElementById('blocked-bdg');
  if (bb) bb.textContent = SEC.blockedSessions.length + ' blocked';
  renderBlockedList();
  renderThreatGauges();
}

function renderBlockedList() {
  var el = document.getElementById('blocked-list');
  if (!el) return;
  if (!SEC.blockedSessions.length) {
    el.innerHTML = '<div style="font-size:10px;color:var(--tm);text-align:center;padding:7px">No blocked sessions</div>';
    return;
  }
  var html = '', i, s;
  for (i = 0; i < SEC.blockedSessions.length; i++) {
    s = SEC.blockedSessions[i];
    html += '<div class="ip-item"><div><div class="ip-addr">' + escapeHtml(s.addr) + '</div><div class="ip-rsn">' + escapeHtml(s.reason) + '</div></div><div class="ip-t">' + s.time + '</div></div>';
  }
  el.innerHTML = html;
}

function renderThreatGauges() {
  var el = document.getElementById('threat-gauges');
  if (!el) return;
  var warnCount = SEC.auditLog.filter(function(e){ return e.type==='warn'; }).length;
  var injCount  = SEC.auditLog.filter(function(e){ return e.msg.indexOf('njection') > -1; }).length;
  var gauges = [
    {label:'Brute Force Risk',   val:Math.min(100,SEC.attempts*20), color:'var(--red)'},
    {label:'Login Anomalies',    val:Math.min(100,warnCount*12),    color:'var(--ora)'},
    {label:'Injection Attempts', val:Math.min(100,injCount*30),     color:'var(--pur)'},
    {label:'System Integrity',   val:100,                            color:'var(--g)'}
  ];
  var html = '', i, g;
  for (i = 0; i < gauges.length; i++) {
    g = gauges[i];
    html += '<div style="margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px">' +
        '<span style="color:var(--ts)">' + g.label + '</span>' +
        '<span style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:' + g.color + '">' + g.val + '%</span>' +
      '</div>' +
      '<div style="height:5px;background:var(--g100);border-radius:3px;overflow:hidden">' +
        '<div style="height:100%;width:' + g.val + '%;background:' + g.color + ';border-radius:3px;transition:width .5s"></div>' +
      '</div></div>';
  }
  el.innerHTML = html;
}

function updateThreatBanner() {
  var banner = document.getElementById('threat-banner');
  var msg    = document.getElementById('threat-msg');
  var detail = document.getElementById('threat-detail');
  var secBar = document.getElementById('sec-bar');
  var secTxt = document.getElementById('sec-txt');
  if (!banner || !msg) return;
  var crit = SEC.auditLog.filter(function(e){ return e.type==='crit'; }).length;
  if (SEC.attempts >= 4 || SEC.blockedSessions.length > 0 || crit >= 2) {
    banner.className = 'threat thr-crit';
    msg.textContent  = '\uD83D\uDEA8 HIGH THREAT \u2014 Attacks detected';
    if (detail) detail.textContent = SEC.blockedSessions.length + ' blocked, ' + SEC.attempts + ' failed logins';
    if (secBar) { secBar.style.background='rgba(192,57,43,.2)'; secBar.style.borderColor='rgba(192,57,43,.4)'; secBar.style.color='var(--red)'; }
    if (secTxt) secTxt.textContent = '\u26A0 Alert';
  } else if (SEC.attempts >= 2) {
    banner.className = 'threat thr-warn';
    msg.textContent  = '\u26A0\uFE0F ELEVATED \u2014 Multiple failed logins';
    if (detail) detail.textContent = SEC.attempts + '/5 attempts used';
    if (secBar) { secBar.style.background='rgba(230,126,34,.15)'; secBar.style.borderColor='rgba(230,126,34,.3)'; secBar.style.color='var(--ora)'; }
    if (secTxt) secTxt.textContent = '\u26A0 Warning';
  } else {
    banner.className = 'threat thr-ok';
    msg.textContent  = '\u2705 System secured \u2014 Encrypted, monitored';
    if (detail) detail.textContent = '';
    if (secBar) { secBar.style.background='rgba(0,176,79,.1)'; secBar.style.borderColor='rgba(0,176,79,.25)'; secBar.style.color='#4ade80'; }
    if (secTxt) secTxt.textContent = 'Secure';
  }
}

// ── AUTO-REFRESH LIVE DATA ────────────────────────────────
setInterval(function() {
  var dash = document.getElementById('dashboard-screen');
  var results = document.getElementById('results-screen');
  if ((dash && dash.classList.contains('active')) || (results && results.classList.contains('active'))) {
    fetchLiveAgents();
    fetchLiveResults();
  }
}, 30000);
