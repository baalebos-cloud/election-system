// VERSION: 2026-05-30 10:27 — session tracking
// ============================================================
//  js/auth.js
//  Agent login, logout, registration, session management
// ============================================================

// Registered agents — demo set + any registered via register.html page
const AGENTS = (() => {
  const base = {
    'EK-APC-ADO-0001': { pin:'secure1', name:'Taiwo Adeyemi',    party:'APC',  lga:'ADO',        town:'Ado Central',   unit:'EKS/ADO/0001', ward:"ADO 'A'"      },
    'EK-PDP-EE-0002':  { pin:'pass123', name:'Funmi Olaoluwa',   party:'PDP',  lga:'EKITI EAST', town:'Omuo Oke',      unit:'EKS/EE/0300',  ward:'OMUO OKE I'   },
    'EK-LP-IK-0003':   { pin:'labour7', name:'Kehinde Adesanya', party:'LP',   lga:'IKERE',      town:'Ikere Central', unit:'EKS/IK/1272',  ward:'ATIBA/AAFIN'  },
    'EK-NNPP-IJ-0004': { pin:'nnpp24',  name:'Bola Ogunleye',    party:'NNPP', lga:'IJERO',      town:'Ijero-Ekiti',   unit:'EKS/IJ/1128',  ward:'IJERO WARD A' },
  };
  try {
    const stored = JSON.parse(localStorage.getItem('ekiti_agents') || '{}');
    return Object.assign(base, stored);
  } catch(e) { return base; }
})();

let currentAgent   = null;
let regAgentCount  = Object.keys(AGENTS).length;
let regPU          = null;
let agentPU        = null;

// ── LOGIN ─────────────────────────────────────────────────
function updateDots() {
  for (let i = 1; i <= 5; i++) {
    const d = document.getElementById('dot-' + i);
    if (!d) continue;
    d.className = 'adot';
    if (i <= SEC.attempts) d.classList.add(SEC.attempts >= 4 ? 'used' : 'warn');
  }
  const t = document.getElementById('att-txt');
  const rem = 5 - SEC.attempts;
  if (t) t.textContent = rem + ' attempt' + (rem !== 1 ? 's' : '') + ' remaining';
}

function triggerLockout() {
  SEC.lockedUntil = Date.now() + 300000;
  SEC.blockedSessions.push({
    addr: 'Session #' + Math.floor(Math.random() * 9000 + 1000),
    reason: 'Exceeded max login attempts (5)',
    time: new Date().toTimeString().slice(0, 8),
  });
  SEC.log('crit', 'Account locked — max login attempts exceeded', '5 failed attempts · 5-min cooldown');
  document.getElementById('lockout-box').classList.add('show');
  showCaptchaField();

  let sec = 300;
  SEC.lockTimer = setInterval(() => {
    sec--;
    const el = document.getElementById('lock-timer');
    if (el) el.textContent = String(Math.floor(sec / 60)).padStart(2, '0') + ':' + String(sec % 60).padStart(2, '0');
    if (sec <= 0) {
      clearInterval(SEC.lockTimer);
      document.getElementById('lockout-box').classList.remove('show');
      SEC.attempts = 0;
      SEC.lockedUntil = 0;
      updateDots();
      toast('Account unlocked — you may try again', 'info');
      SEC.log('ok', 'Lockout timer expired — account unlocked');
    }
  }, 1000);
}

function showCaptchaField() {
  const c = SEC.makeCaptcha();
  document.getElementById('captcha-q').textContent = c.q;
  document.getElementById('captcha-sec').style.display = 'block';
  SEC.captchaActive = true;
}

