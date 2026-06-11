// ============================================================
//  js/results.js
//  Results form, evidence upload, submission, live results
//  screen, dashboard, security log UI
//  NOTE: No template literals — plain string concatenation only
// ============================================================

var reportedResults = {};
var evidenceDataUrl = null;
var totalSubCount   = 0;

var MOCK_FEED = [
  { u:'EKS/AD/0001', lga:'ADO-EKITI',          d:'Results transmitted — 842 votes counted',     age:'fn' },
  { u:'EKS/EE/0072', lga:'EKITI EAST',          d:'Agent EK-PDP-EE-0002 submitted EC8A results', age:'fn' },
  { u:'EKS/IK/0387', lga:'IKERE',               d:'Evidence sheet verified and stored',           age:'fr' },
  { u:'EKS/IJ/0511', lga:'IJERO',               d:'Results uploaded — 612 votes counted',         age:'fr' },
  { u:'EKS/MB/0204', lga:'MOBA',                d:'Agent connected — GPS confirmed',              age:'fo' },
  { u:'EKS/OY/0301', lga:'OYE',                 d:'Results pending — agent online',               age:'fo' },
  { u:'EKS/GB/0150', lga:'GBOYIN',              d:'Delayed — connectivity issue reported',        age:'fa' },
  { u:'EKS/EW/0070', lga:'EKITI WEST',          d:'Results transmitted — 791 votes counted',      age:'fo' },
];
var feedBase = Date.now();

// ── SEED MOCK DATA ────────────────────────────────────────
function seedMockData() {
  var sample = ALL_POLLING_UNITS.slice(0, 65);
  sample.forEach(function(u) {
    var tot = Math.floor(Math.random() * 850) + 200;
    var rem = tot;
    var res = {};
    PARTIES.forEach(function(p, i) {
      var share;
      if (i === PARTIES.length - 1) {
        share = rem;
      } else if (i === 0) {
        share = Math.min(rem, Math.floor(tot * (0.28 + Math.random() * 0.15)));
      } else if (i === 1) {
        share = Math.min(rem, Math.floor(tot * (0.20 + Math.random() * 0.12)));
      } else {
        share = Math.min(rem, Math.floor(tot * (0.02 + Math.random() * 0.07)));
      }
      res[p.id] = Math.max(0, share);
      rem = Math.max(0, rem - share);
    });
    var minsAgo = Math.floor(Math.random() * 200);
    var d = new Date();
    d.setMinutes(d.getMinutes() - minsAgo);
    reportedResults[u.code] = {
      code: u.code, name: u.name, ward: u.ward, lga: u.lga,
      lat: u.lat, lng: u.lng,
      results: res,
      time: d.toTimeString().slice(0, 5),
      evidenceUrl: null, agentId: null, hash: null
    };
  });
}

// ── POLLING UNIT PICKER ───────────────────────────────────
function filterAPU() {
  var lgaEl   = document.getElementById('a-lga-filt');
  var srchEl  = document.getElementById('a-pu-srch');
  var dd      = document.getElementById('a-pu-dd');
  var countEl = document.getElementById('pu-count');
  if (!lgaEl || !srchEl || !dd) return;

  var lga = lgaEl.value;
  var q   = srchEl.value.toLowerCase().trim();

  var list = ALL_POLLING_UNITS;
  if (lga) list = list.filter(function(u) { return u.lga === lga; });
  if (q)   list = list.filter(function(u) {
    return u.code.toLowerCase().indexOf(q) > -1 ||
           u.lga.toLowerCase().indexOf(q) > -1 ||
           (u.ward && u.ward.toLowerCase().indexOf(q) > -1);
  });

  if (countEl) countEl.textContent = list.length + ' unit' + (list.length !== 1 ? 's' : '');

  if (!q && !lga) { dd.classList.remove('open'); return; }

  if (!list.length) {
    dd.innerHTML = '<div class="pu-opt" style="color:var(--tm);font-style:italic">No polling units found — try different search</div>';
    dd.classList.add('open');
    return;
  }

  var html = '';
  var show = list.slice(0, 80);
  show.forEach(function(u) {
    html += '<div class="pu-opt" onclick="selectAPU(' + encodeURIComponent(JSON.stringify(u)) + ')">';
    html += '<div class="pu-code">' + u.code + '</div>';
    html += '<div class="pu-name">' + u.lga + (u.ward ? ' — ' + u.ward : '') + '</div>';
    html += '<div class="pu-meta">' + u.lat.toFixed(4) + ', ' + u.lng.toFixed(4) + '</div>';
    html += '</div>';
  });
  if (list.length > 80) {
    html += '<div class="pu-opt" style="color:var(--tm);font-style:italic">&hellip; and ' + (list.length - 80) + ' more &mdash; type to narrow down</div>';
  }
  dd.innerHTML = html;
  dd.classList.add('open');
}

