// ============================================================
//  js/data/parties.js
//  Registered political parties — Ekiti State Governorship
// ============================================================

const PARTIES = [
  { id: 'APC',  name: 'All Progressives Congress',   abbr: 'APC',  color: '#006B3F' },
  { id: 'PDP',  name: 'Peoples Democratic Party',    abbr: 'PDP',  color: '#E30A17' },
  { id: 'LP',   name: 'Labour Party',                abbr: 'LP',   color: '#1A6FA8' },
  { id: 'NNPP', name: 'New Nigeria Peoples Party',   abbr: 'NNPP', color: '#E8A020' },
  { id: 'ADC',  name: 'African Democratic Congress', abbr: 'ADC',  color: '#4A148C' },
  { id: 'YPP',  name: 'Young Progressives Party',   abbr: 'YPP',  color: '#0D7377' },
  { id: 'SDP',  name: 'Social Democratic Party',     abbr: 'SDP',  color: '#BF360C' },
  { id: 'APM',  name: 'Action Peoples Movement',     abbr: 'APM',  color: '#558B2F' },
];

const PARTY_COLORS = {
  APC: '#006B3F', PDP: '#E30A17', LP: '#1A6FA8', NNPP: '#E8A020',
  ADC: '#4A148C', YPP: '#0D7377', SDP: '#BF360C', APM: '#558B2F',
};

if (typeof module !== 'undefined') module.exports = { PARTIES, PARTY_COLORS };