function doLogin() {
  const id  = (document.getElementById('l-id').value  || '').trim();
  const pin = (document.getElementById('l-pin').value || '');

  if (Date.now() < SEC.lockedUntil) { toast('Account locked — wait for timer', 'err'); return; }

  if (!SEC.rateCheck('login', 10, 60000)) {
    toast('Rate limit — too many requests per minute', 'err');
    SEC.log('warn', 'Rate limit exceeded on login endpoint');
    return;
  }

  if (SEC.captchaActive) {
    const ans = (document.getElementById('captcha-inp').value || '').trim();
    if (ans !== SEC.captchaAns) {
      const c = SEC.makeCaptcha();
      document.getElementById('captcha-q').textContent = c.q;
      document.getElementById('captcha-inp').value = '';
      toast('Incorrect CAPTCHA — try again', 'err');
      SEC.log('warn', 'CAPTCHA failed', 'Agent ID: ' + id);
      return;
    }
    SEC.captchaActive = false;
    document.getElementById('captcha-sec').style.display = 'none';
  }

  const anomaly = SEC.detectAnomaly(id, pin);
  if (!anomaly.ok) {
    SEC.attempts++;
    updateDots();
    SEC.log('crit', 'Security anomaly: ' + anomaly.reason, 'ID: ' + id.slice(0, 20));
    shakeBox();
    triggerSecurityBlock(anomaly.reason);
    return;
  }

  const agent = AGENTS[id];
  if (!agent || agent.pin !== pin) {
    SEC.attempts++;
    updateDots();
    SEC.log('warn', 'Failed login', 'ID: ' + id + ' · Attempt ' + SEC.attempts + '/5');
    toast('Invalid credentials — ' + (5 - SEC.attempts) + ' attempts remaining', 'err');
    shakeBox();
    if (SEC.attempts === 3 && !SEC.captchaActive) {
      showCaptchaField();
      toast('CAPTCHA required after 3 failed attempts', 'warn');
    }
    if (SEC.attempts >= 5) triggerLockout();
    return;
  }

  // Success
  const tok = SEC.token();
  SEC.activeSessions.add(tok);
  SEC.attempts = 0;
  updateDots();
  SEC.log('ok', 'Login success: ' + id, 'Party: ' + agent.party + ' · LGA: ' + agent.lga);

  currentAgent = { ...agent, id, tok };
  buildSidebar();

  // Write live session to localStorage so index.html dashboard can see it
  try {
    const sessions = JSON.parse(localStorage.getItem('ekiti_sessions') || '{}');
    sessions[id] = {
      id, name: agent.name, party: agent.party, lga: agent.lga,
      town: agent.town, unit: agent.unit, ward: agent.ward,
      status: 'online', loginTime: new Date().toISOString(),
      lastSeen: new Date().toISOString(),
    };
    localStorage.setItem('ekiti_sessions', JSON.stringify(sessions));
  } catch(e) {}

  document.getElementById('login-overlay').style.display = 'none';
  document.getElementById('asb').style.display   = 'flex';
  document.getElementById('amain').style.display = 'flex';

  buildResultsForm();

  agentPU = ALL_POLLING_UNITS.find(u => u.code === agent.unit) || null;
  if (agentPU) {
    document.getElementById('a-lga-filt').value = agent.lga;
    document.getElementById('a-pu-srch').value  = agentPU.code + ' — ' + agentPU.name;
    document.getElementById('unit-hdr').textContent = agentPU.code;
    renderAgentPUSel(agentPU);
    filterAPU();
  }

  toast('Welcome, ' + agent.name + ' · Session secured ✓', 'ok');
}

function shakeBox() {
  const box = document.getElementById('login-box');
  box.style.animation = 'shake .4s';
  setTimeout(() => { box.style.animation = ''; }, 500);
}

function triggerSecurityBlock(reason) {
  document.getElementById('sec-block').classList.add('active');
  document.getElementById('sec-block-msg').textContent = reason + '. Session terminated and flagged.';
  document.getElementById('sec-block-hash').textContent = 'INCIDENT-' + SEC.hash({ reason, ts: Date.now() });
  toast('Security violation detected', 'err');
}

