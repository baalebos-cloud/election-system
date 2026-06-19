// ============================================================
//  js/auth.js  —  Pure ES5
//  Login, logout, registration — API-BASED (NO HARDCODED CREDS)
//  FIXED: Dropdown selection for polling units with special chars
// ============================================================

// API base URL
var API_BASE = window.location.origin;

var currentAgent    = null;
var agentPU         = null;
var regPU           = null;
var authToken       = null;
var evidenceDataUrl = null;

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

// ── DOTS ─────────────────────────────────────────────────
function updateDots() {
  var i, d;
  for (i = 1; i <= 5; i++) {
    d = document.getElementById('dot-' + i);
    if (!d) continue;
    d.className = 'adot';
    if (i <= SEC.attempts) d.classList.add(SEC.attempts >= 4 ? 'used' : 'warn');
  }
  var t = document.getElementById('att-txt');
  var rem = 5 - SEC.attempts;
  if (t) t.textContent = rem + ' attempt' + (rem !== 1 ? 's' : '') + ' remaining';
}

// ── LOCKOUT ───────────────────────────────────────────────
function triggerLockout() {
  SEC.lockedUntil = Date.now() + 300000;
  SEC.blockedSessions.push({
    addr:   'Session-' + Math.floor(Math.random() * 9000 + 1000),
    reason: 'Max login attempts exceeded (5)',
    time:   new Date().toTimeString().slice(0, 8)
  });
  SEC.log('crit', 'Account locked', '5 failed attempts, 5-min cooldown');
  var lb = document.getElementById('lockout-box');
  if (lb) lb.classList.add('show');
  showCaptchaField();
  var secs = 300;
  SEC.lockTimer = setInterval(function() {
    secs--;
    var el = document.getElementById('lock-timer');
    if (el) {
      var m = Math.floor(secs / 60);
      var s = secs % 60;
      el.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
    }
    if (secs <= 0) {
      clearInterval(SEC.lockTimer);
      var lb2 = document.getElementById('lockout-box');
      if (lb2) lb2.classList.remove('show');
      SEC.attempts = 0;
      SEC.lockedUntil = 0;
      updateDots();
      toast('Account unlocked \u2014 you may try again', 'info');
    }
  }, 1000);
}

function showCaptchaField() {
  var c   = SEC.makeCaptcha();
  var q   = document.getElementById('captcha-q');
  var sec = document.getElementById('captcha-sec');
  if (q)   q.textContent = c.q;
  if (sec) sec.style.display = 'block';
  SEC.captchaActive = true;
}

// ── HELPER FUNCTIONS ──────────────────────────────────────
function shakeLoginBox() {
  var lb = document.getElementById('login-box');
  if (lb) {
    lb.style.animation = 'shake .4s';
    setTimeout(function() { lb.style.animation = ''; }, 500);
  }
}

function showSecurityBlock(reason) {
  var sb = document.getElementById('sec-block');
  var sm = document.getElementById('sec-block-msg');
  var sh = document.getElementById('sec-block-hash');
  if (sb) sb.classList.add('active');
  if (sm) sm.textContent = reason + '. Session flagged.';
  if (sh) sh.textContent = 'INCIDENT-' + SEC.hash({ r: reason, ts: Date.now() });
  toast('Security violation detected', 'err');
}

function showAgentPortal() {
  var overlay = document.getElementById('login-overlay');
  var asb     = document.getElementById('asb');
  var amain   = document.getElementById('amain');
  if (overlay) overlay.style.display = 'none';
  if (asb)     asb.style.display     = 'flex';
  if (amain)   amain.style.display   = 'flex';
  buildResultsForm();
}

function setupPollingUnit(agent) {
  agentPU = null;
  for (var i = 0; i < ALL_POLLING_UNITS.length; i++) {
    if (ALL_POLLING_UNITS[i].code === agent.unit) {
      agentPU = ALL_POLLING_UNITS[i];
      break;
    }
  }
  if (agentPU) {
    var lf = document.getElementById('a-lga-filt');
    var ps = document.getElementById('a-pu-srch');
    var uh = document.getElementById('unit-hdr');
    if (lf) lf.value = agent.lga;
    if (ps) ps.value = agentPU.code + ' \u2014 ' + agentPU.name;
    if (uh) uh.textContent = agentPU.code;
    renderAgentPUSel(agentPU);
    filterAPU();
  }
}

