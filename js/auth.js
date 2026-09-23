// ============================================================
//  js/auth.js  —  Pure ES5
//  Login, logout, agent registration
// ============================================================

var AGENTS = {
  'NG-APC-EK-AD-0001': {pin:'secure1', name:'Taiwo Adeyemi',    party:'APC',  state:'Ekiti',  lga:'ADO-EKITI',  unit:'EKS/AD/0001', ward:"ADO 'A'"},
  'NG-PDP-LA-IK-0001': {pin:'pass123', name:'Funmi Olaoluwa',   party:'PDP',  state:'Lagos',  lga:'IKEJA',      unit:'LGS/IK/0001', ward:'IKEJA WARD 1'},
  'NG-LP-AB-AI-0001':  {pin:'labour7', name:'Emeka Okonkwo',    party:'LP',   state:'Abia',   lga:'ABA',        unit:'ABN/AI/0001', ward:'ABA WARD 1'},
  'NG-NNPP-KN-DC-0001':{pin:'nnpp24',  name:'Musa Garba',       party:'NNPP', state:'Kano',   lga:'DALA',       unit:'KNO/DC/0001', ward:'DALA WARD 1'}
};

var currentAgent    = null;
var agentPU         = null;
var selectedState   = null;
var regPU           = null;
var regAgentCount   = 4;
var evidenceDataUrl = null;

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
    addr:'Session-' + Math.floor(Math.random()*9000+1000),
    reason:'Max login attempts exceeded (5)',
    time:new Date().toTimeString().slice(0,8)
  });
  SEC.log('crit','Account locked','5 failed attempts');
  var lb = document.getElementById('lockout-box');
  if (lb) lb.classList.add('show');
  showCaptchaField();
  var secs = 300;
  SEC.lockTimer = setInterval(function() {
    secs--;
    var el = document.getElementById('lock-timer');
    if (el) el.textContent = (Math.floor(secs/60)<10?'0':'')+Math.floor(secs/60)+':'+(secs%60<10?'0':'')+secs%60;
    if (secs <= 0) {
      clearInterval(SEC.lockTimer);
      var lb2 = document.getElementById('lockout-box');
      if (lb2) lb2.classList.remove('show');
      SEC.attempts = 0; SEC.lockedUntil = 0;
      updateDots();
      toast('Account unlocked \u2014 try again','info');
    }
  }, 1000);
}

function showCaptchaField() {
  var c = SEC.makeCaptcha();
  var q = document.getElementById('captcha-q');
  var s = document.getElementById('captcha-sec');
  if (q) q.textContent = c.q;
  if (s) s.style.display = 'block';
  SEC.captchaActive = true;
}

// ── LOGIN ─────────────────────────────────────────────────
function doLogin() {
  var idEl  = document.getElementById('l-id');
  var pinEl = document.getElementById('l-pin');
  var id    = idEl  ? idEl.value.trim() : '';
  var pin   = pinEl ? pinEl.value       : '';

  if (Date.now() < SEC.lockedUntil) { toast('Account locked \u2014 wait for timer','err'); return; }
  if (!SEC.rateCheck('login',10,60000)) { toast('Too many requests \u2014 slow down','err'); return; }

  if (SEC.captchaActive) {
    var ci = document.getElementById('captcha-inp');
    var ans = ci ? ci.value.trim() : '';
    if (ans !== SEC.captchaAns) {
      SEC.makeCaptcha();
      var cq = document.getElementById('captcha-q');
      if (cq) cq.textContent = SEC.captchaAns;
      if (ci) ci.value = '';
      toast('Incorrect CAPTCHA','err'); return;
    }
    SEC.captchaActive = false;
    var cs = document.getElementById('captcha-sec');
    if (cs) cs.style.display = 'none';
  }

  var anomaly = SEC.detectAnomaly(id, pin);
  if (!anomaly.ok) {
    SEC.attempts++; updateDots();
    SEC.log('crit','Anomaly: '+anomaly.reason,id.slice(0,20));
    triggerSecBlock(anomaly.reason); return;
  }

  var agent = AGENTS[id];
  if (!agent || agent.pin !== pin) {
    SEC.attempts++; updateDots();
    SEC.log('warn','Failed login','ID: '+id+' attempt '+SEC.attempts+'/5');
    toast('Invalid credentials \u2014 '+(5-SEC.attempts)+' attempts remaining','err');
    var lb = document.getElementById('login-box');
    if (lb) { lb.style.animation='shake .4s'; setTimeout(function(){ lb.style.animation=''; },500); }
    if (SEC.attempts === 3 && !SEC.captchaActive) { showCaptchaField(); toast('CAPTCHA required','warn'); }
    if (SEC.attempts >= 5) triggerLockout();
    return;
  }

  var tok = SEC.token();
  SEC.activeSessions.add(tok);
  SEC.attempts = 0; updateDots();
  SEC.log('ok','Login: '+id,'State: '+agent.state+' Party: '+agent.party);

  currentAgent = {id:id,tok:tok,name:agent.name,party:agent.party,
                  state:agent.state,lga:agent.lga,unit:agent.unit,ward:agent.ward};
  buildSidebar();

  var ov  = document.getElementById('login-overlay');
  var asb = document.getElementById('asb');
  var am  = document.getElementById('amain');
  if (ov)  ov.style.display  = 'none';
  if (asb) asb.style.display = 'flex';
  if (am)  am.style.display  = 'flex';

  buildResultsForm();
  toast('Welcome, '+agent.name+' \u00b7 Session secured','ok');
}

