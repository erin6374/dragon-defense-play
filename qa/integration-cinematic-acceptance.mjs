// Actual integrated comic playback. Stage production chapter settlement; do not synthesize child completion.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-cinematic-output';await mkdir(out,{recursive:true});
const report={commit:process.env.GITHUB_SHA||null,scope:'Actual embedded comic playback and user controls with staged production chapter settlement; not an unassisted campaign',checks:[],errors:[],comicResponses:[]};
let browser,page;
const snap=()=>page.evaluate(()=>window.__DD_QA.snap());
const comic=()=>page.frameLocator('#cinematic-frame');
const evidence=()=>page.evaluate(()=>window.__cinemaEvidence);
const waitMessage=(type,since,timeout=120000)=>page.waitForFunction(({type,since})=>window.__cinemaEvidence.some(e=>e.type===type&&e.trustedFrame&&e.at>=since),{type,since},{timeout,polling:250});
const shot=name=>page.screenshot({path:out+'/'+name+'.png'});
const stage=async(at,file)=>{
 const since=await page.evaluate(()=>performance.now());
 await page.evaluate(at=>{const q=window.__DD_QA;for(const r of [q.start(at),q.beginSettlement(at),q.advanceSettlement(22)])if(!r.ok)throw Error(r.error);},at);
 await page.locator('#cinematic-player').waitFor({state:'visible',timeout:90000});
 await waitMessage('dragon-cinematic-ready',since,60000);
 await page.waitForFunction(file=>{const f=document.getElementById('cinematic-frame');return f.contentDocument?.readyState==='complete'&&f.contentWindow.location.pathname.endsWith('/campaign/'+file)&&!!f.contentDocument.body?.children.length;},file,{timeout:30000});
 const s=await snap();assert.equal(s.wave,at);assert.equal(s.paused,true);assert.equal(s.chapterTransition.postCutsceneWave,at+1);
 const detail=await page.evaluate(()=>{const f=document.getElementById('cinematic-frame'),d=f.contentDocument;return {url:f.contentWindow.location.href,title:d.title,bodyText:d.body.innerText.slice(0,1000),images:[...d.images].map(i=>({loaded:i.complete&&i.naturalWidth>0,width:i.naturalWidth,height:i.naturalHeight})),heading:document.getElementById('cinematic-chapter').textContent};});
 return {since,detail};
};
const departure=async(next)=>{
 await page.locator('#cinematic-player').waitFor({state:'hidden',timeout:90000});
 const s=await snap();assert.equal(s.wave,next);assert.equal(s.paused,false);assert.equal(s.chapterTransition.postCutsceneWave,null);
 await page.evaluate(()=>{const r=window.__DD_QA.advanceSettlement(6);if(!r.ok)throw Error(r.error);});
 const v=await snap();assert.equal(v.wave,next);assert.equal(v.chapterTransition.active,false);assert.ok(v.campaign.remaining>0);
 return {wave:v.wave,remaining:v.campaign.remaining,phase:v.chapterTransition.phase};
};
async function check(name,fn){try{const result=await fn();report.checks.push({name,pass:true,result});console.log('PASS '+name);}catch(e){report.checks.push({name,pass:false,error:String(e)});console.error('FAIL '+name,e);await shot('failed-'+report.checks.length).catch(()=>{});}}
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'});
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('response',r=>{if(r.url().includes('/campaign/'))report.comicResponses.push({url:r.url(),status:r.status()});});
 await page.addInitScript(()=>{if(window===window.top){window.__cinemaEvidence=[];window.addEventListener('message',e=>{if(typeof e.data?.type==='string'&&e.data.type.startsWith('dragon-cinematic-'))window.__cinemaEvidence.push({type:e.data.type,at:performance.now(),trustedFrame:e.origin===location.origin&&e.source===document.getElementById('cinematic-frame')?.contentWindow});},true);}});
 await page.goto(new URL('?qa=1',process.argv[2]||'http://127.0.0.1:8765/').href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
 await check('Chapter 2 actual load, pause, unrelated messages and outer Skip',async()=>{
  const {detail}=await stage(5,'chapter2.html');
  assert.ok(detail.images.length&&detail.images.every(i=>i.loaded));
  await shot('01-chapter2-opening');
  await page.evaluate(()=>window.postMessage({type:'dragon-cinematic-complete'},location.origin));
  await page.waitForTimeout(500);
  const s=await snap();assert.equal(s.wave,5);assert.equal(s.paused,true);assert.equal(await page.locator('#cinematic-player').isVisible(),true);
  await page.locator('#cinematic-skip').click({timeout:20000});
  const result=await departure(6);await shot('02-skip-next-wave');return {detail,result};
 });
 await check('Chapter 2 real playback, pause/resume and natural completion',async()=>{
  const {since,detail}=await stage(5,'chapter2.html');
  const f=comic();
  await f.locator('#toggle').click();
  assert.equal(await f.locator('#toggle').innerText(),'Play');
  const progress=await f.locator('#bar').getAttribute('style');
  const count=await f.locator('#count').innerText();
  await page.waitForTimeout(2500);
  assert.equal(await f.locator('#count').innerText(),count);
  assert.equal(await f.locator('#bar').getAttribute('style'),progress);
  await f.locator('#toggle').click();assert.equal(await f.locator('#toggle').innerText(),'Pause');
  await page.waitForTimeout(5000);await shot('03-comic-playback');
  await waitMessage('dragon-cinematic-complete',since,120000);
  const result=await departure(6);
  await page.evaluate(()=>window.postMessage({type:'dragon-cinematic-complete'},location.origin));
  const state=await snap();assert.equal(state.wave,6);assert.equal(state.chapterTransition.postCutsceneWave,null);assert.equal(state.paused,false);
  await shot('04-natural-next-wave');return {detail,result,messages:(await evidence()).filter(e=>e.at>=since)};
 });
 await check('Chapter 1 embedded final scene completes naturally',async()=>{
  const {since,detail}=await stage(2,'chapter1.html');const f=comic();
  await f.locator('#play').click();
  for(let i=0;i<5;i++)await f.locator('#next').click();
  assert.equal(await f.locator('#counter').innerText(),'6 / 6');
  await shot('05-chapter1-last-scene');
  await f.locator('#play').click();
  await waitMessage('dragon-cinematic-complete',since,90000);
  return {detail,result:await departure(3)};
 });
 for(const [at,choice] of [[10,'call'],[14,'ignore']]){
  await check('Combined comic wave '+at+' choice '+choice+' and ending completion',async()=>{
   const {since,detail}=await stage(at,'chapters3-4.html');const f=comic();
   await f.locator('#play').click();
   for(let i=0;i<7;i++)await f.locator('#next').click();
   await f.locator('#choice').waitFor({state:'visible',timeout:20000});
   await shot('06-choice-'+choice);
   await page.waitForTimeout(2500);
   const s=await snap();assert.equal(s.wave,at);assert.equal(s.paused,true);
   await f.locator('#'+choice).click();
   await shot('07-ending-'+choice);
   await waitMessage('dragon-cinematic-complete',since,120000);
   return {detail,result:await departure(at+1)};
  });
 }
 await check('Escape while focused inside comic resumes once',async()=>{
  const {since}=await stage(5,'chapter2.html');await comic().locator('#toggle').focus();await page.keyboard.press('Escape');
  await waitMessage('dragon-cinematic-skip',since,15000);
  return await departure(6);
 });
}catch(e){report.errors.push(String(e));}
finally{
 report.passed=report.errors.length===0&&report.checks.length===6&&report.checks.every(c=>c.pass);
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('CINEMATIC_SUMMARY '+JSON.stringify(report));
 if(browser)await browser.close().catch(()=>{});process.exitCode=report.passed?0:1;
}
