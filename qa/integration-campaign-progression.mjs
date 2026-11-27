// Integrated campaign state-machine smoke test. Combat/escort/satellite
// outcomes are deliberately assisted. This is NOT a human full playthrough.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-campaign-output';
await mkdir(out,{recursive:true});
const base=new URL(process.argv[2]||'http://127.0.0.1:8765/');
const report={scope:'assisted campaign progression, actual browser and production wave/settlement functions; not unassisted gameplay',waves:[],boundaries:[],errors:[]};
let browser;
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:960,height:540},acceptDownloads:true});
 page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto(new URL('?qa=1&motion=1',base).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
 await page.locator('#start-training').click({timeout:30000});
 assert.ok(await page.evaluate(()=>window.__DD_QA.trainingStats().active),'Training UI failed to start');
 report.training=await page.evaluate(()=>{
  const q=window.__DD_QA,before=q.trainingStats();q.skipTraining();
  const after=q.snap();return {before,after:{wave:after.wave,active:after.active,paused:after.paused,remaining:after.campaign.remaining,meteors:after.counts.meteors},training:q.trainingStats()};
 });
 assert.equal(report.training.training.active,false);assert.equal(report.training.after.wave,1);
 assert.ok(report.training.after.active&&!report.training.after.paused&&report.training.after.meteors>0);
 for(let wave=1;wave<=15;wave++){
  const initial=await page.evaluate(()=>{const q=window.__DD_QA,s=q.snap();return {wave:s.wave,active:s.active,paused:s.paused,remaining:s.campaign.remaining,meteors:s.counts.meteors,bossMeteors:s.counts.bossMeteors,transition:s.chapterTransition,escort:q.evacuationStats()};});
  assert.equal(initial.wave,wave);assert.ok(initial.active&&!initial.paused&&!initial.transition.active,'Wave not playable '+wave);
  report.waves.push(initial);console.log('CAMPAIGN_WAVE '+JSON.stringify(initial));
  if(wave===15)break;
  const result=await page.evaluate(()=>{
   const q=window.__DD_QA;
   // Resolve the escort objective explicitly rather than bypassing the wave.
   const escort=q.evacuationStats();
   if(escort.active){
    for(let i=0;i<escort.TOTAL_RUNS+1&&q.evacuationStats().active;i++){
     q.triggerChopperEscape();
     if(q.evacuationStats().active)q.advanceSimulation(120);
    }
   }
   q.clearMeteors();
   q.advanceProgress(3);
   const s=q.snap();return {wave:s.wave,paused:s.paused,transition:s.chapterTransition,escort:q.evacuationStats()};
  });
  if([2,5,10,14].includes(wave)){
   assert.ok(result.transition.active&&result.transition.phase==='calm','Missing settlement after '+wave);
   const stages=await page.evaluate(()=>{
    const q=window.__DD_QA,phases=[];
    for(const duration of [7,13,3]){const r=q.advanceSettlement(duration);if(!r.ok)throw Error(r.error);const s=q.snap();phases.push({phase:s.chapterTransition.phase,wave:s.wave,paused:s.paused,next:s.chapterTransition.postCutsceneWave});}
    return phases;
   });
   assert.equal(stages[0].phase,'cleanup');assert.equal(stages[1].phase,'fade');assert.ok(stages[2].paused,'Missing cinematic');
   await page.locator('#cinematic-player').waitFor({state:'visible'});
   await page.screenshot({path:out+'/chapter-after-'+wave+'.png'});
   const cinematic=await page.evaluate(()=>({src:document.getElementById('cinematic-frame').getAttribute('src'),title:document.getElementById('cinematic-chapter').textContent}));
   assert.ok(cinematic.src?.includes('embedded=1'));
   await page.locator('#cinematic-skip').click();
   const after=await page.evaluate(()=>{const q=window.__DD_QA;const s=q.snap();const r=q.advanceSettlement(6);if(!r.ok)throw Error(r.error);const t=q.snap();return {departure:s.chapterTransition.phase,wave:t.wave,paused:t.paused,transition:t.chapterTransition,remaining:t.campaign.remaining};});
   assert.equal(after.departure,'departure');assert.equal(after.wave,wave+1);assert.ok(!after.paused&&!after.transition.active&&after.remaining>0);
   const boundary={wave,stages,cinematic,after};report.boundaries.push(boundary);console.log('CAMPAIGN_BOUNDARY '+JSON.stringify(boundary));
  }else assert.equal(result.wave,wave+1,'Wave progression blocked at '+wave);
 }
 const finale=await page.evaluate(()=>{
  const q=window.__DD_QA,before=q.snap();q.destroyAllSatellites();q.advanceProgress(2.3);const after=q.snap();
  return {before:{wave:before.wave,bosses:before.counts.bossMeteors},after:{active:after.active,wave:after.wave},heading:document.querySelector('#panel h1')?.textContent};
 });
 assert.ok(finale.before.bosses>0,'Finale bosses were not spawned');assert.equal(finale.after.active,false);assert.match(finale.heading,/PHILADELPHIA SAVED/);
 await page.locator('#ending-block').click();assert.match(await page.locator('#panel h2').innerText(),/ACCOUNTABILITY VICTORY/);
 await page.screenshot({path:out+'/ending.png'});
 report.finale=finale;assert.equal(report.waves.length,15);assert.equal(report.boundaries.length,4);assert.equal(report.errors.length,0);report.passed=true;
 console.log('CAMPAIGN_SUMMARY '+JSON.stringify({waves:report.waves.map(w=>w.wave),boundaries:report.boundaries.map(b=>b.wave),training:report.training.after,finale}));
}catch(e){report.passed=false;report.fatal=String(e);console.error(e);}
finally{if(browser)await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
if(!report.passed)process.exitCode=1;
