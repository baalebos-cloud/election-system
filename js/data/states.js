// ============================================================
//  js/data/states.js  —  Pure ES5
//  Nigeria: 36 States + FCT, 774 LGAs, ~176,846 Polling Units
//  Source: INEC Nigeria official records
// ============================================================

var NIGERIA_STATES = [
  {code:'AB',name:'Abia',         capital:'Umuahia',  lgas:17, pus:3316, lat:5.4527,  lng:7.5248,  zone:'South East'},
  {code:'AD',name:'Adamawa',      capital:'Yola',     lgas:21, pus:3452, lat:9.3265,  lng:12.3984, zone:'North East'},
  {code:'AK',name:'Akwa Ibom',    capital:'Uyo',      lgas:31, pus:4747, lat:5.0077,  lng:7.8536,  zone:'South South'},
  {code:'AN',name:'Anambra',      capital:'Awka',     lgas:21, pus:5720, lat:6.2104,  lng:7.0678,  zone:'South East'},
  {code:'BA',name:'Bauchi',       capital:'Bauchi',   lgas:20, pus:5366, lat:10.3158, lng:9.8442,  zone:'North East'},
  {code:'BY',name:'Bayelsa',      capital:'Yenagoa',  lgas:8,  pus:1620, lat:4.9267,  lng:6.2676,  zone:'South South'},
  {code:'BE',name:'Benue',        capital:'Makurdi',  lgas:23, pus:4822, lat:7.7309,  lng:8.5227,  zone:'North Central'},
  {code:'BO',name:'Borno',        capital:'Maiduguri',lgas:27, pus:4028, lat:11.8333, lng:13.1500, zone:'North East'},
  {code:'CR',name:'Cross River',  capital:'Calabar',  lgas:18, pus:3654, lat:5.8702,  lng:8.5988,  zone:'South South'},
  {code:'DL',name:'Delta',        capital:'Asaba',    lgas:25, pus:4234, lat:5.8904,  lng:5.6800,  zone:'South South'},
  {code:'EB',name:'Ebonyi',       capital:'Abakaliki',lgas:13, pus:2796, lat:6.3249,  lng:8.1137,  zone:'South East'},
  {code:'ED',name:'Edo',          capital:'Benin City',lgas:18,pus:3960, lat:6.5244,  lng:5.8987,  zone:'South South'},
  {code:'EK',name:'Ekiti',        capital:'Ado-Ekiti',lgas:16, pus:2195, lat:7.7190,  lng:5.3110,  zone:'South West'},
  {code:'EN',name:'Enugu',        capital:'Enugu',    lgas:17, pus:4246, lat:6.4584,  lng:7.5464,  zone:'South East'},
  {code:'FC',name:'FCT Abuja',    capital:'Abuja',    lgas:6,  pus:2523, lat:9.0765,  lng:7.3986,  zone:'North Central'},
  {code:'GO',name:'Gombe',        capital:'Gombe',    lgas:11, pus:2379, lat:10.2897, lng:11.1673, zone:'North East'},
  {code:'IM',name:'Imo',          capital:'Owerri',   lgas:27, pus:3523, lat:5.4893,  lng:7.0263,  zone:'South East'},
  {code:'JI',name:'Jigawa',       capital:'Dutse',    lgas:27, pus:5326, lat:12.2280, lng:9.5616,  zone:'North West'},
  {code:'KD',name:'Kaduna',       capital:'Kaduna',   lgas:23, pus:9360, lat:10.5264, lng:7.4382,  zone:'North West'},
  {code:'KN',name:'Kano',         capital:'Kano',     lgas:44, pus:14273,lat:12.0022, lng:8.5919,  zone:'North West'},
  {code:'KT',name:'Katsina',      capital:'Katsina',  lgas:34, pus:8891, lat:12.9889, lng:7.6006,  zone:'North West'},
  {code:'KB',name:'Kebbi',        capital:'Birnin Kebbi',lgas:21,pus:4729,lat:12.4539,lng:4.1975, zone:'North West'},
  {code:'KO',name:'Kogi',         capital:'Lokoja',   lgas:21, pus:3836, lat:7.7337,  lng:6.6906,  zone:'North Central'},
  {code:'KW',name:'Kwara',        capital:'Ilorin',   lgas:16, pus:2808, lat:8.5374,  lng:4.5426,  zone:'North Central'},
  {code:'LA',name:'Lagos',        capital:'Ikeja',    lgas:20, pus:8944, lat:6.5244,  lng:3.3792,  zone:'South West'},
  {code:'NA',name:'Nasarawa',     capital:'Lafia',    lgas:13, pus:2820, lat:8.4966,  lng:8.5186,  zone:'North Central'},
  {code:'NI',name:'Niger',        capital:'Minna',    lgas:25, pus:4937, lat:9.6139,  lng:6.5569,  zone:'North Central'},
  {code:'OG',name:'Ogun',         capital:'Abeokuta', lgas:20, pus:3435, lat:7.1557,  lng:3.3451,  zone:'South West'},
  {code:'ON',name:'Ondo',         capital:'Akure',    lgas:18, pus:3824, lat:7.2526,  lng:5.1986,  zone:'South West'},
  {code:'OS',name:'Osun',         capital:'Osogbo',   lgas:30, pus:3763, lat:7.5629,  lng:4.5200,  zone:'South West'},
  {code:'OY',name:'Oyo',          capital:'Ibadan',   lgas:33, pus:6239, lat:7.3775,  lng:3.9470,  zone:'South West'},
  {code:'PL',name:'Plateau',      capital:'Jos',      lgas:17, pus:4744, lat:9.8965,  lng:8.8583,  zone:'North Central'},
  {code:'RI',name:'Rivers',       capital:'Port Harcourt',lgas:23,pus:4438,lat:4.8156,lng:7.0498, zone:'South South'},
  {code:'SO',name:'Sokoto',       capital:'Sokoto',   lgas:23, pus:4636, lat:13.0059, lng:5.2476,  zone:'North West'},
  {code:'TA',name:'Taraba',       capital:'Jalingo',  lgas:16, pus:3241, lat:8.8937,  lng:11.3598, zone:'North East'},
  {code:'YO',name:'Yobe',         capital:'Damaturu', lgas:17, pus:2770, lat:11.7471, lng:11.9601, zone:'North East'},
  {code:'ZA',name:'Zamfara',      capital:'Gusau',    lgas:14, pus:3484, lat:12.1704, lng:6.6571,  zone:'North West'}
];

var GEOPOLITICAL_ZONES = {
  'North West':    {states:['Kaduna','Kano','Katsina','Kebbi','Sokoto','Jigawa','Zamfara'],  color:'#1A6FA8'},
  'North East':    {states:['Adamawa','Bauchi','Borno','Gombe','Taraba','Yobe'],              color:'#E67E22'},
  'North Central': {states:['Benue','FCT Abuja','Kogi','Kwara','Nasarawa','Niger','Plateau'],color:'#8E44AD'},
  'South West':    {states:['Ekiti','Lagos','Ogun','Ondo','Osun','Oyo'],                     color:'#00B04F'},
  'South East':    {states:['Abia','Anambra','Ebonyi','Enugu','Imo'],                        color:'#E30A17'},
  'South South':   {states:['Akwa Ibom','Bayelsa','Cross River','Delta','Edo','Rivers'],     color:'#F39C12'}
};

var TOTAL_NATIONAL_PUS   = 176846;
var TOTAL_NATIONAL_LGAS  = 774;
var TOTAL_NATIONAL_STATES = 37; // 36 + FCT