// ── LOGIN (API-based) ─────────────────────────────────────
function doLogin() {
  var idEl  = document.getElementById('l-id');
  var pinEl = document.getElementById('l-pin');
  var id    = idEl  ? idEl.value.trim() : '';
  var pin   = pinEl ? pinEl.value       : '';

  if (Date.now() < SEC.lockedUntil) {
    toast('Account locked \u2014 wait for the timer', 'err');
    return;
  }
  if (!SEC.rateCheck('login', 10, 60000)) {
    toast('Too many requests \u2014 slow down', 'err');
    SEC.log('warn', 'Rate limit exceeded on login');
    return;
  }

  // Validate CAPTCHA if active
  if (SEC.captchaActive) {
    var ci  = document.getElementById('captcha-inp');
    var ans = ci ? ci.value.trim() : '';
    if (ans !== SEC.captchaAns) {
      var c2 = SEC.makeCaptcha();
      var cq = document.getElementById('captcha-q');
      if (cq) cq.textContent = c2.q;
      if (ci) ci.value = '';
      toast('Incorrect CAPTCHA \u2014 try again', 'err');
      return;
    }
    SEC.captchaActive = false;
    var cs = document.getElementById('captcha-sec');
    if (cs) cs.style.display = 'none';
  }

  // Client-side anomaly detection
  var anomaly = SEC.detectAnomaly(id, pin);
  if (!anomaly.ok) {
    SEC.attempts++;
    updateDots();
    SEC.log('crit', 'Anomaly: ' + anomaly.reason, id.slice(0, 20));
    shakeLoginBox();
    showSecurityBlock(anomaly.reason);
    return;
  }

  // Validate inputs
  if (!id || !pin) {
    toast('Enter your Agent ID and PIN', 'warn');
    return;
  }

  // Disable button during request
  var loginBtn = document.querySelector('#login-box .btn-p');
  if (loginBtn) {
    loginBtn.disabled = true;
    loginBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Logging in...';
  }

  // Call API
  fetch(API_BASE + '/api/agents/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agentId: id, pin: pin })
  })
  .then(function(response) {
    return response.json().then(function(data) {
      return { status: response.status, data: data };
    });
  })
  .then(function(result) {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login Securely';
    }

    if (result.status !== 200) {
      SEC.attempts++;
      updateDots();
      SEC.log('warn', 'Failed login', 'ID: ' + id + ' attempt ' + SEC.attempts + '/5');
      toast(result.data.error || 'Invalid credentials', 'err');
      shakeLoginBox();

      if (SEC.attempts === 3 && !SEC.captchaActive) {
        showCaptchaField();
        toast('CAPTCHA required after 3 failed attempts', 'warn');
      }
      if (SEC.attempts >= 5) triggerLockout();
      return;
    }

    // Login successful
    var agent = result.data.agent;
    authToken = result.data.token;

    SEC.activeSessions.add(authToken.slice(0, 24));
    SEC.attempts = 0;
    updateDots();
    SEC.log('ok', 'Login: ' + agent.id, 'Party: ' + agent.party + ' LGA: ' + agent.lga);

    currentAgent = {
      id:    agent.id,
      tok:   authToken.slice(0, 24),
      name:  agent.name,
      party: agent.party,
      lga:   agent.lga,
      town:  agent.town,
      unit:  agent.unit,
      ward:  agent.ward
    };

    buildSidebar();
    showAgentPortal();
    setupPollingUnit(agent);

    toast('Welcome, ' + agent.name + ' \u00b7 Session secured', 'ok');
  })
  .catch(function(err) {
    if (loginBtn) {
      loginBtn.disabled = false;
      loginBtn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Login Securely';
    }
    console.error('Login error:', err);
    toast('Connection error \u2014 check your network', 'err');
  });
}

