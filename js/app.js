// VERSION: 2026-05-30 10:27 — live refresh interval
// ============================================================
//  js/app.js
//  Application bootstrap — shared utilities, screen router,
//  clock, global event listeners, init
// ============================================================

// ── SCREEN NAVIGATION ─────────────────────────────────────
function showScreen(name) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.nb').forEach(b => b.classList.remove('active'));
  const target = document.getElementById(name + '-screen');
  if (!target) return;
  target.classList.add('active');
  const idx  = ['dashboard', 'agent', 'results', 'security', 'reg'].indexOf(name);
  const btns = document.querySelectorAll('.nb');
  if (btns[idx]) btns[idx].classList.add('active');
  if (name === 'dashboard') initDashMap();
  if (name === 'results')   renderResults();
  if (name === 'security')  { renderSecLog(); updateSecStats(); }
}

// ── TOAST NOTIFICATIONS ───────────────────────────────────
function toast(msg, type = 'ok') {
  const icons = { ok: '✅', err: '❌', warn: '⚠️', info: 'ℹ️' };
  const t = document.createElement('div');
  t.className = 'toast' + (type !== 'ok' ? ' ' + type : '');
  t.innerHTML = '<span>' + (icons[type] || '✅') + '</span><span>' + msg + '</span>';
  document.getElementById('toast-c').appendChild(t);
  setTimeout(() => t.remove(), 4200);
}

// ── CLOCK ─────────────────────────────────────────────────
setInterval(() => {
  const el = document.getElementById('clk');
  if (el) el.textContent = new Date().toTimeString().slice(0, 8);
}, 1000);

// ── CLOSE DROPDOWNS ON OUTSIDE CLICK ─────────────────────
document.addEventListener('click', e => {
  if (!e.target.closest('#r-pu-srch') && !e.target.closest('#r-pu-dd'))
    document.getElementById('r-pu-dd')?.classList.remove('open');
  if (!e.target.closest('#a-pu-srch') && !e.target.closest('#a-pu-dd'))
    document.getElementById('a-pu-dd')?.classList.remove('open');
});

// ── DEVTOOLS DETERRENCE ───────────────────────────────────
document.addEventListener('keydown', e => {
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && ['I','J','C'].includes(e.key))) {
    SEC.log('warn', 'DevTools open attempt detected', 'Possible inspection of secure system');
  }
});

// ── LIVE FEED SIMULATION ──────────────────────────────────
// Refresh dashboard data every 10 seconds to pick up new localStorage submissions
setInterval(() => {
  try {
    const ds = document.getElementById('dashboard-screen');
    if (ds && ds.classList.contains('active')) {
      loadRealResults();
      refreshDash();
    }
    const rs = document.getElementById('results-screen');
    if (rs && rs.classList.contains('active')) {
      loadRealResults();
      renderResults();
    }
  } catch(e) {}
}, 10000);

// ── INIT ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {

  // Safely log init — SEC may not have all DOM elements on every page
  try { SEC.log('ok', 'System initialised', ALL_POLLING_UNITS.length + ' polling units · 16 LGAs'); } catch(e) {}
  try { SEC.log('ok', 'Encryption layer active', 'FNV-1a hash chaining · Session token auth'); } catch(e) {}
  try { SEC.log('ok', 'Security monitoring online', 'Brute-force · Rate limiting · Honeypots'); } catch(e) {}
  try { updateThreatBanner(); } catch(e) {}
  try { updateSecStats(); } catch(e) {}

  // Pre-fill login form if redirected from register.html
  try {
    const pendingId = localStorage.getItem('ekiti_pending_login');
    if (pendingId) {
      const loginField = document.getElementById('l-id');
      if (loginField) {
        loginField.value = pendingId;
        localStorage.removeItem('ekiti_pending_login');
        setTimeout(() => {
          toast('Registration complete! Agent ID: ' + pendingId + ' — enter your PIN to login', 'ok');
        }, 400);
      }
    }
  } catch(e) {}

  // Page-specific init — each in its own try so one failure cannot block others
  try {
    const activeScreen = document.querySelector('.screen.active');
    if (activeScreen) {
      const id = activeScreen.id;
      if (id === 'dashboard-screen') { seedMockData(); loadRealResults(); refreshDash(); initDashMap(); }
      if (id === 'results-screen')   { seedMockData(); loadRealResults(); renderResults(); }
      if (id === 'security-screen')  { seedMockData(); renderSecLog(); updateSecStats(); }
      // reg-screen and agent-screen need no special init
    }
  } catch(e) { console.warn('Page init error:', e.message); }

});