function openAPUDD() {
  var lga = document.getElementById('a-lga-filt') ? document.getElementById('a-lga-filt').value : '';
  var q   = document.getElementById('a-pu-srch')  ? document.getElementById('a-pu-srch').value.trim()  : '';
  var dd  = document.getElementById('a-pu-dd');
  if (!dd) return;

  var list = lga ? ALL_POLLING_UNITS.filter(function(u) { return u.lga === lga; }) : ALL_POLLING_UNITS;
  var show = list.slice(0, 80);
  var html = '';
  show.forEach(function(u) {
    html += '<div class="pu-opt" onclick="selectAPU(' + encodeURIComponent(JSON.stringify(u)) + ')">';
    html += '<div class="pu-code">' + u.code + '</div>';
    html += '<div class="pu-name">' + u.lga + (u.ward ? ' — ' + u.ward : '') + '</div>';
    html += '<div class="pu-meta">' + u.lat.toFixed(4) + ', ' + u.lng.toFixed(4) + '</div>';
    html += '</div>';
  });
  if (!lga) {
    html += '<div class="pu-opt" style="color:var(--tm);font-style:italic">Select an LGA above or type to search</div>';
  }
  dd.innerHTML = html;
  dd.classList.add('open');

  if (q) filterAPU();
}

function searchAPU() {
  filterAPU();
  var dd = document.getElementById('a-pu-dd');
  if (dd) dd.classList.add('open');
}

function selectAPU(encoded) {
  var u = typeof encoded === 'string' ? JSON.parse(decodeURIComponent(encoded)) : encoded;
  selAPU(u);
}

function selAPU(u) {
  agentPU = u;
  var srch = document.getElementById('a-pu-srch');
  var dd   = document.getElementById('a-pu-dd');
  var hdr  = document.getElementById('unit-hdr');
  if (srch) srch.value = u.code + ' — ' + u.lga + (u.ward ? ' — ' + u.ward : '');
  if (dd)   dd.classList.remove('open');
  if (hdr)  hdr.textContent = u.code;
  renderAgentPUSel(u);
  updateChain();
}

function renderAgentPUSel(u) {
  var el = document.getElementById('a-pu-sel');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML =
    '<div class="pu-sel">' +
    '<div class="pu-sel-code">' + u.code + '</div>' +
    '<div class="pu-sel-name">' + u.lga + (u.ward ? ' — ' + u.ward : '') + '</div>' +
    '<div class="pu-sel-meta">' + u.lat.toFixed(5) + ', ' + u.lng.toFixed(5) + '</div>' +
    '</div>';
}

// ── RESULTS FORM ──────────────────────────────────────────
function buildResultsForm() {
  var container = document.getElementById('rform');
  if (!container) return;
  var html = '';
  PARTIES.forEach(function(p) {
    html += '<div class="rrow">';
    html += '<div class="rr-p">';
    html += '<div class="plog" style="background:' + p.color + '">' + p.abbr.slice(0, 2) + '</div>';
    html += '<div><div class="pabbr">' + p.abbr + '</div>';
    html += '<div class="pfull">' + p.name + '</div></div></div>';
    html += '<input type="number" class="rr-inp" id="v-' + p.id + '" min="0" value="0" oninput="calcTotals()">';
    html += '<span class="rr-lbl">votes</span>';
    html += '</div>';
  });
  container.innerHTML = html;
  calcTotals();
}