function doLogout() {
  // Capture id before nulling
  const logoutId = currentAgent ? currentAgent.id : null;
  if (currentAgent) {
    SEC.activeSessions.delete(currentAgent.tok);
    SEC.log('ok', 'Agent logged out: ' + currentAgent.id);
  }

  // Mark session offline in localStorage
  if (logoutId) {
    try {
      const sessions = JSON.parse(localStorage.getItem('ekiti_sessions') || '{}');
      if (sessions[logoutId]) {
        sessions[logoutId].status   = 'offline';
        sessions[logoutId].lastSeen = new Date().toISOString();
        localStorage.setItem('ekiti_sessions', JSON.stringify(sessions));
      }
    } catch(e) {}
  }

  currentAgent = null; agentPU = null;
  pickedLat = null; pickedLng = null;

  document.getElementById('login-overlay').style.display = 'flex';
  document.getElementById('asb').style.display   = 'none';
  document.getElementById('amain').style.display = 'none';
  document.getElementById('l-pin').value = '';

  document.getElementById('loc-box').style.display    = 'none';
  document.getElementById('map-btn').style.display    = 'flex';
  document.getElementById('repick-btn').style.display = 'none';
  document.getElementById('suc-ov').classList.remove('show');
  document.getElementById('agent-body').style.display = 'grid';
  document.getElementById('ev-thumb').classList.remove('show');
  document.getElementById('ev-up').classList.remove('done');
  document.getElementById('ev-info').style.display = 'none';
  document.getElementById('ev-inp').value = '';

  toast('Logged out securely', 'info');
}

// ── SIDEBAR BUILDER ───────────────────────────────────────
function buildSidebar() {
  const a    = currentAgent;
  const init = a.name.split(' ').map(n => n[0]).join('').toUpperCase();
  const col  = PARTY_COLORS[a.party] || '#00B04F';

  document.getElementById('ap-av').style.background = col;
  document.getElementById('ap-av').textContent       = init;
  document.getElementById('ap-nm').textContent       = a.name;
  document.getElementById('ap-lga').textContent      = '📍 ' + a.lga;
  document.getElementById('ap-town').textContent     = '🏘️ ' + a.town;
  document.getElementById('sb-id').textContent       = a.id;
  document.getElementById('sb-party').textContent    = a.party;
  document.getElementById('sb-unit').textContent     = a.unit;
  document.getElementById('sb-ward').textContent     = a.ward;
  document.getElementById('sb-lga').textContent      = a.lga;
  document.getElementById('sb-town').textContent     = a.town;
  document.getElementById('sb-sess').textContent     = a.tok.slice(0, 10) + '...';
  document.getElementById('sb-ltime').textContent    = new Date().toTimeString().slice(0, 8);
}

// ── REGISTRATION ──────────────────────────────────────────
function setRegStep(n) {
  for (let i = 1; i <= 5; i++) {
    const tab = document.getElementById('rtab-' + i);
    const sec = document.getElementById('rsec-' + i);
    if (tab) tab.className = 'stab' + (i === n ? ' active' : i < n ? ' done' : '');
    if (sec) sec.className = 'rsec' + (i === n ? ' active' : '');
  }
}

function rNext(step) {
  if (step === 1) {
    if (!document.getElementById('r-fn').value.trim()) return toast('First name is required', 'err');
    if (!document.getElementById('r-ln').value.trim()) return toast('Last name is required', 'err');
    if (!document.getElementById('r-ph').value.trim()) return toast('Phone number is required', 'err');
  }
  if (step === 2) {
    if (!document.getElementById('r-party').value) return toast('Select your political party', 'err');
    if (!regPU) return toast('Search and select your polling unit', 'err');
    if (!document.getElementById('r-town').value.trim()) return toast('Enter your town / area', 'err');
    buildRegSummary();
  }
  if (step === 3) {
    if (!document.getElementById('pp-1').classList.contains('show')) return toast('Upload your passport photograph', 'err');
    if (!document.getElementById('pp-2').classList.contains('show')) return toast('Upload your Voter Card or NIN slip', 'err');
  }
  if (step === 4) {
    const p1 = document.getElementById('r-pin').value;
    const p2 = document.getElementById('r-pin2').value;
    if (p1.length < 6)  return toast('PIN must be at least 6 characters', 'err');
    if (p1 !== p2)       return toast('PINs do not match', 'err');
    if (!document.getElementById('r-sq').value) return toast('Select a security question', 'err');
    if (!document.getElementById('r-sa').value.trim()) return toast('Enter your security answer', 'err');
  }
  setRegStep(step + 1);
}

function rPrev(step) { setRegStep(step - 1); }

function filterRegUnits() {
  regPU = null;
  document.getElementById('r-pu-srch').value = '';
  document.getElementById('r-pu-dd').innerHTML = '';
  document.getElementById('r-pu-dd').classList.remove('open');
  document.getElementById('r-pu-sel').style.display = 'none';
}

