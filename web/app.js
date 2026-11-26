const C = window.RasdCore;
const $ = s => document.querySelector(s);
const T = {
 ar: {dir:'rtl',skip:'تخطّى للمحتوى',codeLabel:'كود البلاغ',report:'بلّغ',track:'تابع بلاغك',h1:'بلّغ من غير ما حد يعرفك. والناس تأكّد اللي حصل فعلاً.',
  sub:'رصد منصة بلاغات مجهولة للمشاكل في الشارع والحي. مفيش حساب ولا رقم تليفون ولا موقعك الدقيق. الثقة بتيجي من تأكيد ناس تانية مش من هويتك.',
  p1:'من غير حساب',p2:'الموقع مموّه ~500م',p3:'الصور بتتنضف من بياناتها',
  demo:'البيانات اللي على الخريطة تجريبية لعرض الفكرة. بلاغاتك هنا بتتحفظ على جهازك بس.',
  newReport:'بلاغ جديد',cat:'نوع المشكلة',where:'المكان',whereHint:'اضغط على الخريطة. هنموّه المكان لمربع حوالي 500 متر قبل الحفظ.',what:'اللي حصل (من غير أسماء أشخاص)',photo:'صورة (اختياري)',photoHint:'بنمسح بيانات الصورة (الموقع والجهاز) ونصغّرها قبل الحفظ.',
  cancel:'إلغاء',submit:'ابعت',sent:'البلاغ اتسجّل',codeInfo:'ده كودك السري. هتتابع بيه حالة البلاغ من غير أي حساب.',codeWarn:'احفظه دلوقتي. مش بنقدر نرجّعه لأننا مش بنعرف مين انت.',ok:'تمام',
  close:'إغلاق',check:'اعرف الحالة',notfound:'الكود مش موجود.',
  howT:'إزاي رصد بيحمي المُبلّغ وبيثبت الحقيقة',
  how:[['١. من غير هوية','مفيش حساب أو إيميل أو IP محفوظ. كل جهاز بياخد رمز عشوائي بيمنع التكرار بس.'],['٢. موقع مموّه','الإحداثيات بتتقرّب لمربع ~500م، والوقت للساعة. تتعرف على المنطقة، مش على البيت.'],['٣. تنضيف تلقائي','أرقام التليفونات والإيميلات والرقم القومي بتتمسح من النص، وبيانات الصور بتتشال.'],['٤. تأكيد المجتمع','البلاغ بيبقى "مؤكّد" لما ناس مستقلة تأكّده أو يتأكد بصورة. وبيتعلّم "متنازع عليه" لو الناس كذّبته.']],
  foot:'رصد · مشروع مفتوح المصدر',
  cats:{road:'طرق وحفر',safety:'أمان الشارع',utilities:'مرافق (كهربا/مياه)',environment:'بيئة ونضافة',misconduct:'سوء سلوك أو إهمال',other:'أخرى'},
  all:'الكل',ver:'مؤكّد',pen:'قيد التأكيد',dis:'متنازع عليه',confirm:'شفته كمان',dispute:'مش صح',conf:'تأكيد',reports:'بلاغ',verified:'مؤكّد',pending:'قيد التأكيد',
  ago:'منذ',h:'ساعة',d:'يوم',voted:'سجّلنا رأيك',blockedText:'اتشال من النص بيانات شخصية'},
 en: {dir:'ltr',skip:'Skip to content',codeLabel:'Report code',report:'Report',track:'Track a report',h1:'Report without being known. The community confirms what is real.',
  sub:'Rasd is an anonymous reporting map for street and neighborhood problems. No account, no phone number, no exact location. Trust comes from other people confirming, not from who you are.',
  p1:'No account',p2:'Location blurred ~500 m',p3:'Photos stripped of metadata',
  demo:'Reports on the map are demo data. Your reports here are saved on your device only.',
  newReport:'New report',cat:'Type of problem',where:'Where',whereHint:'Tap the map. The point is snapped to a ~500 m cell before saving.',what:'What happened (no names of people)',photo:'Photo (optional)',photoHint:'Metadata (location, device) is removed and the image is shrunk before saving.',
  cancel:'Cancel',submit:'Submit',sent:'Report recorded',codeInfo:'This is your secret code. Use it to follow the report with no account.',codeWarn:'Save it now. We cannot recover it because we do not know who you are.',ok:'Done',
  close:'Close',check:'Check status',notfound:'Code not found.',
  howT:'How Rasd protects reporters and proves what is real',
  how:[['1. No identity','No account, email or IP is stored. Each device gets a random token that only prevents double voting.'],['2. Blurred location','Coordinates snap to a ~500 m cell and time to the hour. You can tell the area, not the house.'],['3. Automatic scrub','Phone numbers, emails and national IDs are removed from text. Photo metadata is stripped.'],['4. Community verification','A report becomes "verified" when independent people confirm it or it has a photo plus confirmations. It is marked "disputed" if people reject it.']],
  foot:'Rasd · open source',
  cats:{road:'Roads & potholes',safety:'Street safety',utilities:'Utilities (power/water)',environment:'Environment & waste',misconduct:'Misconduct or neglect',other:'Other'},
  all:'All',ver:'Verified',pen:'Pending',dis:'Disputed',confirm:'I saw it too',dispute:'Not accurate',conf:'confirmations',reports:'reports',verified:'verified',pending:'pending',
  ago:'',h:'h ago',d:'d ago',voted:'Vote recorded',blockedText:'Personal data was removed from the text'}
};
let lang = localStorage.getItem('rasd.lang') || 'ar';
const t = k => T[lang][k];
const COL = {road:'#FFB020',safety:'#FF5C6C',utilities:'#60A5FA',environment:'#34D399',misconduct:'#C084FC',other:'#93A1BD'};
const KEY = 'rasd.v1';
const tokenKey = 'rasd.token';
const token = localStorage.getItem(tokenKey) || (() => { const v = crypto.randomUUID(); localStorage.setItem(tokenKey, v); return v; })();