function calcTotals() {
  var tot  = 0;
  var maxV = 0;
  var lead = null;
  PARTIES.forEach(function(p) {
    var el = document.getElementById('v-' + p.id);
    var v  = el ? (parseInt(el.value) || 0) : 0;
    tot += v;
    if (v > maxV) { maxV = v; lead = p; }
  });
  var totEl  = document.getElementById('tot-votes');
  var leadEl = document.getElementById('lead-party');
  if (totEl)  totEl.textContent  = tot.toLocaleString();
  if (leadEl) leadEl.textContent = (lead && maxV > 0) ? (lead.abbr + ' (' + maxV.toLocaleString() + ')') : '\u2014';
  updateChain();
}

function updateChain() {
  var votes = {};
  PARTIES.forEach(function(p) {
    var el = document.getElementById('v-' + p.id);
    votes[p.id] = el ? (parseInt(el.value) || 0) : 0;
  });
  var h = SEC.hash({ votes: votes, unit: agentPU ? agentPU.code : '', agent: currentAgent ? currentAgent.id : '', t: Math.floor(Date.now() / 30000) });
  var cd = document.getElementById('chain-disp');
  var ci = document.getElementById('chain-ind');
  if (cd) cd.textContent = 'Integrity hash: ' + h + ' \u00b7 ' + new Date().toTimeString().slice(0, 8);
  if (ci) ci.textContent = 'HASH: ' + h;
}

// ── EVIDENCE UPLOAD ───────────────────────────────────────
function handleEvidence() {
  var inp = document.getElementById('ev-inp');
  if (!inp || !inp.files || !inp.files[0]) {
    toast('No file selected', 'warn');
    return;
  }
  var file    = inp.files[0];
  var allowed = ['image/jpeg','image/jpg','image/png','image/gif','image/webp','application/pdf'];
  if (allowed.indexOf(file.type) === -1) {
    toast('Only JPG, PNG or PDF files allowed', 'err');
    return;
  }
  if (file.size > 10 * 1024 * 1024) {
    toast('File too large — max 10MB', 'err');
    return;
  }
  toast('Reading file...', 'info');
  var reader = new FileReader();
  reader.onload = function(e) {
    evidenceDataUrl = e.target.result;
    var thumb = document.getElementById('ev-thumb');
    var upBox = document.getElementById('ev-up');
    var info  = document.getElementById('ev-info');
    var fname = document.getElementById('ev-filename');
    if (file.type.startsWith('image/') && thumb) {
      thumb.src          = evidenceDataUrl;
      thumb.style.display = 'block';
      thumb.classList.add('show');
    }
    if (upBox) upBox.classList.add('done');
    if (info)  info.style.display = 'block';
    if (fname) fname.textContent  = file.name + ' (' + Math.round(file.size / 1024) + 'KB)';
    toast('EC8A sheet uploaded and encrypted \u2713', 'ok');
    if (typeof SEC !== 'undefined') {
      SEC.log('ok', 'Evidence uploaded', 'Agent: ' + (currentAgent ? currentAgent.id : '?') + ' \u00b7 ' + file.name);
    }
  };
  reader.onerror = function() {
    toast('Failed to read file \u2014 please try again', 'err');
  };
  reader.readAsDataURL(file);
}