function openRegDD() {
  var lga = document.getElementById('r-lga') ? document.getElementById('r-lga').value : '';
  if (!lga) {
    // Show hint instead of blocking
    var dd = document.getElementById('r-pu-dd');
    if (dd) {
      dd.innerHTML = '<div class="pu-opt" style="color:var(--tm);font-style:italic">Select an LGA above first to filter units</div>';
      dd.classList.add('open');
    }
    return;
  }
  searchRegPU();
}

function searchRegPU() {
  var lga = document.getElementById('r-lga').value;
  var q   = document.getElementById('r-pu-srch').value.toLowerCase().trim();
  var dd  = document.getElementById('r-pu-dd');
  if (!lga && !q) { dd.classList.remove('open'); return; }
  var list = lga ? ALL_POLLING_UNITS.filter(function(u){ return u.lga === lga; }) : ALL_POLLING_UNITS;
  if (q) list = list.filter(function(u){
    return u.code.toLowerCase().indexOf(q) > -1 ||
           u.name.toLowerCase().indexOf(q) > -1 ||
           u.ward.toLowerCase().indexOf(q) > -1;
  });
  if (!list.length) {
    dd.innerHTML = '<div class="pu-opt" style="color:var(--tm);font-style:italic">No units found</div>';
    dd.classList.add('open');
    return;
  }
  dd.innerHTML = list.slice(0, 60).map(function(u) {
    return '<div class="pu-opt" onclick="selectRegPU(' + encodeURIComponent(JSON.stringify(u)) + ')">' +
      '<div class="pu-code">' + u.code + '</div>' +
      '<div class="pu-name">' + u.name + '</div>' +
      '<div class="pu-meta">' + u.ward + ' · ' + u.lga + '</div>' +
      '</div>';
  }).join('');
  dd.classList.add('open');
}

function selectRegPU(u) {
  if (typeof u === 'string') { try { u = JSON.parse(decodeURIComponent(u)); } catch(e) { return; } }
  regPU = u;
  var srch = document.getElementById('r-pu-srch');
  var dd   = document.getElementById('r-pu-dd');
  var ward = document.getElementById('r-ward');
  var sel  = document.getElementById('r-pu-sel');
  if (srch) srch.value = u.code + ' — ' + u.name;
  if (dd)   dd.classList.remove('open');
  if (ward) ward.value = u.ward;
  if (sel) {
    sel.style.display = 'block';
    sel.innerHTML =
      '<div class="pu-sel">' +
      '<div class="pu-sel-code">' + u.code + '</div>' +
      '<div class="pu-sel-name">' + u.name + '</div>' +
      '<div class="pu-sel-meta">' + u.ward + ' · ' + u.lga + ' · ' + u.lat.toFixed(4) + ', ' + u.lng.toFixed(4) + '</div>' +
      '</div>';
  }
  updateTag();
}

function updateTag() {
  const party = document.getElementById('r-party').value;
  const lga   = document.getElementById('r-lga').value;
  const town  = (document.getElementById('r-town')?.value || '').trim();
  const fn    = (document.getElementById('r-fn')?.value  || '').trim();
  const ln    = (document.getElementById('r-ln')?.value  || '').trim();
  const name  = (fn + ' ' + ln).trim() || 'Agent Name';
  const init  = [fn, ln].filter(Boolean).map(n => n[0]).join('').toUpperCase() || 'A';
  const col   = PARTY_COLORS[party] || 'var(--g)';

  document.getElementById('tag-av').style.background = col;
  document.getElementById('tag-av').textContent      = init;
  document.getElementById('tag-nm').textContent      = name;
  document.getElementById('tag-id').textContent      = 'ID: Pending';
  document.getElementById('tag-lga').textContent     = '📍 ' + (lga   || 'LGA');
  document.getElementById('tag-town').textContent    = '🏘️ ' + (town  || 'Town');
  document.getElementById('tag-unit').textContent    = 'Unit: ' + (regPU ? regPU.code : '—');
}