// ── LOGOUT ────────────────────────────────────────────────
function doLogout() {
  if (currentAgent) {
    SEC.activeSessions.delete(currentAgent.tok);
    SEC.log('ok', 'Logout: ' + currentAgent.id);
  }
  currentAgent    = null;
  authToken       = null;
  agentPU         = null;
  pickedLat       = null;
  pickedLng       = null;
  evidenceDataUrl = null;

  var overlay = document.getElementById('login-overlay');
  var asb     = document.getElementById('asb');
  var amain   = document.getElementById('amain');
  var pinEl   = document.getElementById('l-pin');
  var locBox  = document.getElementById('loc-box');
  var mapBtn  = document.getElementById('map-btn');
  var repick  = document.getElementById('repick-btn');
  var sucOv   = document.getElementById('suc-ov');
  var body    = document.getElementById('agent-body');
  var evThumb = document.getElementById('ev-thumb');
  var evUp    = document.getElementById('ev-up');
  var evInfo  = document.getElementById('ev-info');
  var evInp   = document.getElementById('ev-inp');

  if (overlay) overlay.style.display = 'flex';
  if (asb)     asb.style.display     = 'none';
  if (amain)   amain.style.display   = 'none';
  if (pinEl)   pinEl.value           = '';
  if (locBox)  locBox.style.display  = 'none';
  if (mapBtn)  mapBtn.style.display  = 'flex';
  if (repick)  repick.style.display  = 'none';
  if (sucOv)   sucOv.classList.remove('show');
  if (body)    body.style.display    = 'grid';
  if (evThumb) { evThumb.classList.remove('show'); evThumb.style.display = 'none'; }
  if (evUp)    evUp.classList.remove('done');
  if (evInfo)  evInfo.style.display  = 'none';
  if (evInp)   evInp.value           = '';

  toast('Logged out securely', 'info');
}

// ── SIDEBAR ───────────────────────────────────────────────
function buildSidebar() {
  var a    = currentAgent;
  var init = '';
  var parts = a.name.split(' ');
  for (var i = 0; i < parts.length; i++) if (parts[i]) init += parts[i][0];
  init = init.toUpperCase() || 'A';
  var col  = PARTY_COLORS[a.party] || '#00B04F';

  var map = {
    'ap-av':   { bg: col, txt: init },
    'ap-nm':   { txt: a.name },
    'ap-lga':  { txt: '\uD83D\uDCCD ' + a.lga },
    'ap-town': { txt: '\uD83C\uDFD8 ' + a.town },
    'sb-id':   { txt: a.id },
    'sb-party':{ txt: a.party },
    'sb-unit': { txt: a.unit },
    'sb-ward': { txt: a.ward },
    'sb-lga':  { txt: a.lga },
    'sb-town': { txt: a.town },
    'sb-sess': { txt: a.tok.slice(0,10) + '...' },
    'sb-ltime':{ txt: new Date().toTimeString().slice(0,8) }
  };
  for (var k in map) {
    var el = document.getElementById(k);
    if (!el) continue;
    if (map[k].bg) el.style.background = map[k].bg;
    if (map[k].txt !== undefined) el.textContent = map[k].txt;
  }
}

// ── REGISTRATION STEPS ────────────────────────────────────
function setRegStep(n) {
  var i, tab, sec;
  for (i = 1; i <= 5; i++) {
    tab = document.getElementById('rtab-' + i);
    sec = document.getElementById('rsec-' + i);
    if (tab) tab.className = 'stab' + (i === n ? ' active' : i < n ? ' done' : '');
    if (sec) sec.className = 'rsec' + (i === n ? ' active' : '');
  }
}

function rNext(step) {
  var fn = document.getElementById('r-fn');
  var ln = document.getElementById('r-ln');
  var ph = document.getElementById('r-ph');
  var rp = document.getElementById('r-party');
  var rt = document.getElementById('r-town');
  var p1 = document.getElementById('r-pin');
  var p2 = document.getElementById('r-pin2');
  var sq = document.getElementById('r-sq');
  var sa = document.getElementById('r-sa');
  var pp1 = document.getElementById('pp-1');
  var pp2 = document.getElementById('pp-2');

  if (step === 1) {
    if (!fn || !fn.value.trim()) { toast('First name is required', 'err'); return; }
    if (!ln || !ln.value.trim()) { toast('Last name is required', 'err'); return; }
    if (!ph || !ph.value.trim()) { toast('Phone number is required', 'err'); return; }
  }
  if (step === 2) {
    if (!rp || !rp.value)        { toast('Select your political party', 'err'); return; }
    if (!regPU)                  { toast('Search and select your polling unit', 'err'); return; }
    if (!rt || !rt.value.trim()) { toast('Enter your town / area', 'err'); return; }
    buildRegSummary();
  }
  if (step === 3) {
    if (!pp1 || !pp1.classList.contains('show')) { toast('Upload your passport photograph', 'err'); return; }
    if (!pp2 || !pp2.classList.contains('show')) { toast('Upload your Voter Card or NIN slip', 'err'); return; }
  }
  if (step === 4) {
    if (!p1 || p1.value.length < 6)        { toast('PIN must be at least 6 characters', 'err'); return; }
    if (!p2 || p1.value !== p2.value)       { toast('PINs do not match', 'err'); return; }
    if (!sq || !sq.value)                   { toast('Select a security question', 'err'); return; }
    if (!sa || !sa.value.trim())            { toast('Enter your security answer', 'err'); return; }
  }
  setRegStep(step + 1);
}