// ── SUBMIT ────────────────────────────────────────────────
function submitResults() {
  if (!currentAgent)      return;
  if (!agentPU)           return toast('Select a polling unit first', 'warn');
  if (pickedLat === null) return toast('Set your GPS location on the map first', 'warn');
  if (!evidenceDataUrl)   return toast('Upload the EC8A result sheet photo first', 'warn');

  if (!SEC.activeSessions.has(currentAgent.tok)) {
    SEC.log('crit', 'Submission rejected \u2014 invalid session token', currentAgent.id);
    toast('Session expired \u2014 please login again', 'err');
    doLogout();
    return;
  }

  var votes = {};
  var total = 0;
  PARTIES.forEach(function(p) {
    var el = document.getElementById('v-' + p.id);
    var v  = el ? (parseInt(el.value) || 0) : 0;
    votes[p.id] = v;
    total += v;
  });
  if (total === 0) return toast('Enter vote counts before submitting', 'warn');

  var refId     = 'EK-' + SEC.hash({ id: currentAgent.id, unit: agentPU.code, ts: Date.now() });
  var entryHash = SEC.hash({ votes: votes, unit: agentPU.code, agent: currentAgent.id });
  var now       = new Date();

  reportedResults[agentPU.code] = {
    code: agentPU.code, name: agentPU.name, ward: agentPU.ward, lga: agentPU.lga,
    lat: pickedLat, lng: pickedLng,
    results: votes,
    time: now.toTimeString().slice(0, 5),
    evidenceUrl: evidenceDataUrl,
    agentId: currentAgent.id,
    agentName: currentAgent.name,
    party: currentAgent.party,
    refId: refId,
    hash: entryHash,
  };

  totalSubCount++;
  var sbSubs = document.getElementById('sb-subs');
  if (sbSubs) sbSubs.textContent = totalSubCount;

  var subLog = document.getElementById('sub-log');
  if (subLog) {
    subLog.innerHTML =
      '<div style="background:var(--gl);border:1px solid rgba(0,176,79,.2);border-radius:var(--r6);padding:7px 9px">' +
      '<div style="font-weight:700;color:var(--gd);font-size:10px">\u2705 Submitted</div>' +
      '<div style="font-family:\'JetBrains Mono\',monospace;font-size:9px;color:var(--tm)">' + refId.slice(0, 18) + '</div>' +
      '<div style="font-size:9px;color:var(--tm)">' + now.toTimeString().slice(0, 8) + '</div>' +
      '</div>';
  }

  var receipt = document.getElementById('sub-receipt');
  if (receipt) {
    var rows = [
      ['Ref ID',      refId.slice(0, 20)],
      ['Unit',        agentPU.code],
      ['Agent',       currentAgent.id],
      ['Total Votes', total.toLocaleString()],
      ['GPS',         pickedLat.toFixed(5) + ', ' + pickedLng.toFixed(5)],
      ['Time',        now.toTimeString().slice(0, 8)],
      ['Hash',        entryHash],
    ];
    var rHtml = '';
    rows.forEach(function(r) {
      rHtml += '<div class="rc-r"><span class="rc-l">' + r[0] + '</span><span class="rc-v">' + r[1] + '</span></div>';
    });
    receipt.innerHTML = rHtml;
  }

  var body = document.getElementById('agent-body');
  var sucOv = document.getElementById('suc-ov');
  if (body)  body.style.display = 'none';
  if (sucOv) sucOv.classList.add('show');

  SEC.log('ok', 'Results submitted: ' + agentPU.code, 'Ref: ' + refId + ' \u00b7 Votes: ' + total + ' \u00b7 Agent: ' + currentAgent.id);
  refreshDash();
  toast('Results sealed and transmitted \u2713', 'ok');
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
  var rep = Object.keys(reportedResults).length;
  var tot = 0;
  Object.values(reportedResults).forEach(function(u) {
    Object.values(u.results || {}).forEach(function(v) { tot += v; });
  });
  var stRep    = document.getElementById('st-rep');
  var stVotes  = document.getElementById('st-votes');
  var stAgents = document.getElementById('st-agents');
  var stAlerts = document.getElementById('st-alerts');
  var stSubs   = document.getElementById('st-subs');
  var pctBdg   = document.getElementById('pct-bdg');
  if (stRep)    stRep.textContent    = rep;
  if (stVotes)  stVotes.textContent  = tot.toLocaleString();
  if (stAgents) stAgents.textContent = SEC.activeSessions.size;
  if (stAlerts) stAlerts.textContent = SEC.auditLog.filter(function(e) { return e.type === 'crit'; }).length;
  if (stSubs)   stSubs.textContent   = totalSubCount;
  if (pctBdg)   pctBdg.textContent   = Math.round(rep / 2195 * 100) + '% reported';
  renderPartyTable();
  renderFeed();
  renderAgentMon();
}