function buildRegSummary() {
  const rows = [
    ['Name',  (document.getElementById('r-fn').value + ' ' + document.getElementById('r-ln').value).trim()],
    ['Phone', document.getElementById('r-ph').value],
    ['Party', document.getElementById('r-party').value],
    ['LGA',   document.getElementById('r-lga').value],
    ['Town',  document.getElementById('r-town').value],
    ['Unit',  regPU ? regPU.code : '—'],
    ['Ward',  regPU ? regPU.ward : '—'],
  ];
  var sumHtml = '';
  rows.forEach(function(r) {
    sumHtml += '<div style="display:flex;justify-content:space-between">' +
      '<span style="color:var(--tm)">' + r[0] + '</span>' +
      '<strong>' + (r[1] || '—') + '</strong></div>';
  });
  document.getElementById('reg-summary').innerHTML = sumHtml;
  updateTag();
}

function checkPwd() {
  const v = document.getElementById('r-pin').value;
  let s = 0;
  if (v.length >= 6)  s++;
  if (v.length >= 10) s++;
  if (/[A-Za-z]/.test(v) && /[0-9]/.test(v)) s++;
  if (/[^A-Za-z0-9]/.test(v)) s++;
  const lvls = [
    { w: 0,   c: 'var(--red)',  l: 'Too weak' },
    { w: 25,  c: 'var(--red)',  l: 'Weak'     },
    { w: 50,  c: 'var(--ora)',  l: 'Fair'     },
    { w: 75,  c: 'var(--gold)', l: 'Good'     },
    { w: 100, c: 'var(--g)',    l: 'Strong ✓' },
  ];
  const lvl = lvls[s];
  document.getElementById('pwd-fill').style.width      = lvl.w + '%';
  document.getElementById('pwd-fill').style.background = lvl.c;
  document.getElementById('pwd-txt').textContent = lvl.l;
  document.getElementById('pwd-txt').style.color = lvl.c;
}

function handlePhoto(inpId, prevId, boxId) {
  const file = document.getElementById(inpId).files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const img = document.getElementById(prevId);
    img.src = e.target.result;
    img.classList.add('show');
    document.getElementById(boxId).classList.add('done');
    toast('Document uploaded', 'ok');
  };
  reader.readAsDataURL(file);
}

let _regSubmitting = false;

function completeReg() {
  // Guard: prevent double-click / repeated calls
  if (_regSubmitting) return;

  if (!regPU)  return toast('Select a polling unit', 'err');
  const party = document.getElementById('r-party').value;
  const lga   = document.getElementById('r-lga').value;
  const town  = document.getElementById('r-town').value.trim();
  const pin   = document.getElementById('r-pin').value;
  const fn    = document.getElementById('r-fn').value.trim();
  const ln    = document.getElementById('r-ln').value.trim();

  if (!fn || !ln)           return toast('First and last name are required', 'err');
  if (!party || !lga || !town) return toast('Complete all required fields', 'err');
  if (pin.length < 6)       return toast('PIN must be at least 6 characters', 'err');

  // Lock the button immediately
  _regSubmitting = true;
  const btn = document.querySelector('[onclick="completeReg()"]');
  if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Registering...'; }

  regAgentCount++;
  const lgaCode = regPU.code.split('/')[1];
  const agentId = 'EK-' + party + '-' + lgaCode + '-' + String(regAgentCount).padStart(4, '0');

  const newAgent = {
    pin, party, lga, town,
    name: (fn + ' ' + ln).trim(),
    unit: regPU.code,
    ward: regPU.ward,
  };

  // Save to localStorage — only once
  try {
    const stored = JSON.parse(localStorage.getItem('ekiti_agents') || '{}');
    stored[agentId] = newAgent;
    localStorage.setItem('ekiti_agents', JSON.stringify(stored));
    localStorage.setItem('ekiti_pending_login', agentId);
  } catch(e) {
    console.warn('localStorage not available:', e);
  }

  // Show the generated ID in the tag preview
  document.getElementById('tag-id').textContent = 'ID: ' + agentId;
  SEC.log('ok', 'Agent registered: ' + agentId, party + ' · ' + lga + ' · ' + regPU.code);
  toast('Registration complete! Agent ID: ' + agentId + ' — redirecting to login...', 'ok');

  // Redirect to agent login after 2.5 seconds
  setTimeout(() => {
    window.location.href = 'agent.html';
  }, 2500);
}