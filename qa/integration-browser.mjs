// Targeted browser acceptance probe. Software WebGL is not a physical GPU benchmark.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-browser-output';
await mkdir(out,{recursive:true});
const report={scope:'actual integrated browser; software WebGL; boundary approach uses QA positioning followed by real keyboard input',errors:[],warnings:[],checks:[]};
const base=new URL(process.argv[2]||'http://127.0.0.1:8765/');
let browser,page;
async function check(name,fn){
 try{const data=await fn();report.checks.push({name,pass:true,data});console.log('PASS',name);}
 catch(error){report.checks.push({name,pass:false,error:String(error)});console.error('FAIL',name,error);}
}
const snap=()=>page.evaluate(()=>window.__DD_QA.snap());
async function approach(mode,end,key,direction){
 const s=await page.evaluate(({mode,end,direction})=>{
   const qa=window.__DD_QA;
   const started=qa.start(1);if(!started.ok)throw Error(started.error);
   if(mode==='sandbox'){const switched=qa.toggleFreeFlight(true);if(!switched.ok)throw Error(switched.error);}
   const moved=qa.move(end-direction*18,30);if(!moved.ok)throw Error(moved.error);
   return qa.snap();
 },{mode,end,direction});
 assert.equal(s.campaign.freeFlightMode,mode==='sandbox');
 await page.keyboard.down(key);
 try{
   await page.waitForFunction(({end,direction})=>direction*(window.__DD_QA.snap().dragon.x-end)>=-.5,{end,direction},{timeout:90000});
 }finally{await page.keyboard.up(key);}
 const after=await snap();
 assert.ok(direction*(after.dragon.x-s.dragon.x)>10,'real keyboard motion must cross approach distance');
 assert.equal(after.campaign.freeFlightMode,mode==='sandbox');
 await page.screenshot({path:out+'/'+mode+'-'+(direction>0?'south':'north')+'.png'});
 return {before:s.dragon,after:after.dragon,camera:after.camera,target:end};
}
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1024,height:576},serviceWorkers:'block'});
 page.setDefaultTimeout(90000);
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());if(m.type()==='warning')report.warnings.push(m.text());});
 page.on('response',r=>{if(r.status()>=400)report.errors.push(r.status()+' '+r.url());});
 await page.goto(new URL('?qa=1',base).href);
 await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady&&window.__DD_QA.snap().frameTimes.frames>=2,undefined,{timeout:180000});
 report.build=await page.evaluate(()=>window.__DD_BUILD_INFO);
 await check('actual packaged school mesh fits mapped collision envelope',async()=>{
   const result=await page.evaluate(()=>{
     const qa=window.__DD_QA,T=window.__DD_THREE;
     const school=qa.getCity().buildings.find(b=>b.school);
     const model=window.__DD_SCENE.getObjectByName('ACTUAL-TECH-FREIRE-SCHOOL');
     if(!model||!school)throw Error('Missing school model or mapped parcel');
     model.updateMatrixWorld(true);
     const box=new T.Box3().setFromObject(model);
     return {min:box.min.toArray(),max:box.max.toArray(),parcel:{x:school.x,z:school.z,w:school.w,d:school.d,h:school.h},source:qa.snap().sourceSchool.interiorAudit};
   });
   const {min,max,parcel:p}=result;
   assert.ok([...min,...max].every(Number.isFinite));
   assert.ok(max[0]-min[0]>10&&max[1]-min[1]>20,'real school must retain substantial visible geometry');
   assert.ok(min[0]>=p.x-p.w/2-.02&&max[0]<=p.x+p.w/2+.02);
   assert.ok(min[2]>=p.z-p.d/2-.02&&max[2]<=p.z+p.d/2+.02);
   assert.ok(result.source?.sourceSHA256,'source provenance must be present');
   await page.screenshot({path:out+'/school-startup.png'});
   return result;
 });
 const ends=await page.evaluate(async()=>{
   const {BROAD_EXTENTS}=await import('./broad-street/broad-street-grid-data.mjs');
   const {VIEWER_TO_GAME_X}=await import('./src/simulation/viewer-parcels.js');
   return BROAD_EXTENTS.map(x=>x+VIEWER_TO_GAME_X);
 });
 for(const mode of ['campaign','sandbox']){
   await check(mode+' south boundary via keyboard',()=>approach(mode,ends[1],'KeyD',1));
   await check(mode+' north boundary via keyboard',()=>approach(mode,ends[0],'KeyA',-1));
 }
 await check('render telemetry and frame progress under sandbox stress',async()=>{
   const start=await snap();
   const result=await page.evaluate(()=>window.__DD_QA.spawnMeteorBarrage(8,0,10));
   assert.ok(result.ok,result.error);
   await page.waitForFunction(n=>window.__DD_QA.snap().frameTimes.frames>=n+12,start.frameTimes.frames,{timeout:90000});
   const data=await page.evaluate(()=>({snap:window.__DD_QA.snap(),metrics:window.__DD_GAME_METRICS,frameHealth:window.__DD_FRAME_HEALTH.summary()}));
   assert.ok(data.snap.frameTimes.frames>start.frameTimes.frames);
   await page.screenshot({path:out+'/stress.png'});
   return data;
 });
}catch(error){report.fatal=String(error);console.error(error);}
finally{
 if(page){try{await page.screenshot({path:out+'/last-frame.png',timeout:10000});}catch{}}
 if(browser)await browser.close();
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));
}
if(report.fatal||report.checks.some(c=>!c.pass)||report.errors.length)process.exitCode=1;