function rPrev(step) { setRegStep(step - 1); }

// ── REGISTRATION POLLING UNIT SEARCH (FIXED) ──────────────
function filterRegUnits() {
  regPU = null;
  var s = document.getElementById('r-pu-srch');
  var d = document.getElementById('r-pu-dd');
  var e = document.getElementById('r-pu-sel');
  if (s) s.value = '';
  if (d) { d.innerHTML = ''; d.classList.remove('open'); }
  if (e) e.style.display = 'none';
}

function openRegDD() {
  var lgaEl = document.getElementById('r-lga');
  var dd    = document.getElementById('r-pu-dd');
  var lga   = lgaEl ? lgaEl.value : '';
  if (!lga) {
    if (dd) {
      dd.innerHTML = '<div class="pu-opt" style="color:var(--tm);font-style:italic">Select an LGA above first</div>';
      dd.classList.add('open');
    }
    return;
  }
  searchRegPU();
}

function searchRegPU() {
  var lgaEl = document.getElementById('r-lga');
  var srch  = document.getElementById('r-pu-srch');
  var dd    = document.getElementById('r-pu-dd');
  var lga   = lgaEl ? lgaEl.value : '';
  var q     = srch  ? srch.value.toLowerCase().trim() : '';
  var list  = ALL_POLLING_UNITS;
  var i, u, html, idx;

  if (!lga && !q) { if (dd) dd.classList.remove('open'); return; }
  if (lga) list = list.filter(function(u){ return u.lga === lga; });
  if (q)   list = list.filter(function(u){
    return u.code.toLowerCase().indexOf(q) > -1 ||
           u.name.toLowerCase().indexOf(q) > -1 ||
           u.ward.toLowerCase().indexOf(q) > -1;
  });

  if (!list.length) {
    if (dd) { 
      dd.innerHTML = '<div class="pu-opt" style="color:var(--tm);font-style:italic">No units found</div>'; 
      dd.classList.add('open'); 
    }
    return;
  }

  html = '';
  for (i = 0; i < Math.min(list.length, 60); i++) {
    u = list[i];
    idx = ALL_POLLING_UNITS.indexOf(u);
    html += '<div class="pu-opt" data-reg-pu-index="' + idx + '">' +
      '<div class="pu-code">' + escapeHtml(u.code) + '</div>' +
      '<div class="pu-name">' + escapeHtml(u.name) + '</div>' +
      '<div class="pu-meta">' + escapeHtml(u.ward) + ' &middot; ' + escapeHtml(u.lga) + '</div></div>';
  }
  if (list.length > 60) {
    html += '<div class="pu-opt" style="color:var(--tm);font-style:italic">&hellip; and ' + (list.length - 60) + ' more \u2014 type to narrow</div>';
  }
  if (dd) { dd.innerHTML = html; dd.classList.add('open'); }
}

function selectRegPU(u) {
  regPU = u;
  var s = document.getElementById('r-pu-srch');
  var d = document.getElementById('r-pu-dd');
  var w = document.getElementById('r-ward');
  var e = document.getElementById('r-pu-sel');
  if (s) s.value = u.code + ' \u2014 ' + u.name;
  if (d) d.classList.remove('open');
  if (w) w.value = u.ward;
  if (e) {
    e.style.display = 'block';
    e.innerHTML = '<div class="pu-sel">' +
      '<div class="pu-sel-code">' + escapeHtml(u.code) + '</div>' +
      '<div class="pu-sel-name">' + escapeHtml(u.name) + '</div>' +
      '<div class="pu-sel-meta">' + escapeHtml(u.ward) + ' &middot; ' + escapeHtml(u.lga) + '</div></div>';
  }
  updateTag();
}