function renderPartyTable() {
  var tbl = document.getElementById('rtbl');
  if (!tbl) return;
  var tots = {};
  PARTIES.forEach(function(p) { tots[p.id] = 0; });
  Object.values(reportedResults).forEach(function(u) {
    PARTIES.forEach(function(p) { tots[p.id] += (u.results && u.results[p.id]) ? u.results[p.id] : 0; });
  });
  var grand  = 0;
  Object.values(tots).forEach(function(v) { grand += v; });
  var sorted = PARTIES.slice().sort(function(a, b) { return tots[b.id] - tots[a.id]; });

  tbl.innerHTML = '<tr><th style="padding-left:12px">Party</th><th>Votes</th><th style="width:150px">Share</th><th>%</th></tr>';
  sorted.forEach(function(p, i) {
    var v      = tots[p.id];
    var pct    = grand > 0 ? (v / grand * 100).toFixed(1) : '0.0';
    var bw     = grand > 0 ? (v / grand * 100).toFixed(1) : '0';
    var tr     = document.createElement('tr');
    var badge  = i === 0 ? '<span style="font-size:8px;background:var(--gol);color:#7a5600;padding:1px 5px;border-radius:20px;font-weight:700">\uD83C\uDFC6 Leading</span>' : '';
    tr.innerHTML =
      '<td><div style="display:flex;align-items:center;gap:6px;padding:0 4px">' +
        '<div style="width:20px;height:20px;border-radius:3px;background:' + p.color + ';display:flex;align-items:center;justify-content:center;font-size:7px;font-weight:800;color:#fff;flex-shrink:0">' + p.abbr.slice(0,2) + '</div>' +
        '<div><div style="font-weight:700;font-size:10px">' + p.abbr + '</div>' + badge + '</div>' +
      '</div></td>' +
      '<td style="font-family:\'JetBrains Mono\',monospace;font-weight:700;font-size:10px">' + v.toLocaleString() + '</td>' +
      '<td><div style="background:var(--g100);height:4px;border-radius:2px;overflow:hidden">' +
        '<div style="width:' + bw + '%;background:' + p.color + ';height:100%;border-radius:2px;transition:width .6s"></div>' +
      '</div></td>' +
      '<td style="font-size:9px;color:var(--tm);font-weight:600">' + pct + '%</td>';
    tbl.appendChild(tr);
  });
}

function renderFeed() {
  var list = document.getElementById('feed-list');
  var bdg  = document.getElementById('feed-bdg');
  if (!list) return;
  list.innerHTML = '';
  MOCK_FEED.forEach(function(f, i) {
    var d  = new Date(feedBase - i * 9 * 60000);
    var el = document.createElement('div');
    el.className = 'fi';
    el.innerHTML =
      '<div class="fdot ' + f.age + '"></div>' +
      '<div style="flex:1"><div class="fu">' + f.u + ' &middot; ' + f.lga + '</div>' +
      '<div class="fd">' + f.d + '</div></div>' +
      '<div class="ft">' + d.toTimeString().slice(0, 5) + '</div>';
    list.appendChild(el);
  });
  if (bdg) bdg.textContent = MOCK_FEED.length + ' updates';
}

