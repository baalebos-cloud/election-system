// ============================================================
//  js/app.js  —  Pure ES5
//  Screen router, toast, clock, init
//  LIVE DATA: No more mock data - fetches from API
// ============================================================

function showScreen(name) {
  var screens = document.querySelectorAll('.screen');
  var btns    = document.querySelectorAll('.nb');
  var i;
  for (i = 0; i < screens.length; i++) screens[i].classList.remove('active');
  for (i = 0; i < btns.length; i++)    btns[i].classList.remove('active');
  var screen = document.getElementById(name + '-screen');
  if (screen) screen.classList.add('active');
  var names = ['dashboard','agent','results','security','reg'];
  var idx   = names.indexOf(name);
  if (btns[idx]) btns[idx].classList.add('active');
  if (name === 'dashboard') { refreshDash(); initDashMap(); }
  if (name === 'results')   { fetchLiveResults(); }
  if (name === 'security')  { renderSecLog(); updateSecStats(); }
}

function toast(msg, type) {
  type = type || 'ok';
  var icons = { ok:'\u2705', err:'\u274C', warn:'\u26A0\uFE0F', info:'\u2139\uFE0F' };
  var t = document.createElement('div');
  t.className = 'toast' + (type !== 'ok' ? ' ' + type : '');
  t.innerHTML = '<span>' + (icons[type] || '\u2705') + '</span><span>' + msg + '</span>';
  var tc = document.getElementById('toast-c');
  if (tc) tc.appendChild(t);
  setTimeout(function() { if (t.parentNode) t.parentNode.removeChild(t); }, 4200);
}

// Clock
setInterval(function() {
  var el = document.getElementById('clk');
  if (el) el.textContent = new Date().toTimeString().slice(0,8);
}, 1000);

// Close dropdowns on outside click
document.addEventListener('click', function(e) {
  if (!e.target.closest('#r-pu-srch') && !e.target.closest('#r-pu-dd')) {
    var dd = document.getElementById('r-pu-dd');
    if (dd) dd.classList.remove('open');
  }
  if (!e.target.closest('#a-pu-srch') && !e.target.closest('#a-pu-dd')) {
    var dd2 = document.getElementById('a-pu-dd');
    if (dd2) dd2.classList.remove('open');
  }
});

// Page-aware init — LIVE DATA (no more mock data)
document.addEventListener('DOMContentLoaded', function() {
  SEC.log('ok',   'System initialised', '2,195 polling units, 16 LGAs, Ekiti State');
  SEC.log('ok',   'Security monitoring online', 'Brute-force, rate limiting, anomaly detection');
  SEC.log('info', 'Audit logging started', 'All events timestamped and chain-hashed');
  updateThreatBanner();
  updateSecStats();

  var activeScreen = document.querySelector('.screen.active');
  if (activeScreen) {
    var id = activeScreen.id;
    if (id === 'dashboard-screen') { refreshDash(); initDashMap(); }
    if (id === 'results-screen')   { fetchLiveResults(); }
    if (id === 'security-screen')  { renderSecLog(); updateSecStats(); }
  }
});