// ── REGISTRATION TAG PREVIEW ──────────────────────────────
function updateTag() {
  var pe  = document.getElementById('r-party');
  var le  = document.getElementById('r-lga');
  var te  = document.getElementById('r-town');
  var fne = document.getElementById('r-fn');
  var lne = document.getElementById('r-ln');
  var party = pe  ? pe.value  : '';
  var lga   = le  ? le.value  : '';
  var town  = te  ? te.value.trim() : '';
  var fn    = fne ? fne.value.trim() : '';
  var ln    = lne ? lne.value.trim() : '';
  var name  = (fn + ' ' + ln).trim() || 'Agent Name';
  var init  = (fn ? fn[0] : '') + (ln ? ln[0] : '');
  init = init.toUpperCase() || 'A';
  var col   = (typeof PARTY_COLORS !== 'undefined' && PARTY_COLORS[party]) ? PARTY_COLORS[party] : '#00B04F';

  var elMap = {
    'tag-av':   { bg: col, txt: init },
    'tag-nm':   { txt: name },
    'tag-id':   { txt: 'ID: Pending' },
    'tag-lga':  { txt: '\uD83D\uDCCD ' + (lga  || 'LGA') },
    'tag-town': { txt: '\uD83C\uDFD8 ' + (town || 'Town') },
    'tag-unit': { txt: 'Unit: ' + (regPU ? regPU.code : '\u2014') }
  };
  var k, el;
  for (k in elMap) {
    el = document.getElementById(k);
    if (!el) continue;
    if (elMap[k].bg) el.style.background = elMap[k].bg;
    if (elMap[k].txt !== undefined) el.textContent = elMap[k].txt;
  }
}

function buildRegSummary() {
  var fnEl = document.getElementById('r-fn');
  var lnEl = document.getElementById('r-ln');
  var phEl = document.getElementById('r-ph');
  var paEl = document.getElementById('r-party');
  var lgEl = document.getElementById('r-lga');
  var toEl = document.getElementById('r-town');
  var sumEl = document.getElementById('reg-summary');
  var rows = [
    ['Name',  ((fnEl ? fnEl.value : '') + ' ' + (lnEl ? lnEl.value : '')).trim()],
    ['Phone', phEl ? phEl.value : ''],
    ['Party', paEl ? paEl.value : ''],
    ['LGA',   lgEl ? lgEl.value : ''],
    ['Town',  toEl ? toEl.value : ''],
    ['Unit',  regPU ? regPU.code : '\u2014'],
    ['Ward',  regPU ? regPU.ward : '\u2014']
  ];
  var html = '', i;
  for (i = 0; i < rows.length; i++) {
    html += '<div style="display:flex;justify-content:space-between">' +
      '<span style="color:var(--tm)">' + rows[i][0] + '</span>' +
      '<strong>' + (rows[i][1] || '\u2014') + '</strong></div>';
  }
  if (sumEl) sumEl.innerHTML = html;
  updateTag();
}

// ── PASSWORD STRENGTH ─────────────────────────────────────
function checkPwd() {
  var v = document.getElementById('r-pin');
  var f = document.getElementById('pwd-fill');
  var t = document.getElementById('pwd-txt');
  if (!v) return;
  var val = v.value;
  var s = 0;
  if (val.length >= 6)  s++;
  if (val.length >= 10) s++;
  if (/[A-Za-z]/.test(val) && /[0-9]/.test(val)) s++;
  if (/[^A-Za-z0-9]/.test(val)) s++;
  var lvls = [
    {w:0,  c:'var(--red)', l:'Too weak'},
    {w:25, c:'var(--red)', l:'Weak'},
    {w:50, c:'var(--ora)', l:'Fair'},
    {w:75, c:'var(--gold)',l:'Good'},
    {w:100,c:'var(--g)',   l:'Strong \u2713'}
  ];
  var lvl = lvls[s];
  if (f) { f.style.width = lvl.w + '%'; f.style.background = lvl.c; }
  if (t) { t.textContent = lvl.l; t.style.color = lvl.c; }
}