function renderAgentMon() {
  var mon = document.getElementById('agent-mon');
  if (!mon) return;
  var agents = [
    { name:'Taiwo Adeyemi',    unit:'EKS/AD/0001', party:'APC',  col:'#006B3F', st:'on',   lga:'ADO-EKITI'   },
    { name:'Funmi Olaoluwa',   unit:'EKS/EE/0072', party:'PDP',  col:'#E30A17', st:'on',   lga:'EKITI EAST'  },
    { name:'Kehinde Adesanya', unit:'EKS/IK/0387', party:'LP',   col:'#1A6FA8', st:'pend', lga:'IKERE'       },
    { name:'Bola Ogunleye',    unit:'EKS/IJ/0511', party:'NNPP', col:'#E8A020', st:'off',  lga:'IJERO'       },
    { name:'Tunde Ajayi',      unit:'EKS/MB/0204', party:'APC',  col:'#006B3F', st:'on',   lga:'MOBA'        },
    { name:'Yemi Fasanya',     unit:'EKS/OY/0301', party:'SDP',  col:'#BF360C', st:'pend', lga:'OYE'         },
  ];
  var html = '';
  agents.forEach(function(a) {
    var init = a.name.split(' ').map(function(n){ return n[0]; }).join('');
    var sl   = a.st === 'on' ? 'Online' : a.st === 'pend' ? 'Connecting...' : 'Offline';
    var sc   = a.st === 'on' ? 'var(--g)' : a.st === 'pend' ? 'var(--gold)' : 'var(--g400)';
    html +=
      '<div class="ami">' +
      '<div class="ami-av" style="background:' + a.col + '">' + init + '</div>' +
      '<div style="flex:1"><div class="ami-nm">' + a.name + '</div>' +
      '<div class="ami-u">' + a.unit + ' &middot; ' + a.party + ' &middot; ' + a.lga + '</div></div>' +
      '<div class="ami-s" style="color:' + sc + '"><div class="sdot ' + a.st + '"></div>' + sl + '</div>' +
      '</div>';
  });
  mon.innerHTML = html;
}

// ── LIVE RESULTS SCREEN ───────────────────────────────────
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
  all.onclick = function() { setChip(all); renderUnitCards('all'); };
  el.appendChild(all);
  var lgas = [];
  Object.values(reportedResults).forEach(function(u) {
    if (lgas.indexOf(u.lga) === -1) lgas.push(u.lga);
  });
  lgas.sort().forEach(function(lga) {
    var c = document.createElement('button');
    c.className   = 'chip';
    c.textContent = lga;
    c.onclick     = function() { setChip(c); renderUnitCards(lga); };
    el.appendChild(c);
  });
}