function triggerSecBlock(reason) {
  var sb = document.getElementById('sec-block');
  var sm = document.getElementById('sec-block-msg');
  var sh = document.getElementById('sec-block-hash');
  if (sb) sb.classList.add('active');
  if (sm) sm.textContent = reason+'. Session terminated.';
  if (sh) sh.textContent = 'INCIDENT-'+SEC.hash({r:reason,ts:Date.now()});
  toast('Security violation detected','err');
}

// ── LOGOUT ────────────────────────────────────────────────
function doLogout() {
  if (currentAgent) { SEC.activeSessions.delete(currentAgent.tok); SEC.log('ok','Logout: '+currentAgent.id); }
  currentAgent = null; agentPU = null; evidenceDataUrl = null;
  pickedLat = null; pickedLng = null;
  var ov  = document.getElementById('login-overlay');
  var asb = document.getElementById('asb');
  var am  = document.getElementById('amain');
  var pin = document.getElementById('l-pin');
  if (ov)  ov.style.display  = 'flex';
  if (asb) asb.style.display = 'none';
  if (am)  am.style.display  = 'none';
  if (pin) pin.value = '';
  toast('Logged out securely','info');
}

// ── SIDEBAR ───────────────────────────────────────────────
function buildSidebar() {
  var a = currentAgent;
  var parts = a.name.split(' '), init = '', i;
  for (i = 0; i < parts.length; i++) if (parts[i]) init += parts[i][0];
  init = init.toUpperCase() || 'A';
  var col = PARTY_COLORS[a.party] || '#00B04F';
  var map = {
    'ap-av':{bg:col,txt:init},'ap-nm':{txt:a.name},
    'ap-state':{txt:'\uD83D\uDDFA\uFE0F '+a.state},'ap-lga':{txt:'\uD83D\uDCCD '+a.lga},
    'sb-id':{txt:a.id},'sb-party':{txt:a.party},'sb-state':{txt:a.state},
    'sb-lga':{txt:a.lga},'sb-unit':{txt:a.unit},'sb-ward':{txt:a.ward},
    'sb-sess':{txt:a.tok.slice(0,10)+'...'},'sb-subs':{txt:'0'},
    'sb-ltime':{txt:new Date().toTimeString().slice(0,8)}
  };
  var k, el;
  for (k in map) {
    el = document.getElementById(k);
    if (!el) continue;
    if (map[k].bg) el.style.background = map[k].bg;
    if (map[k].txt !== undefined) el.textContent = map[k].txt;
  }
}

// ── REGISTRATION ─────────────────────────────────────────
function setRegStep(n) {
  var i, tab, sec;
  for (i = 1; i <= 5; i++) {
    tab = document.getElementById('rtab-'+i);
    sec = document.getElementById('rsec-'+i);
    if (tab) tab.className = 'stab'+(i===n?' active':i<n?' done':'');
    if (sec) sec.className = 'rsec'+(i===n?' active':'');
  }
}

function rNext(step) {
  var fn=document.getElementById('r-fn'), ln=document.getElementById('r-ln'),
      ph=document.getElementById('r-ph'), rp=document.getElementById('r-party'),
      rs=document.getElementById('r-state'), rt=document.getElementById('r-town'),
      p1=document.getElementById('r-pin'), p2=document.getElementById('r-pin2'),
      sq=document.getElementById('r-sq'), sa=document.getElementById('r-sa'),
      pp1=document.getElementById('pp-1'), pp2=document.getElementById('pp-2');

  if (step===1) {
    if (!fn||!fn.value.trim()) {toast('First name is required','err');return;}
    if (!ln||!ln.value.trim()) {toast('Last name is required','err');return;}
    if (!ph||!ph.value.trim()) {toast('Phone number is required','err');return;}
  }
  if (step===2) {
    if (!rp||!rp.value)        {toast('Select your political party','err');return;}
    if (!rs||!rs.value)        {toast('Select your state','err');return;}
    if (!regPU)                {toast('Search and select your polling unit','err');return;}
    if (!rt||!rt.value.trim()) {toast('Enter your town / area','err');return;}
    buildRegSummary();
  }
  if (step===3) {
    if (!pp1||!pp1.classList.contains('show')){toast('Upload your passport photograph','err');return;}
    if (!pp2||!pp2.classList.contains('show')){toast('Upload your Voter Card or NIN slip','err');return;}
  }
  if (step===4) {
    if (!p1||p1.value.length<6)       {toast('PIN must be at least 6 characters','err');return;}
    if (!p2||p1.value!==p2.value)      {toast('PINs do not match','err');return;}
    if (!sq||!sq.value)                {toast('Select a security question','err');return;}
    if (!sa||!sa.value.trim())         {toast('Enter your security answer','err');return;}
  }
  setRegStep(step+1);
}

