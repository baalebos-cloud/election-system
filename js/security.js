// ============================================================
//  js/security.js  —  Pure ES5
//  Brute-force, CAPTCHA, anomaly detection, rate limit,
//  session tokens, hash chaining, audit log
// ============================================================

var SEC = {
  attempts:       0,
  maxAttempts:    5,
  lockedUntil:    0,
  lockTimer:      null,
  auditLog:       [],
  blockedSessions:[],
  activeSessions: (function(){ var s={has:function(k){return !!s._m[k];},add:function(k){s._m[k]=1;},delete:function(k){delete s._m[k];},_m:{},size:0}; var origAdd=s.add; s.add=function(k){origAdd.call(s,k);s.size=Object.keys(s._m).length;}; var origDel=s.delete; s.delete=function(k){origDel.call(s,k);s.size=Object.keys(s._m).length;}; return s; })(),
  rateBuckets:    {},
  honeypots:      ['admin','root','test','password','123456','inec','ekiti','pass'],
  captchaAns:     null,
  captchaActive:  false,

  hash: function(data) {
    var h = 2166136261;
    var s = (typeof data === 'string') ? data : JSON.stringify(data);
    var i;
    for (i = 0; i < s.length; i++) {
      h = h ^ s.charCodeAt(i);
      h = ((h >>> 0) * 16777619) >>> 0;
    }
    var result = h.toString(16).toUpperCase();
    while (result.length < 8) result = '0' + result;
    return result;
  },

  token: function() {
    var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    var result = '';
    var i;
    for (i = 0; i < 24; i++) {
      result += chars[Math.floor(Math.random() * chars.length)];
    }
    return result;
  },

  rateCheck: function(key, limit, windowMs) {
    limit = limit || 10;
    windowMs = windowMs || 60000;
    var now = Date.now();
    if (!this.rateBuckets[key]) this.rateBuckets[key] = [];
    var bucket = this.rateBuckets[key].filter(function(t){ return now - t < windowMs; });
    this.rateBuckets[key] = bucket;
    if (bucket.length >= limit) return false;
    this.rateBuckets[key].push(now);
    return true;
  },

  detectAnomaly: function(id, pin) {
    if (!id || !pin) return { ok: false, reason: 'Empty credentials submitted' };
    if (id.length > 40 || pin.length > 60) return { ok: false, reason: 'Input length anomaly detected' };
    var inject = /<[^>]+>|script|SELECT|DROP|INSERT|UPDATE|UNION/i;
    if (inject.test(id + pin)) return { ok: false, reason: 'Injection pattern detected' };
    var pinLower = pin.toLowerCase();
    for (var i = 0; i < this.honeypots.length; i++) {
      if (pinLower === this.honeypots[i]) return { ok: false, reason: 'Honeypot credential triggered' };
    }
    return { ok: true };
  },

  makeCaptcha: function() {
    var r = function(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; };
    var type = Math.floor(Math.random() * 3);
    var a, b, q, ans;
    if (type === 0) { a = r(5,25);  b = r(1,10); q = a + ' + ' + b; ans = String(a+b); }
    if (type === 1) { a = r(10,30); b = r(1,9);  q = a + ' - ' + b; ans = String(a-b); }
    if (type === 2) { a = r(2,9);   b = r(2,9);  q = a + ' x ' + b; ans = String(a*b); }
    this.captchaAns = ans;
    return { q: q, a: ans };
  },

  log: function(type, msg, detail) {
    detail = detail || '';
    var entry = {
      type:   type,
      msg:    msg,
      detail: detail,
      time:   new Date().toTimeString().slice(0,8),
      ts:     Date.now(),
    };
    entry.chain = this.hash((this.auditLog[0] ? this.auditLog[0].chain : 'GENESIS') + JSON.stringify(entry));
    this.auditLog.unshift(entry);
    if (this.auditLog.length > 500) this.auditLog.pop();
    if (typeof renderSecLog    === 'function') renderSecLog();
    if (typeof updateSecStats  === 'function') updateSecStats();
    if (typeof updateThreatBanner === 'function') updateThreatBanner();
  }
};