function seed() {
  const now = Date.now(), H = 3600000, B = {lat:31.2001, lng:29.9187};
  const mk = (id,cat,dx,dy,text,h,conf,dis,photo) => ({id,cat,...C.blur(B.lat+dy,B.lng+dx),text,ts:C.hourBucket(now-h*H),confirms:Array.from({length:conf},(_,i)=>'s'+id+i),disputes:Array.from({length:dis},(_,i)=>'d'+id+i),photo:photo?1:0,demo:1});
  return [
   mk('d1','road',-0.02,0.01,'حفرة عميقة في نص الطريق بتسبب حوادث للموتوسيكلات بالليل. / Deep pothole mid-lane, dangerous for motorbikes at night.',30,4,0,1),
   mk('d2','utilities',0.03,-0.02,'كشاف الشارع مطفي من أسبوع على الكورنيش الداخلي. / Street lights out for a week on the inner road.',70,3,0,0),
   mk('d3','environment',0.01,0.03,'تراكم زبالة ومصرف مفتوح قدام المدرسة. / Garbage pile and open drain in front of the school.',12,2,0,1),
   mk('d4','safety',-0.04,0.012,'مطب غير مرئي على الطريق السريع بدون علامة. / Unmarked speed bump on the highway, no sign.',5,1,0,0),
   mk('d5','misconduct',0.05,0.02,'مقاول سايب حفر مفتوحة بعد انتهاء الشغل بأسابيع. / Contractor left open trenches for weeks after work ended.',200,1,3,0),
   mk('d6','utilities',-0.01,-0.02,'مياه الشرب مقطوعة من يومين في المنطقة. / No drinking water for two days in the area.',40,5,0,0)
  ];
}
let db = JSON.parse(localStorage.getItem(KEY) || 'null') || {incidents: seed(), mine: {}};
const save = () => localStorage.setItem(KEY, JSON.stringify(db));
let filter = 'all', map, layer, pick, pickMarker;

