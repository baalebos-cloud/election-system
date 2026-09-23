// ============================================================
//  js/app.js  —  Pure ES5
//  Screen router, toast, clock, state filter, init
// ============================================================

function showScreen(name) {
  var screens = document.querySelectorAll('.screen');
  var btns    = document.querySelectorAll('.nb');
  var i;
  for (i = 0; i < screens.length; i++) screens[i].classList.remove('active');
  for (i = 0; i < btns.length; i++)    btns[i].classList.remove('active');
  var sc = document.getElementById(name + '-screen');
  if (sc) sc.classList.add('active');
  var names = ['dashboard','agent','results','security','reg'];
  var idx   = names.indexOf(name);
  if (btns[idx]) btns[idx].classList.add('active');
  if (name === 'dashboard') { refreshDash(); initDashMap(); }
  if (name === 'results')   { renderResults(); }
  if (name === 'security')  { renderSecLog(); updateSecStats(); }
}

function toast(msg, type) {
  type = type || 'ok';
  var icons = { ok:'\u2705', err:'\u274C', warn:'\u26A0\uFE0F', info:'\u2139\uFE0F' };
  var t = document.createElement('div');
  t.className = 'toast' + (type !== 'ok' ? ' ' + type : '');
  t.innerHTML = '<span>' + (icons[type]||'\u2705') + '</span><span>' + msg + '</span>';
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
    var d = document.getElementById('r-pu-dd');
    if (d) d.classList.remove('open');
  }
  if (!e.target.closest('#a-pu-srch') && !e.target.closest('#a-pu-dd')) {
    var d2 = document.getElementById('a-pu-dd');
    if (d2) d2.classList.remove('open');
  }
});

// Live feed simulation
setInterval(function() {
  if (Math.random() > 0.65 && typeof MOCK_FEED !== 'undefined' && typeof ALL_POLLING_UNITS !== 'undefined') {
    var u = ALL_POLLING_UNITS[Math.floor(Math.random() * Math.min(ALL_POLLING_UNITS.length, 500))];
    MOCK_FEED.unshift({ u: u.code, state: u.state, d: 'Agent activity detected', age: 'fn' });
    if (MOCK_FEED.length > 25) MOCK_FEED.pop();
    var dash = document.getElementById('dashboard-screen');
    if (dash && dash.classList.contains('active')) renderFeed();
  }
}, 9000);

// Page-aware init
document.addEventListener('DOMContentLoaded', function() {
  SEC.log('ok',   'NICERES v1.0 initialised', '176,846 polling units | 36 States + FCT | Nigeria');
  SEC.log('ok',   'Security monitoring online', 'Brute-force, rate-limiting, anomaly detection, AI analysis');
  SEC.log('ok',   'AI anomaly engine ready', 'Statistical outlier detection on all result submissions');
  SEC.log('info', 'Audit logging started', 'All events hash-chained and tamper-evident');
  updateThreatBanner();
  updateSecStats();

  var active = document.querySelector('.screen.active');
  if (active) {
    var id = active.id;
    if (id === 'dashboard-screen') { seedMockData(); refreshDash(); initDashMap(); }
    if (id === 'results-screen')   { seedMockData(); renderResults(); }
    if (id === 'security-screen')  { seedMockData(); renderSecLog(); updateSecStats(); }
  }
});
