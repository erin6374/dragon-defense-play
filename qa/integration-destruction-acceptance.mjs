// Independent milestone test: inject meteor spawns, then exercise real swept
// collision and penetration through production fixed steps, not direct damage.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-destruction-output';await mkdir(out,{recursive:true});
const base=new URL(process.argv[2]||'http://127.0.0.1:8765/');
const report={scope:'assisted meteor spawn, real production collision and penetration at 60Hz; not unassisted play or real-time FPS',hits:[],errors:[]};
let browser;
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1,serviceWorkers:'block'});
 page.on('pageerror',e=>report.errors.push(String(e)));
 await page.addInitScript(()=>{let s=20261127;Math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);});
 await page.goto(new URL('?qa=1&motion=1',base).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
 const initial=await page.evaluate(()=>{
  const q=window.__DD_QA,T=window.__DD_THREE,school=q.getCity().buildings.find(b=>b.school);
  q.start(1);q.toggleFreeFlight(true);q.clearMeteors();q.repairAllBuildings();q.move(school.x+60,35);
  q.setMusicMuted(true);q.setSfxMuted(true);
  const cam=new T.PerspectiveCamera(52,960/540,.1,650);
  cam.position.set(school.x+8,36,school.z+60);cam.lookAt(school.x,14,school.z);window.__DD_DAMAGE_CAM=cam;
  q.renderFrame(cam,0);
  return {school:{x:school.x,z:school.z,h:school.h,w:school.w,d:school.d},damage:q.getSchoolDamage(),hp:q.snap().hp};
 });
 assert.equal(initial.damage,0);assert.equal(initial.hp,100);report.initial=initial;
 for(const [size,offset,budget] of [[1.35,-3,.05],[3.6,3,.15],[3.6,-3,.15]]){
  const hit=await page.evaluate(({size,offset,budget})=>{
   const q=window.__DD_QA,school=q.getCity().buildings.find(b=>b.school);
   q.clearMeteors();
   const before=q.getSchoolDamage(),strikes=q.snap().sourceSchool.strikes;
   const result=q.spawnTestMeteorAt(school.x+offset,school.h*.6,school.z,size,'iron');
   if(!result.ok)throw Error(result.error);
   const trace=[];
   for(let i=0;i<12;i++){
    q.advanceSimulation(30);
    const s=q.snap();
    trace.push({elapsed:s.elapsed,damage:q.getSchoolDamage(),hp:s.hp,meteors:s.meteors.map(m=>({x:m.x,y:m.y,z:m.z,size:m.size}))});
    if(q.getSchoolDamage()>=before+budget-1e-6)break;
   }
   q.renderFrame(window.__DD_DAMAGE_CAM,0);
   return {size,offset,budget,before,after:q.getSchoolDamage(),strikesBefore:strikes,strikesAfter:q.snap().sourceSchool.strikes,trace,hp:q.snap().hp};
  },{size,offset,budget});
  report.hits.push(hit);console.log('REAL_METEOR_HIT '+JSON.stringify(hit));
  assert.ok(Math.abs(hit.after-hit.before-budget)<.002,'Unexpected real impact budget');
  assert.ok(hit.strikesAfter>hit.strikesBefore,'No localized damage strike');
  assert.ok(hit.trace.some(t=>t.damage>hit.before&&t.damage<hit.after-1e-5),'No progressive penetration');
  assert.ok(hit.hp>0,'School collapsed prematurely');
  await page.screenshot({path:out+'/hit-'+report.hits.length+'.png'});
 }
 const repaired=await page.evaluate(()=>{const q=window.__DD_QA;q.clearMeteors();q.repairAllBuildings();q.renderFrame(window.__DD_DAMAGE_CAM,0);return {damage:q.getSchoolDamage(),hp:q.snap().hp,strikes:q.snap().sourceSchool.strikes};});
 assert.deepEqual(repaired,{damage:0,hp:100,strikes:0});report.repaired=repaired;
 await page.screenshot({path:out+'/repaired.png'});
 assert.equal(report.errors.length,0);report.passed=true;
}catch(e){report.passed=false;report.fatal=String(e);console.error(e);}
finally{if(browser)await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
if(!report.passed)process.exitCode=1;