function rPrev(step) { setRegStep(step-1); }

function onStateChange() {
  regPU = null;
  var s = document.getElementById('r-pu-srch');
  var d = document.getElementById('r-pu-dd');
  var e = document.getElementById('r-pu-sel');
  if (s) s.value = '';
  if (d) { d.innerHTML=''; d.classList.remove('open'); }
  if (e) e.style.display = 'none';
  updateTag();
}

function openRegDD() {
  var st = document.getElementById('r-state') ? document.getElementById('r-state').value : '';
  var dd = document.getElementById('r-pu-dd');
  if (!st) {
    if (dd) { dd.innerHTML='<div class="pu-opt" style="color:var(--tm);font-style:italic">Select a state first</div>'; dd.classList.add('open'); }
    return;
  }
  searchRegPU();
}

function searchRegPU() {
  var stEl = document.getElementById('r-state');
  var srch = document.getElementById('r-pu-srch');
  var dd   = document.getElementById('r-pu-dd');
  var st   = stEl ? stEl.value : '';
  var q    = srch ? srch.value.toLowerCase().trim() : '';
  var list = ALL_POLLING_UNITS, i, u, safe, html;

  if (!st&&!q) { if(dd) dd.classList.remove('open'); return; }
  if (st) list = list.filter(function(u){ return u.state === st; });
  if (q)  list = list.filter(function(u){
    return u.code.toLowerCase().indexOf(q)>-1 ||
           u.name.toLowerCase().indexOf(q)>-1 ||
           u.ward.toLowerCase().indexOf(q)>-1 ||
           (u.lga&&u.lga.toLowerCase().indexOf(q)>-1);
  });

  if (!list.length) {
    if(dd){dd.innerHTML='<div class="pu-opt" style="color:var(--tm);font-style:italic">No units found</div>';dd.classList.add('open');}
    return;
  }
  html = '';
  for (i=0;i<Math.min(list.length,60);i++) {
    u=list[i]; safe=JSON.stringify(u).replace(/'/g,"\\'");
    html+='<div class="pu-opt" onclick=\'selectRegPU('+safe+')\'>'+'<div class="pu-code">'+u.code+'</div>'+'<div class="pu-name">'+u.name+'</div>'+'<div class="pu-meta">'+u.ward+' &middot; '+u.lga+' &middot; '+u.state+'</div></div>';
  }
  if(dd){dd.innerHTML=html;dd.classList.add('open');}
}

function selectRegPU(u) {
  regPU=u;
  var s=document.getElementById('r-pu-srch'),d=document.getElementById('r-pu-dd'),
      w=document.getElementById('r-ward'),e=document.getElementById('r-pu-sel');
  if(s) s.value=u.code+' \u2014 '+u.name;
  if(d) d.classList.remove('open');
  if(w) w.value=u.ward;
  if(e){e.style.display='block';e.innerHTML='<div class="pu-sel"><div class="pu-sel-code">'+u.code+'</div><div class="pu-sel-name">'+u.name+'</div><div class="pu-sel-meta">'+u.ward+' &middot; '+u.lga+' &middot; '+u.state+'</div></div>';}
  updateTag();
}

function updateTag() {
  var pe=document.getElementById('r-party'),se=document.getElementById('r-state'),
      te=document.getElementById('r-town'),fne=document.getElementById('r-fn'),lne=document.getElementById('r-ln');
  var party=pe?pe.value:'', state=se?se.value:'', town=te?te.value.trim():'';
  var fn=fne?fne.value.trim():'', ln=lne?lne.value.trim():'';
  var name=(fn+' '+ln).trim()||'Agent Name';
  var init=(fn?fn[0]:'')+(ln?ln[0]:''); init=init.toUpperCase()||'A';
  var col=(typeof PARTY_COLORS!=='undefined'&&PARTY_COLORS[party])?PARTY_COLORS[party]:'#00B04F';
  var em={'tag-av':{bg:col,txt:init},'tag-nm':{txt:name},'tag-id':{txt:'ID: Pending'},
          'tag-state':{txt:'\uD83D\uDDFA\uFE0F '+(state||'State')},'tag-lga':{txt:'\uD83D\uDCCD '+(regPU?regPU.lga:'LGA')},
          'tag-unit':{txt:'Unit: '+(regPU?regPU.code:'\u2014')}};
  var k,el; for(k in em){el=document.getElementById(k);if(!el)continue;if(em[k].bg)el.style.background=em[k].bg;if(em[k].txt!==undefined)el.textContent=em[k].txt;}
}

function buildRegSummary() {
  var rows=[
    ['Name',(document.getElementById('r-fn')?document.getElementById('r-fn').value:'')+' '+(document.getElementById('r-ln')?document.getElementById('r-ln').value:'')],
    ['Phone',document.getElementById('r-ph')?document.getElementById('r-ph').value:''],
    ['Party',document.getElementById('r-party')?document.getElementById('r-party').value:''],
    ['State',document.getElementById('r-state')?document.getElementById('r-state').value:''],
    ['Town',document.getElementById('r-town')?document.getElementById('r-town').value:''],
    ['Unit',regPU?regPU.code:'\u2014'],['Ward',regPU?regPU.ward:'\u2014']
  ];
  var html='',i;
  for(i=0;i<rows.length;i++) html+='<div style="display:flex;justify-content:space-between"><span style="color:var(--tm)">'+rows[i][0]+'</span><strong>'+(rows[i][1]||'\u2014').trim()+'</strong></div>';
  var s=document.getElementById('reg-summary'); if(s) s.innerHTML=html;
  updateTag();
}

function checkPwd() {
  var v=document.getElementById('r-pin'),f=document.getElementById('pwd-fill'),t=document.getElementById('pwd-txt');
  if(!v) return;
  var val=v.value,s=0;
  if(val.length>=6)s++;if(val.length>=10)s++;
  if(/[A-Za-z]/.test(val)&&/[0-9]/.test(val))s++;if(/[^A-Za-z0-9]/.test(val))s++;
  var lvls=[{w:0,c:'var(--red)',l:'Too weak'},{w:25,c:'var(--red)',l:'Weak'},{w:50,c:'var(--ora)',l:'Fair'},{w:75,c:'var(--gold)',l:'Good'},{w:100,c:'var(--g)',l:'Strong \u2713'}];
  var lvl=lvls[s];
  if(f){f.style.width=lvl.w+'%';f.style.background=lvl.c;}if(t){t.textContent=lvl.l;t.style.color=lvl.c;}
}

function handlePhoto(inpId,prevId,boxId) {
  var inp=document.getElementById(inpId);
  if(!inp||!inp.files||!inp.files[0]) return;
  var reader=new FileReader();
  reader.onload=function(e){
    var img=document.getElementById(prevId),box=document.getElementById(boxId);
    if(img){img.src=e.target.result;img.classList.add('show');}
    if(box) box.classList.add('done');
    toast('Document uploaded','ok');
  };
  reader.readAsDataURL(inp.files[0]);
}

function completeReg() {
  var pe=document.getElementById('r-party'),se=document.getElementById('r-state'),
      te=document.getElementById('r-town'),pi=document.getElementById('r-pin'),
      fne=document.getElementById('r-fn'),lne=document.getElementById('r-ln'),
      tid=document.getElementById('tag-id'),btn=document.getElementById('reg-submit-btn');
  var party=pe?pe.value:'', state=se?se.value:'', town=te?te.value.trim():'', pin=pi?pi.value:'';
  if(!regPU){toast('Select a polling unit','err');return;}
  if(!party||!state){toast('Complete party and state selection','err');return;}
  if(pin.length<6){toast('PIN must be at least 6 characters','err');return;}
  if(btn){btn.disabled=true;btn.textContent='Registering...';}
  regAgentCount++;
  var lgaCode=(regPU.code.split('/')[1]||'XX');
  var stCode=(regPU.code.split('/')[0]||'NG');
  var pad=String(regAgentCount); while(pad.length<4) pad='0'+pad;
  var agentId='NG-'+party+'-'+stCode+'-'+lgaCode+'-'+pad;
  AGENTS[agentId]={
    pin:pin,party:party,state:state,lga:regPU.lga,town:town,
    name:((fne?fne.value:'')+' '+(lne?lne.value:'')).trim(),
    unit:regPU.code,ward:regPU.ward
  };
  if(tid) tid.textContent='ID: '+agentId;
  SEC.log('ok','Agent registered: '+agentId,party+' '+state+' '+regPU.code);
  toast('Registration complete! Agent ID: '+agentId,'ok');
  setTimeout(function(){ window.location.href='agent.html'; },2500);
}