// ── PHOTO UPLOAD ──────────────────────────────────────────
function handlePhoto(inpId, prevId, boxId) {
  var inp = document.getElementById(inpId);
  if (!inp || !inp.files || !inp.files[0]) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = document.getElementById(prevId);
    var box = document.getElementById(boxId);
    if (img) { img.src = e.target.result; img.classList.add('show'); }
    if (box) box.classList.add('done');
    toast('Document uploaded', 'ok');
  };
  reader.readAsDataURL(inp.files[0]);
}

// ── COMPLETE REGISTRATION (API-based) ─────────────────────
function completeReg() {
  var pe  = document.getElementById('r-party');
  var le  = document.getElementById('r-lga');
  var te  = document.getElementById('r-town');
  var pi  = document.getElementById('r-pin');
  var fne = document.getElementById('r-fn');
  var lne = document.getElementById('r-ln');
  var sq  = document.getElementById('r-sq');
  var sa  = document.getElementById('r-sa');
  var tid = document.getElementById('tag-id');
  var btn = document.getElementById('reg-submit-btn');

  var party = pe  ? pe.value        : '';
  var lga   = le  ? le.value        : '';
  var town  = te  ? te.value.trim() : '';
  var pin   = pi  ? pi.value        : '';
  var fname = fne ? fne.value.trim(): '';
  var lname = lne ? lne.value.trim(): '';
  var secQ  = sq  ? sq.value        : '';
  var secA  = sa  ? sa.value.trim() : '';

  if (!regPU)      { toast('Select a polling unit', 'err'); return; }
  if (!party)      { toast('Select your party', 'err'); return; }
  if (!lga||!town) { toast('Complete LGA and town fields', 'err'); return; }
  if (pin.length < 6) { toast('PIN must be at least 6 characters', 'err'); return; }

  if (btn) { btn.disabled = true; btn.textContent = 'Registering...'; }

  var payload = {
    name: (fname + ' ' + lname).trim(),
    party: party,
    lga: lga,
    town: town,
    unit: regPU.code,
    ward: regPU.ward,
    pin: pin,
    securityQuestion: secQ || null,
    securityAnswer: secA || null
  };

  fetch(API_BASE + '/api/agents/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(function(response) {
    return response.json().then(function(data) {
      return { status: response.status, data: data };
    });
  })
  .then(function(result) {
    if (btn) { btn.disabled = false; btn.textContent = 'Complete Registration & Generate ID Tag'; }

    if (result.status !== 201) {
      toast(result.data.error || 'Registration failed', 'err');
      return;
    }

    var agentId = result.data.agentId;
    if (tid) tid.textContent = 'ID: ' + agentId;
    SEC.log('ok', 'Agent registered: ' + agentId, party + ' ' + lga + ' ' + regPU.code);
    toast('Done! Agent ID: ' + agentId + ' \u2014 redirecting to login...', 'ok');

    setTimeout(function() {
      window.location.href = 'agent.html';
    }, 2500);
  })
  .catch(function(err) {
    if (btn) { btn.disabled = false; btn.textContent = 'Complete Registration & Generate ID Tag'; }
    console.error('Registration error:', err);
    toast('Connection error \u2014 check your network', 'err');
  });
}

// ── EVENT DELEGATION FOR REGISTRATION DROPDOWN ────────────
document.addEventListener('click', function(e) {
  // Handle registration polling unit selection
  var regOpt = e.target.closest('.pu-opt[data-reg-pu-index]');
  if (regOpt) {
    var regDd = regOpt.closest('#r-pu-dd');
    if (regDd) {
      var regIdx = parseInt(regOpt.getAttribute('data-reg-pu-index'), 10);
      if (!isNaN(regIdx) && ALL_POLLING_UNITS[regIdx]) {
        selectRegPU(ALL_POLLING_UNITS[regIdx]);
      }
      return;
    }
  }
  
  // Close registration dropdown on outside click
  if (!e.target.closest('#r-pu-srch') && !e.target.closest('#r-pu-dd')) {
    var rdd = document.getElementById('r-pu-dd');
    if (rdd) rdd.classList.remove('open');
  }
});
