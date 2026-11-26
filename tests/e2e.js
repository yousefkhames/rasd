const pp=require('puppeteer-core');const http=require('http'),fs=require('fs'),path=require('path');
const ROOT=path.join(__dirname,"..","web");
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.webmanifest':'application/json'};
const srv=http.createServer((q,r)=>{let p=path.join(ROOT,q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';fs.readFile(p,(e,d)=>{if(e){r.writeHead(404);r.end();}else{r.writeHead(200,{'content-type':mime[path.extname(p)]||'text/plain'});r.end(d);}});}).listen(8123);
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let fails=[];const ok=(c,m)=>{if(!c){fails.push(m);console.log('  FAIL',m);}};
(async()=>{
 const b=await pp.launch({executablePath:'/usr/bin/google-chrome',args:['--no-sandbox'],headless:'new'});
 for(const [name,vp,mobile] of [['desktop',{width:1280,height:900},false],['mobile',{width:390,height:844,isMobile:true,hasTouch:true},true]]){
  for(const lang of ['ar','en']){
   console.log('==',name,lang);
   const ctx=await b.createBrowserContext();const pg=await ctx.newPage();await pg.setViewport(vp);
   const errs=[];pg.on('pageerror',e=>errs.push(e.message));pg.on('console',m=>{if(m.type()==='error'&&!/tile|ERR_|Failed to load resource/.test(m.text()))errs.push(m.text());});
   pg.on('dialog',d=>d.accept());
   await pg.evaluateOnNewDocument(l=>{if(!localStorage.getItem('rasd.lang'))localStorage.setItem('rasd.lang',l);},lang);
   await pg.goto('http://localhost:8123/',{waitUntil:'load'});await sleep(800);
   const n=()=>pg.$$eval('#list .inc',e=>e.length);
   ok(await n()===6,'6 seeded incidents');
   ok(await pg.evaluate(()=>document.documentElement.lang)===lang,'html lang '+lang);
   if(mobile){await pg.click('#tabList');await sleep(200);ok(await pg.$eval('#map',e=>getComputedStyle(e).display)==='none','map hidden in list view');}
   // filter
   await pg.click('#filters .chip[data-c=road]');await sleep(100);ok(await n()===1,'filter road -> 1');
   await pg.click('#filters .chip[data-c=all]');ok(await n()===6,'filter all -> 6');
   await pg.select('#range','24');await sleep(100);ok(await n()<6,'24h range narrows');await pg.select('#range','0');
   // search
   await pg.type('#q',lang==='ar'?'حفرة':'pothole');await sleep(150);ok(await n()===1,'search finds 1');
   await pg.$eval('#q',e=>{e.value='';e.dispatchEvent(new Event('input'))});ok(await n()===6,'search cleared');
   await pg.type('#q','zzzz');await sleep(100);ok((await pg.$$eval('#list .empty',e=>e.length))===1,'empty state');await pg.$eval('#q',e=>{e.value='';e.dispatchEvent(new Event('input'))});
   if(!mobile){await pg.focus('#list .inc');await pg.keyboard.press('Enter');await sleep(300);ok(await pg.$$eval('.leaflet-popup',e=>e.length)>0,'Enter on card opens map popup');await pg.keyboard.press('Escape');}
   // vote
   const before=await pg.$eval('#list .inc .meta span:last-child',e=>e.textContent);
   await pg.$eval('#list .inc button[data-v=c]',e=>e.scrollIntoView({block:'center'}));await pg.click('#list .inc button[data-v=c]');await sleep(100);
   const after=await pg.$eval('#list .inc .meta span:last-child',e=>e.textContent);
   ok(before!==after,'confirm changes count');
   ok(await pg.$eval('#list .inc button[data-v=c]',e=>e.disabled),'confirm disabled after vote');
   // report flow
   if(mobile){await pg.click('#fab');}else await pg.click('#btnReport');
   await sleep(400);
   await pg.type('#fText','short');await pg.click('#frm button[type=submit]');await sleep(100);ok((await pg.$eval('#fErr',e=>e.textContent)).length>0,'inline error when no location/too short');await pg.$eval('#fText',e=>e.value='');
   await pg.type('#fText','Broken water pipe flooding the street near the market, call 01012345678');
   ok((await pg.$eval('#warn',e=>e.textContent)).length>0,'phone warning shown');
   await (await pg.$('#fPhoto')).uploadFile(path.join(__dirname,'pixel.png'));await sleep(400);ok(!(await pg.$eval('#prev',e=>e.hidden)),'photo preview shown');
   const box=await (await pg.$('#pickMap')).boundingBox();await pg.mouse.click(box.x+box.width/2,box.y+box.height/2);await sleep(200);
   await pg.click('#frm button[type=submit]');await sleep(600);
   const code=await pg.$eval('#code',e=>e.textContent);ok(/^RASD-[A-Z2-9]{4}-[A-Z2-9]{4}$/.test(code),'code shown '+code);
   await pg.click('#doneClose');await sleep(100);
   if(mobile)await pg.click('#tabList');
   ok(await n()===7,'7 incidents after report');
   const stored=await pg.evaluate(()=>localStorage.getItem('rasd.v1'));ok(!stored.includes('01012345678'),'phone not stored');ok(stored.includes('data:image/jpeg;base64'),'photo stored as re-encoded jpeg');ok(!stored.includes(code),'plain code not stored');
   // track
   await pg.evaluate(()=>document.querySelector('#dlgTrack').showModal());await pg.type('#tCode',code);await pg.click('#tGo');await sleep(300);
   ok((await pg.$eval('#tOut',e=>e.innerHTML)).includes('inc'),'track finds report');await pg.click('#tClose');
   // second report blocked by rate limit
   await pg.evaluate(()=>document.querySelector('#dlgReport').showModal());await pg.type('#fText','Second report immediately after the first');
   await pg.click('#frm button[type=submit]');await sleep(200);ok(await n()===7,'rate limit blocks second');ok((await pg.$eval('#fErr',e=>e.textContent)).length>0,'rate limit message shown');
   await pg.evaluate(()=>document.querySelector('#dlgReport').close());
   await pg.goto('http://localhost:8123/#d1',{waitUntil:'load'});await sleep(1200);ok(await pg.$$eval('.leaflet-popup',e=>e.length)>0,'deep link #d1 opens its popup');
   // lang toggle
   await pg.click('#btnLang').catch(()=>pg.evaluate(()=>document.querySelector('#btnLang').click()));await sleep(200);
   ok(await pg.evaluate(()=>document.documentElement.lang)!==lang,'lang toggled');
   ok(errs.length===0,'no console errors: '+errs.join(' | '));
   if(process.env.SHOT)await pg.screenshot({path:`/tmp/qa-${name}-${lang}.png`});
   await ctx.close();
  }}
 {const c=await b.createBrowserContext(),pg=await c.newPage();await pg.evaluateOnNewDocument(()=>Object.defineProperty(navigator,'language',{get:()=>'fr-FR'}));await pg.goto('http://localhost:8123/');await sleep(500);ok(await pg.evaluate(()=>document.documentElement.lang)==='en','non-Arabic browser defaults to English');await c.close();}
 await b.close();srv.close();
 console.log(fails.length?'FAILED '+fails.length:'ALL QA PASSED');process.exit(fails.length?1:0);
})();