function ago(ts){const h=Math.max(1,Math.round((Date.now()-ts)/3600000));return h<48?(lang==='ar'?`${t('ago')} ${h} ${t('h')}`:`${h}${t('h')}`):(lang==='ar'?`${t('ago')} ${Math.round(h/24)} ${t('d')}`:`${Math.round(h/24)}${t('d')}`);}
function loc(s){const p=s.split(' / ');return p.length===2?(lang==='ar'?p[0]:p[1]):s;}
function esc(s){s=loc(s);return s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}

function applyLang(){
  $('#map').setAttribute('aria-label',lang==='ar'?'خريطة البلاغات':'Incident map');
  document.documentElement.lang=lang;document.documentElement.dir=t('dir');
  document.querySelectorAll('[data-i]').forEach(e=>e.textContent=t(e.dataset.i));
  $('#btnLang').textContent=lang==='ar'?'EN':'عربي';
  $('#fCat').innerHTML=C.CATS.map(c=>`<option value="${c}">${t('cats')[c]}</option>`).join('');
  $('#how').innerHTML=t('how').map(([a,b])=>`<div><b>${a}</b><p>${b}</p></div>`).join('');
  render();
}
function render(){
  const all=db.incidents, list=all.filter(i=>filter==='all'||i.cat===filter).sort((a,b)=>b.ts-a.ts);
  $('#filters').innerHTML=['all',...C.CATS].map(c=>`<button class="chip ${c===filter?'on':''}" aria-pressed="${c===filter}" data-c="${c}">${c==='all'?t('all'):t('cats')[c]}</button>`).join('');
  $('#filters').onclick=e=>{const c=e.target.dataset.c;if(c){filter=c;render();}};
  const v=all.filter(i=>C.status(i)==='verified').length;
  $('#stats').innerHTML=`<div><b>${all.length}</b>${t('reports')}</div><div><b>${v}</b>${t('verified')}</div><div><b>${all.length-v}</b>${t('pending')}</div>`;
  $('#list').innerHTML=list.map(i=>{const s=C.status(i),sc=C.score(i),b={verified:['b-ver',t('ver')],pending:['b-pen',t('pen')],disputed:['b-dis',t('dis')]}[s];
   const mine=db.mine[i.id]?.vote;
   return `<article class="inc"><h3 style="color:${COL[i.cat]}">${t('cats')[i.cat]}</h3>${i.img?`<img src="${i.img}" alt="${lang==='ar'?'صورة مرفقة بالبلاغ':'Photo attached to the report'}">`:''}<p>${esc(i.text)}</p>
   <div class="bar"><i style="width:${Math.min(100,Math.max(0,sc.value/C.VERIFY_AT*100))}%"></i></div>
   <div class="meta"><span class="badge ${b[0]}">${b[1]}</span><span>${sc.conf} ${t('conf')} · ${ago(i.ts)}</span></div>
   <div class="acts" style="margin-top:8px"><button data-v="c" data-id="${i.id}" ${mine?'disabled':''}>✓ ${t('confirm')}</button><button data-v="d" data-id="${i.id}" ${mine?'disabled':''}>✗ ${t('dispute')}</button></div></article>`}).join('');
  $('#list').onclick=e=>{const b=e.target.closest('button[data-v]');if(!b)return;vote(b.dataset.id,b.dataset.v);};
  layer.clearLayers();
  list.forEach(i=>{const s=C.status(i);
    L.circle([i.lat,i.lng],{radius:C.GRID*111000*0.7,color:COL[i.cat],weight:s==='verified'?3:1,fillOpacity:s==='verified'?.35:.15,dashArray:s==='pending'?'4':null}).addTo(layer).bindPopup(`<b>${t('cats')[i.cat]}</b><br>${esc(i.text)}`);});
}
function vote(id,kind){
  const i=db.incidents.find(x=>x.id===id);if(!i||db.mine[id]?.vote)return;
  const arr=kind==='c'?i.confirms:i.disputes;arr.push(token+':'+id); // one vote per device token per incident
  db.mine[id]={...(db.mine[id]||{}),vote:kind};save();render();
}
function initMap(){
  const mk=el=>{const m=L.map(el,{zoomControl:true}).setView([31.2001,29.9187],12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{attribution:'© OpenStreetMap contributors',maxZoom:18}).addTo(m);return m;};
  map=mk('map');layer=L.layerGroup().addTo(map);
}
let pickLL=null;
function openReport(){
  $('#dlgReport').showModal();
  if(!pick){pick=L.map('pickMap').setView([31.2001,29.9187],12);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:18}).addTo(pick);
    pick.on('click',e=>{pickLL=e.latlng;const b=C.blur(e.latlng.lat,e.latlng.lng);
      if(pickMarker)pickMarker.remove();
      pickMarker=L.rectangle([[b.lat-C.GRID/2,b.lng-C.GRID/2],[b.lat+C.GRID/2,b.lng+C.GRID/2]],{color:'#2DD4BF'}).addTo(pick);});}
  setTimeout(()=>pick.invalidateSize(),100);
}
function stripPhoto(file){return new Promise(res=>{ // canvas re-encode drops EXIF/GPS entirely
  const img=new Image();img.onload=()=>{const k=Math.min(1,640/Math.max(img.width,img.height)),c=document.createElement('canvas');
   c.width=img.width*k;c.height=img.height*k;c.getContext('2d').drawImage(img,0,0,c.width,c.height);res(c.toDataURL('image/jpeg',.6));URL.revokeObjectURL(img.src);};
  img.onerror=()=>res(null);img.src=URL.createObjectURL(file);});}