function setChip(chip) {
  document.querySelectorAll('.chip').forEach(function(c) { c.classList.remove('active'); });
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
  var srchEl = document.getElementById('u-srch');
  var q      = srchEl ? srchEl.value.toLowerCase() : '';

  var units = Object.values(reportedResults).filter(function(u) {
    var ml = lgaFilter === 'all' || u.lga === lgaFilter;
    var ms = !q || u.code.toLowerCase().indexOf(q) > -1 ||
                   u.name.toLowerCase().indexOf(q) > -1 ||
                   u.lga.toLowerCase().indexOf(q) > -1;
    return ml && ms;
  });

  if (!units.length) {
    grid.innerHTML = '<div style="grid-column:1/-1;text-align:center;color:var(--tm);padding:30px;font-size:12px">No results match your filter.</div>';
    return;
  }

  units.forEach(function(u) {
    var tot    = 0;
    Object.values(u.results || {}).forEach(function(v) { tot += v; });
    var sorted = PARTIES.slice().sort(function(a, b) { return (u.results[b.id]||0) - (u.results[a.id]||0); });
    var leadP  = sorted[0] || {};
    var leadCol= PARTY_COLORS[leadP.id] || '#000';

    var evHtml = u.evidenceUrl
      ? '<img class="ev-sm" src="' + u.evidenceUrl + '" alt="EC8A" onclick="openLB(this.src)" title="View EC8A sheet">'
      : '<span style="font-size:8px;color:var(--tm)">No image</span>';

    var barsHtml = '';
    sorted.slice(0, 6).forEach(function(p) {
      var v   = u.results[p.id] || 0;
      var pct = tot > 0 ? (v / tot * 100).toFixed(1) : '0';
      barsHtml +=
        '<div class="mbr">' +
        '<div class="mp" style="background:' + p.color + '">' + p.abbr.slice(0,2) + '</div>' +
        '<div class="mbt"><div class="mbf" style="width:' + pct + '%;background:' + p.color + '"></div></div>' +
        '<div class="mv">' + v.toLocaleString() + '</div>' +
        '</div>';
    });

    var agRow = u.agentId ? '<div style="font-size:8px;color:var(--tm);margin-top:3px;font-family:\'JetBrains Mono\',monospace">Agent: ' + u.agentId + '</div>' : '';
    var hRow  = u.hash    ? '<div style="font-size:8px;color:var(--tm);margin-top:1px;font-family:\'JetBrains Mono\',monospace">Hash: '  + u.hash    + '</div>' : '';

    var card = document.createElement('div');
    card.className = 'ruc';
    card.innerHTML =
      '<div class="ruc-h">' +
        '<div>' +
          '<div class="ruc-code">' + u.code + '</div>' +
          '<div class="ruc-nm">'  + u.name + ' &middot; ' + (u.ward||'') + '</div>' +
          '<div class="ruc-nm" style="color:var(--blue)">' + u.lga + '</div>' +
        '</div>' +
        '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px">' +
          '<div class="ruc-time">' + (u.time||'') + '</div>' + evHtml +
        '</div>' +
      '</div>' +
      '<div class="ruc-b">' + barsHtml +
        '<div style="margin-top:7px;padding-top:6px;border-top:1px solid var(--g100);display:flex;justify-content:space-between;font-size:9px;color:var(--tm)">' +
          '<span>Total: <strong style="color:var(--tp)">' + tot.toLocaleString() + '</strong></span>' +
          '<span style="color:' + leadCol + ';font-weight:700">' + (leadP.abbr||'\u2014') + ' leading</span>' +
        '</div>' + agRow + hRow +
      '</div>';
    grid.appendChild(card);
  });
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
  var html = '';
  SEC.auditLog.slice(0, 100).forEach(function(e) {
    var cls = e.type === 'crit' ? 'ev-c' : e.type === 'warn' ? 'ev-w' : e.type === 'ok' ? 'ev-k' : 'ev-i';
    var ic  = e.type === 'crit' ? '\u26d4' : e.type === 'warn' ? '\u26a0\ufe0f' : e.type === 'ok' ? '\u2705' : '\u2139\ufe0f';
    html +=
      '<div class="sev">' +
      '<div class="sev-ic ' + cls + '">' + ic + '</div>' +
      '<div class="sev-msg">' + e.msg + (e.detail ? '<br><span style="font-size:8px;opacity:.7">' + e.detail + '</span>' : '') + '</div>' +
      '<div class="sev-ts">' + e.time + '</div>' +
      '</div>';
  });
  el.innerHTML = html;
}

function updateSecStats() {
  var ss = document.getElementById('sec-sessions');
  var sb = document.getElementById('sec-blocked');
  var sf = document.getElementById('sec-failed');
  var se = document.getElementById('sec-events');
  var bb = document.getElementById('blocked-bdg');
  if (ss) ss.textContent = SEC.activeSessions.size;
  if (sb) sb.textContent = SEC.blockedSessions.length;
  if (sf) sf.textContent = SEC.attempts;
  if (se) se.textContent = SEC.auditLog.length;
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
  var html = '';
  SEC.blockedSessions.forEach(function(s) {
    html +=
      '<div class="ip-item">' +
      '<div><div class="ip-addr">' + s.addr + '</div><div class="ip-rsn">' + s.reason + '</div></div>' +
      '<div class="ip-t">' + s.time + '</div>' +
      '</div>';
  });
  el.innerHTML = html;
}

