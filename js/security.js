// ============================================================
//  js/security.js  —  Pure ES5
//  7-layer security engine + AI anomaly detection
// ============================================================

var SEC = {
  attempts: 0, maxAttempts: 5, lockedUntil: 0, lockTimer: null,
  auditLog: [], blockedSessions: [], rateBuckets: {},
  honeypots: ['admin','root','test','password','123456','inec','nigeria','pass','1234'],
  captchaAns: null, captchaActive: false,
  activeSessions: (function(){
    var m = {};
    return {
      _m: m,
      has: function(k){ return !!m[k]; },
      add: function(k){ m[k] = 1; this.size = Object.keys(m).length; },
      delete: function(k){ delete m[k]; this.size = Object.keys(m).length; },
      size: 0
    };
  })(),

  // FNV-1a 32-bit hash
  hash: function(data) {
    var h = 2166136261;
    var s = (typeof data === 'string') ? data : JSON.stringify(data);
    var i;
    for (i = 0; i < s.length; i++) {
      h = h ^ s.charCodeAt(i);
      h = ((h >>> 0) * 16777619) >>> 0;
    }
    var r = h.toString(16).toUpperCase();
    while (r.length < 8) r = '0' + r;
    return r;
  },

  // Random session token
  token: function() {
    var c = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', r = '', i;
    for (i = 0; i < 24; i++) r += c[Math.floor(Math.random() * c.length)];
    return r;
  },

  // Rate limiter
  rateCheck: function(key, limit, windowMs) {
    limit = limit || 10; windowMs = windowMs || 60000;
    var now = Date.now();
    if (!this.rateBuckets[key]) this.rateBuckets[key] = [];
    this.rateBuckets[key] = this.rateBuckets[key].filter(function(t){ return now - t < windowMs; });
    if (this.rateBuckets[key].length >= limit) return false;
    this.rateBuckets[key].push(now);
    return true;
  },

  // Injection + anomaly detection
  detectAnomaly: function(id, pin) {
    if (!id || !pin) return {ok:false, reason:'Empty credentials submitted'};
    if (id.length > 40 || pin.length > 60) return {ok:false, reason:'Input length anomaly detected'};
    if (/<[^>]+>|script|SELECT|DROP|INSERT|UNION/i.test(id + pin)) return {ok:false, reason:'Injection pattern detected'};
    var pl = pin.toLowerCase();
    for (var i = 0; i < this.honeypots.length; i++) {
      if (pl === this.honeypots[i]) return {ok:false, reason:'Honeypot credential triggered'};
    }
    return {ok:true};
  },

  // Math CAPTCHA
  makeCaptcha: function() {
    var r = function(a,b){ return Math.floor(Math.random()*(b-a+1))+a; };
    var t = Math.floor(Math.random()*3), a, b, q;
    if (t===0){a=r(5,25); b=r(1,10); q=a+' + '+b; this.captchaAns=String(a+b);}
    if (t===1){a=r(10,30);b=r(1,9);  q=a+' - '+b; this.captchaAns=String(a-b);}
    if (t===2){a=r(2,9);  b=r(2,9);  q=a+' x '+b; this.captchaAns=String(a*b);}
    return {q:q};
  },

  // ── AI ANOMALY DETECTION ENGINE ──────────────────────────
  // Flags statistically suspicious result patterns
  analyseResults: function(votes, stateCode, lgaCode) {
    var flags = [];
    var total = 0, maxV = 0, k;
    for (k in votes) { total += votes[k]; if (votes[k] > maxV) maxV = votes[k]; }
    if (total === 0) return flags;
    // Flag 1: winner takes >95% — statistically rare
    if (maxV / total > 0.95) flags.push({level:'warn', msg:'Winner share >95% — unusual margin'});
    // Flag 2: perfect round numbers (manipulation signal)
    var roundCount = 0;
    for (k in votes) { if (votes[k] > 0 && votes[k] % 100 === 0) roundCount++; }
    if (roundCount >= 3) flags.push({level:'warn', msg:'Multiple parties have round-number votes'});
    // Flag 3: total votes exceed typical accreditation threshold
    if (total > 1800) flags.push({level:'crit', msg:'Total votes (' + total + ') exceeds typical unit capacity'});
    // Flag 4: zero votes for all major parties except winner
    var majorZero = 0;
    for (var i = 0; i < MAJOR_PARTIES.length; i++) {
      if ((votes[MAJOR_PARTIES[i]] || 0) === 0) majorZero++;
    }
    if (majorZero >= 4) flags.push({level:'warn', msg:'Multiple major parties show 0 votes'});
    return flags;
  },

  // Tamper-evident audit log with hash chaining
  log: function(type, msg, detail) {
    detail = detail || '';
    var entry = {
      type:type, msg:msg, detail:detail,
      time:new Date().toTimeString().slice(0,8),
      ts:Date.now(), seq:this.auditLog.length
    };
    entry.chain = this.hash((this.auditLog[0] ? this.auditLog[0].chain : 'GENESIS') + JSON.stringify(entry));
    this.auditLog.unshift(entry);
    if (this.auditLog.length > 1000) this.auditLog.pop();
    if (typeof renderSecLog === 'function') renderSecLog();
    if (typeof updateSecStats === 'function') updateSecStats();
    if (typeof updateThreatBanner === 'function') updateThreatBanner();
  }
};
