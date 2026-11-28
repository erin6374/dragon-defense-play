// Live embedded comic acceptance: no benchmark bypass or synthetic completion.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-cinematic-output';await mkdir(out,{recursive:true});
const report={commit:process.env.GITHUB_SHA||null,scope:'Real iframe playback; staged production settlement; not a full unassisted campaign',checks:[],errors:[],comicResponses:[]};
let browser,page;
const snap=()=>page.evaluate(()=>window.__DD_QA.snap());
const stage=async()=>{
 await page.evaluate(()=>{const q=window.__DD_QA;const a=q.start(5);if(!a.ok)throw Error(a.error);const b=q.beginSettlement();if(!b.ok)throw Error(b.error);const c=q.advanceSettlement(22);if(!c.ok)throw Error(c.error);});
 await page.locator('#cinematic-player').waitFor({state:'visible',timeout:90000});
 await page.waitForFunction(()=>{const f=document.getElementById('cinematic-frame');return f.contentDocument?.readyState==='complete'&&f.contentWindow.location.pathname.endsWith('/campaign/chapter2.html')&&!!f.contentDocument.body?.children.length;},undefined,{timeout:30000});
 const state=await snap();assert.equal(state.wave,5);assert.equal(state.paused,true);assert.equal(state.chapterTransition.postCutsceneWave,6);
 const detail=await page.evaluate(()=>{const f=document.getElementById('cinematic-frame'),d=f.contentDocument;return {url:f.contentWindow.location.href,title:d.title,bodyText:d.body.innerText.slice(0,1000),elements:d.body.children.length,images:[...d.images].map(i=>({src:i.getAttribute('src'),loaded:i.complete&&i.naturalWidth>0})),heading:document.getElementById('cinematic-chapter').textContent};});
 return detail;
};
const departure=async()=>{
 await page.locator('#cinematic-player').waitFor({state:'hidden',timeout:90000});
 const state=await snap();assert.equal(state.wave,6);assert.equal(state.paused,false);assert.equal(state.chapterTransition.postCutsceneWave,null);
 await page.evaluate(()=>{const q=window.__DD_QA;const r=q.advanceSettlement(6);if(!r.ok)throw Error(r.error);});
 const next=await snap();assert.equal(next.wave,6);assert.equal(next.chapterTransition.active,false);assert.ok(next.campaign.remaining>0);
 return {wave:next.wave,remaining:next.campaign.remaining,phase:next.chapterTransition.phase};
};
async function check(name,fn){try{const result=await fn();report.checks.push({name,pass:true,result});console.log('PASS '+name);}catch(e){report.checks.push({name,pass:false,error:String(e)});console.error('FAIL '+name,e);}}
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'});
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('response',r=>{if(r.url().includes('/campaign/'))report.comicResponses.push({url:r.url(),status:r.status()});});
 await page.addInitScript(()=>{if(window===window.top){window.__cinemaEvidence=[];window.addEventListener('message',e=>{if(e.data?.type==='dragon-cinematic-complete')window.__cinemaEvidence.push({at:performance.now(),trustedFrame:e.origin===location.origin&&e.source===document.getElementById('cinematic-frame')?.contentWindow});},true);}});
 await page.goto(new URL('?qa=1',process.argv[2]||'http://127.0.0.1:8765/').href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
 await check('Embedded chapter 2 loads, pauses gameplay and rejects unrelated completion',async()=>{
  const detail=await stage();
  await page.screenshot({path:out+'/01-chapter2-opening.png'});
  await page.evaluate(()=>window.postMessage({type:'dragon-cinematic-complete'},location.origin));
  await page.waitForTimeout(500);
  const s=await snap();assert.equal(s.wave,5);assert.equal(s.paused,true);assert.equal(await page.locator('#cinematic-player').isVisible(),true);
  await page.locator('#cinematic-skip').click({timeout:20000});
  const result=await departure();
  await page.screenshot({path:out+'/02-skip-next-wave.png'});
  return {detail,result};
 });
 await check('Fresh comic replay completes through actual child message and resumes once',async()=>{
  const detail=await stage();
  const started=await page.evaluate(()=>performance.now());
  await page.waitForTimeout(5000);
  await page.screenshot({path:out+'/03-comic-playback.png'});
  await page.waitForFunction(t=>window.__cinemaEvidence.some(e=>e.trustedFrame&&e.at>=t),started,{timeout:65000,polling:250});
  const result=await departure();
  await page.evaluate(()=>window.postMessage({type:'dragon-cinematic-complete'},location.origin));
  await page.waitForTimeout(250);
  const state=await snap();assert.equal(state.wave,6);assert.equal(state.chapterTransition.postCutsceneWave,null);assert.equal(state.paused,false);
  await page.screenshot({path:out+'/04-natural-next-wave.png'});
  return {detail,result,messages:await page.evaluate(()=>window.__cinemaEvidence)};
 });
}catch(e){report.errors.push(String(e));}
finally{
 report.passed=report.errors.length===0&&report.checks.length===2&&report.checks.every(c=>c.pass);
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('CINEMATIC_SUMMARY '+JSON.stringify(report));
 if(browser)await browser.close().catch(()=>{});process.exitCode=report.passed?0:1;
}