function renderThreatGauges() {
  var el = document.getElementById('threat-gauges');
  if (!el) return;
  var critCount   = SEC.auditLog.filter(function(e) { return e.type === 'crit'; }).length;
  var warnCount   = SEC.auditLog.filter(function(e) { return e.type === 'warn'; }).length;
  var injectCount = SEC.auditLog.filter(function(e) { return e.msg.indexOf('njection') > -1; }).length;
  var gauges = [
    { label:'Brute Force Risk',   val: Math.min(100, SEC.attempts * 20),  color:'var(--red)' },
    { label:'Login Anomalies',    val: Math.min(100, warnCount * 12),     color:'var(--ora)' },
    { label:'Injection Attempts', val: Math.min(100, injectCount * 30),   color:'var(--pur)' },
    { label:'System Integrity',   val: 100,                                color:'var(--g)'   },
  ];
  var html = '';
  gauges.forEach(function(g) {
    html +=
      '<div style="margin-bottom:10px">' +
      '<div style="display:flex;justify-content:space-between;font-size:10px;margin-bottom:3px">' +
        '<span style="color:var(--ts)">' + g.label + '</span>' +
        '<span style="font-family:\'JetBrains Mono\',monospace;font-weight:700;color:' + g.color + '">' + g.val + '%</span>' +
      '</div>' +
      '<div style="height:5px;background:var(--g100);border-radius:3px;overflow:hidden">' +
        '<div style="height:100%;width:' + g.val + '%;background:' + g.color + ';border-radius:3px;transition:width .5s"></div>' +
      '</div></div>';
  });
  el.innerHTML = html;
}

function updateThreatBanner() {
  var banner = document.getElementById('threat-banner');
  var msg    = document.getElementById('threat-msg');
  var detail = document.getElementById('threat-detail');
  var secBar = document.getElementById('sec-bar');
  var secTxt = document.getElementById('sec-txt');
  if (!banner || !msg) return;

  var crit = SEC.auditLog.filter(function(e) { return e.type === 'crit'; }).length;

  if (SEC.attempts >= 4 || SEC.blockedSessions.length > 0 || crit >= 2) {
    banner.className   = 'threat thr-crit';
    msg.textContent    = '\uD83D\uDEA8 HIGH THREAT \u2014 Attacks detected. System on high alert.';
    if (detail) detail.textContent = SEC.blockedSessions.length + ' blocked \u00b7 ' + SEC.attempts + ' failed logins';
    if (secBar) { secBar.style.background = 'rgba(192,57,43,.2)'; secBar.style.borderColor = 'rgba(192,57,43,.4)'; secBar.style.color = 'var(--red)'; }
    if (secTxt) secTxt.textContent = '\u26a0 Alert';
  } else if (SEC.attempts >= 2) {
    banner.className   = 'threat thr-warn';
    msg.textContent    = '\u26a0\ufe0f ELEVATED \u2014 Multiple failed login attempts detected.';
    if (detail) detail.textContent = SEC.attempts + '/5 attempts used';
    if (secBar) { secBar.style.background = 'rgba(230,126,34,.15)'; secBar.style.borderColor = 'rgba(230,126,34,.3)'; secBar.style.color = 'var(--ora)'; }
    if (secTxt) secTxt.textContent = '\u26a0 Warning';
  } else {
    banner.className   = 'threat thr-ok';
    msg.textContent    = '\u2705 System secured \u2014 All connections encrypted \u00b7 Monitoring active';
    if (detail) detail.textContent = '';
    if (secBar) { secBar.style.background = 'rgba(0,176,79,.1)'; secBar.style.borderColor = 'rgba(0,176,79,.25)'; secBar.style.color = '#4ade80'; }
    if (secTxt) secTxt.textContent = 'Secure';
  }
}