$('#fText').addEventListener('input',e=>{$('#warn').textContent=C.scrub(e.target.value).hits?t('blockedText'):'';});
$('#frm').addEventListener('submit',async e=>{
  e.preventDefault();
  if(!pickLL){alert(t('whereHint'));$('#dlgReport').showModal?.();return;}
  const raw=$('#fText').value.trim();if(raw.length<8)return;
  const {text}=C.scrub(raw);const b=C.blur(pickLL.lat,pickLL.lng);
  const f=$('#fPhoto').files[0];const img=f?await stripPhoto(f):null;
  const code=C.randomCode(),id='r'+Date.now().toString(36);
  db.incidents.push({id,cat:$('#fCat').value,...b,text,ts:C.hourBucket(Date.now()),confirms:[],disputes:[],photo:img?1:0,img});
  db.mine[id]={vote:'c'};db.mine[code]=null;
  db.codes=db.codes||{};db.codes[await C.sha256(code)]=id; // only the hash of the code is stored
  save();$('#dlgReport').close();$('#frm').reset();pickLL=null;if(pickMarker)pickMarker.remove();
  $('#code').textContent=code;$('#dlgDone').showModal();render();});
$('#cancel').onclick=()=>$('#dlgReport').close();
$('#doneClose').onclick=()=>$('#dlgDone').close();
$('#btnReport').onclick=openReport;
$('#btnTrack').onclick=()=>{$('#tOut').textContent='';$('#dlgTrack').showModal();};
$('#tClose').onclick=()=>$('#dlgTrack').close();
$('#tGo').onclick=async()=>{const id=(db.codes||{})[await C.sha256($('#tCode').value.trim().toUpperCase())];const i=db.incidents.find(x=>x.id===id);
  $('#tOut').innerHTML=i?`<div class="inc"><h3>${t('cats')[i.cat]}</h3><p>${esc(i.text)}</p><div class="meta"><span class="badge ${{verified:'b-ver',pending:'b-pen',disputed:'b-dis'}[C.status(i)]}">${t({verified:'ver',pending:'pen',disputed:'dis'}[C.status(i)])}</span><span>${C.score(i).conf} ${t('conf')}</span></div></div>`:t('notfound');};
$('#btnLang').onclick=()=>{lang=lang==='ar'?'en':'ar';localStorage.setItem('rasd.lang',lang);applyLang();};
initMap();applyLang();
