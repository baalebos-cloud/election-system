// ============================================================
//  js/data/parties.js  —  Pure ES5
//  18 INEC-registered parties for 2023 general elections
// ============================================================

var PARTIES = [
  {id:'APC', name:'All Progressives Congress',          abbr:'APC',  color:'#006B3F'},
  {id:'PDP', name:'Peoples Democratic Party',           abbr:'PDP',  color:'#E30A17'},
  {id:'LP',  name:'Labour Party',                       abbr:'LP',   color:'#1A6FA8'},
  {id:'NNPP',name:'New Nigeria Peoples Party',          abbr:'NNPP', color:'#E8A020'},
  {id:'ADC', name:'African Democratic Congress',        abbr:'ADC',  color:'#4A148C'},
  {id:'YPP', name:'Young Progressives Party',           abbr:'YPP',  color:'#0D7377'},
  {id:'SDP', name:'Social Democratic Party',            abbr:'SDP',  color:'#BF360C'},
  {id:'APM', name:'Action Peoples Movement',            abbr:'APM',  color:'#558B2F'},
  {id:'AA',  name:'Action Alliance',                    abbr:'AA',   color:'#795548'},
  {id:'ADP', name:'Action Democratic Party',            abbr:'ADP',  color:'#37474F'},
  {id:'BP',  name:'Boot Party',                         abbr:'BP',   color:'#880E4F'},
  {id:'NRM', name:'National Rescue Movement',           abbr:'NRM',  color:'#004D40'},
  {id:'PRP', name:'Peoples Redemption Party',           abbr:'PRP',  color:'#BF360C'},
  {id:'APP', name:'Allied Peoples Movement',            abbr:'APP',  color:'#1565C0'},
  {id:'ZLP', name:'Zenith Labour Party',                abbr:'ZLP',  color:'#827717'},
  {id:'APG', name:'All Progressives Grand Alliance',    abbr:'APGA', color:'#1B5E20'},
  {id:'PPC', name:'Peoples Party of Citizens',          abbr:'PPC',  color:'#4A148C'},
  {id:'AAC', name:'African Action Congress',            abbr:'AAC',  color:'#E65100'}
];

var PARTY_COLORS = {};
var i;
for (i = 0; i < PARTIES.length; i++) {
  PARTY_COLORS[PARTIES[i].id] = PARTIES[i].color;
}

// Major parties for quick display (top 6)
var MAJOR_PARTIES = ['APC','PDP','LP','NNPP','ADC','YPP'];
