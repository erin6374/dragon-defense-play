// Controlled actual game traffic simulation, not an unassisted playthrough.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-traffic-output';await mkdir(out,{recursive:true});
const report={commit:process.env.GITHUB_SHA||null,scope:'Production traffic, gas, pedestrian and patrol updates with staged actors; deterministic simulation, not native real-time play',checks:[],errors:[]};
let browser,page;
const stage=async(scenario,wave)=>{
 const result=await page.evaluate(({scenario,wave})=>{
  const q=window.__DD_QA;const start=q.start(wave);if(!start.ok)throw Error(start.error);
  const r=q.stageTrafficAcceptance(scenario);if(!r.ok)throw Error(r.error);
  q.renderFrame(null,0);
  return {data:r.result,png:window.__DD_RENDERER.domElement.toDataURL('image/png').split(',')[1]};
 },{scenario,wave});
 assert.ok(result.png.length>1000);await writeFile(out+'/'+scenario+'.png',Buffer.from(result.png,'base64'));return result.data;
};
async function check(name,fn){try{const result=await fn();report.checks.push({name,pass:true,result});console.log('PASS '+name);}catch(e){report.checks.push({name,pass:false,error:String(e)});console.error('FAIL '+name,e);}}
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'});
 page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto(new URL('?qa=1&motion=1',process.argv[2]||'http://127.0.0.1:8765/').href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
 await check('Blocked eastbound corridor holds or detours without entering opposing lanes',async()=>{
  const r=await stage('lanes',4);
  assert.equal(r.before.length,2);assert.equal(r.after.length,2);assert.ok(r.traces.length>=12);
  for(const sample of r.traces)for(const c of sample){const lanes=c.dir>0?r.lanes.slice(0,2):r.lanes.slice(2);assert.ok(c.z>=lanes[0]-.65&&c.z<=lanes[1]+.65,'Opposing lane or sidewalk '+JSON.stringify(c));}
  const east=r.after.find(c=>c.dir>0),west=r.after.find(c=>c.dir<0);
  assert.ok(east.x<r.center+1,'Crossed blocked corridor');assert.ok(east.speed<3||east.evading,'No crater response');
  assert.ok(west.x<r.before.find(c=>c.dir<0).x-1,'Clear opposing lane not moving');
  return r;
 });
 await check('Real descending gas plume freezes police and fire truck but not bus; seven-second recovery',async()=>{
  const r=await stage('gas',7);assert.ok(r.initialClouds>0);
  for(const c of r.hit.slice(0,2)){assert.equal(c.frozen,true);assert.ok(c.stun>6&&c.stun<=7);assert.equal(c.speed,0);}
  assert.equal(r.hit[2].frozen,false);for(const h of r.held){assert.equal(h.state.frozen,true);assert.ok(h.distance<.001);}
  assert.ok(r.released.every(c=>!c.frozen&&c.stun===0));return r;
 });
 await check('Pedestrians on opposite sides flee the danger zone',async()=>{
  const r=await stage('pedestrians',4);console.log('PEDESTRIAN_TRACE '+JSON.stringify(r));
  assert.ok(Math.abs(r.hazardX)>95,'Expected remote mapped crosswalk');
  assert.ok(r.afterWarning.every(p=>p.down===0&&p.retained),'Warning caused injury or removal');
  assert.ok(r.after[0].x<r.before[0].x);assert.ok(r.after[1].x>r.before[1].x);
  for(const p of r.after){assert.ok(p.panic>0);assert.ok(p.walkSpeed>=6.2);assert.equal(p.down,0);assert.equal(p.retained,true);}
  assert.equal(r.after[0].z,4);assert.equal(r.after[1].z,29);assert.ok(r.after[2].z<r.before[2].z,'Crossing pedestrian must retreat to nearest sidewalk');return r;
 });
 await check('Patrol helicopter turns toward reversed travel instead of flying backward',async()=>{
  const r=await stage('helicopter',7);assert.equal(r.crashing,false);assert.ok(r.after[0]<r.before[0]-2);assert.ok(r.velX<0);assert.ok(r.noseX<-.75,'Nose not facing reversed travel');return r;
 });
}catch(e){report.errors.push(String(e));}
finally{
 report.passed=report.errors.length===0&&report.checks.length===4&&report.checks.every(c=>c.pass);
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('TRAFFIC_SUMMARY '+JSON.stringify(report));
 if(browser)await browser.close().catch(()=>{});process.exitCode=report.passed?0:1;
}
