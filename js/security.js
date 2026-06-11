// ============================================================
//  js/security.js
//  SEC Engine — brute force, CAPTCHA, anomaly detection,
//  rate limiting, session tokens, hash chaining, audit log
// ============================================================

const SEC = {
  attempts: 0,
  maxAttempts: 5,
  lockedUntil: 0,
  lockTimer: null,
  auditLog: [],
  blockedSessions: [],
  activeSessions: new Set(),
  rateBuckets: {},
  honeypots: new Set(['admin','root','test','password','123456','inec','ekiti','pass']),
  captchaAns: null,
  captchaActive: false,

  // FNV-1a 32-bit hash — tamper-evident chain
  hash(data) {
    let h = 2166136261;
    const s = typeof data === 'string' ? data : JSON.stringify(data);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h.toString(16).toUpperCase().padStart(8, '0');
  },

  // Cryptographically random session token
  token() {
    const arr = new Uint8Array(16);
    (window.crypto || window.msCrypto).getRandomValues(arr);
    return Array.from(arr, b => b.toString(16).padStart(2,'0')).join('').toUpperCase();
  },

  // Sliding window rate limiter
  rateCheck(key, limit = 10, windowMs = 60000) {
    const now = Date.now();
    if (!this.rateBuckets[key]) this.rateBuckets[key] = [];
    this.rateBuckets[key] = this.rateBuckets[key].filter(t => now - t < windowMs);
    if (this.rateBuckets[key].length >= limit) return false;
    this.rateBuckets[key].push(now);
    return true;
  },

  // Injection + anomaly detection
  detectAnomaly(id, pin) {
    if (!id || !pin) return { ok: false, reason: 'Empty credentials submitted' };
    if (id.length > 40 || pin.length > 60) return { ok: false, reason: 'Input length anomaly — possible overflow attempt' };
    const inject = /<[^>]+>|script|SELECT|DROP|INSERT|UPDATE|UNION|exec\s*\(|eval\s*\(|--\s|\/\*/i;
    if (inject.test(id + pin)) return { ok: false, reason: 'Injection pattern detected in input fields' };
    if (this.honeypots.has(pin.toLowerCase())) return { ok: false, reason: 'Honeypot credential triggered — automated attack suspected' };
    if (/[^\x20-\x7E]/.test(id)) return { ok: false, reason: 'Non-printable characters detected in Agent ID' };
    return { ok: true };
  },

  // Math CAPTCHA generator
  makeCaptcha() {
    const r = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
    var ops = [
      function() { var a = r(5,25),  b = r(1,10); return { q: a + ' + ' + b, a: String(a+b) }; },
      function() { var a = r(10,30), b = r(1,9);  return { q: a + ' - ' + b, a: String(a-b) }; },
      function() { var a = r(2,9),   b = r(2,9);  return { q: a + ' × ' + b, a: String(a*b) }; },
    ];
    const c = ops[Math.floor(Math.random() * 3)]();
    this.captchaAns = c.a;
    return c;
  },

  // Append to tamper-evident audit log
  log(type, msg, detail = '') {
    const entry = {
      type, msg, detail,
      time: new Date().toTimeString().slice(0, 8),
      ts: Date.now(),
      seq: this.auditLog.length,
    };
    // Chain hash — each entry includes hash of previous
    const prev = this.auditLog[0];
    entry.chain = this.hash((prev ? prev.chain : 'GENESIS') + JSON.stringify(entry));
    this.auditLog.unshift(entry);
    if (this.auditLog.length > 500) this.auditLog.pop();
    if (typeof renderSecLog === 'function') renderSecLog();
    if (typeof updateSecStats === 'function') updateSecStats();
    if (typeof updateThreatBanner === 'function') updateThreatBanner();
  },
};