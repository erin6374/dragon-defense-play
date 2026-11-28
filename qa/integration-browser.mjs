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
 await check('Startup controls remain reachable above HUD in short viewports',async()=>{
   const sizes=[{width:1024,height:576},{width:844,height:390}],results=[];
   try{
    for(const size of sizes){
     await page.setViewportSize(size);
     for(const id of ['start-training','start','start-sandbox-direct']){
      const button=page.locator('#'+id);await button.scrollIntoViewIfNeeded();
      const v=await button.evaluate(el=>{
       const r=el.getBoundingClientRect(),p=document.getElementById('panel'),b=p.getBoundingClientRect(),hit=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);
       return {id:el.id,reachable:el===hit||el.contains(hit),panelTop:b.top,panelBottom:b.bottom,height:innerHeight,scrollHeight:p.scrollHeight,clientHeight:p.clientHeight};
      });
      assert.ok(v.reachable&&v.panelTop>=-1&&v.panelBottom<=v.height+1,JSON.stringify(v));results.push({...size,...v});
     }
    }
   }finally{await page.setViewportSize({width:1024,height:576});await page.locator('#panel').evaluate(p=>p.scrollTop=0);}
   return results;
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
 await check('school damage accumulates in 5 and 15 percent increments and resets',async()=>{
   const result=await page.evaluate(()=>{
     const qa=window.__DD_QA;
     qa.repairAllBuildings();
     const school=qa.getCity().buildings.find(b=>b.school);
     qa.move(school.x,30);
     const before=qa.snap();
     const first=qa.verifyMeteorImpact(school.x-3,school.h*.75,school.z,1.35);
     const second=qa.verifyMeteorImpact(school.x+3,school.h*.35,school.z,4);
     return {before,first,second,school:{x:school.x,z:school.z,w:school.w,d:school.d,h:school.h}};
   });
   assert.equal(result.before.schoolDamage,0);
   assert.equal(result.first.schoolDamage,.05);
   assert.equal(result.second.schoolDamage,.2);
   assert.equal(result.first.hp,95);
   assert.equal(result.second.hp,80);
   assert.ok(result.second.sourceSchool.strikes>result.first.sourceSchool.strikes);
   await page.waitForFunction(n=>window.__DD_QA.snap().frameTimes.frames>=n+2,result.second.frameTimes.frames);
   await page.screenshot({path:out+'/school-progressive-damage.png'});
   const repaired=await page.evaluate(()=>{window.__DD_QA.repairAllBuildings();return window.__DD_QA.snap();});
   assert.equal(repaired.schoolDamage,0);
   assert.equal(repaired.sourceSchool.strikes,0);
   console.log('SCHOOL_DAMAGE',JSON.stringify({before:result.before.schoolDamage,first:result.first.schoolDamage,second:result.second.schoolDamage,repaired:repaired.schoolDamage}));
   return {...result,repaired};
 });
 await check('render telemetry and frame progress under sandbox stress',async()=>{
   // Keep the barrage in the visible neighborhood rather than offscreen at
   // the northern boundary from the preceding flight test.
   await page.evaluate(()=>window.__DD_QA.move(0,24));
   const approach=await snap();
   await page.waitForFunction(n=>window.__DD_QA.snap().frameTimes.frames>=n+4,approach.frameTimes.frames);
   const start=await snap();
   // Observe the actual live stress frames (not a frozen approximation).
   // Cache ancestor labels per object and retain only the highest-call
   // frame plus a compact frame series. Instrumentation is diagnostic.
   await page.evaluate(()=>{
     const r=window.__DD_RENDERER,scene=window.__DD_SCENE;
     const originalRender=r.render,originalSubmit=r.renderBufferDirect;
     let groups=null,peak=null;
     const cache=new WeakMap(),frames=[];
     function category(o,material){
       if(cache.has(o))return cache.get(o);
       let p=o,root=o,named='';
       while(p&&p!==scene){if(p.name)named=p.name;root=p;p=p.parent;}
       const name=root.name||named||('unnamed '+o.type+' / '+(material?.type||'unknown'));
       cache.set(o,name);return name;
     }
     r.renderBufferDirect=function(camera,sceneArg,geometry,material,o,group){
       if(groups){
         const name=category(o,material),v=groups.get(name)||{submissions:0,instances:0,elements:0};
         const count=o.isInstancedMesh?o.count:1;
         v.submissions++;v.instances+=count;
         v.elements+=(group?.count??geometry?.index?.count??geometry?.attributes?.position?.count??0)*count;
         groups.set(name,v);
       }
       return originalSubmit.apply(this,arguments);
     };
     r.render=function(){
       groups=new Map();
       try{return originalRender.apply(this,arguments);}
       finally{
         const counts={...r.info.render};
         frames.push({calls:counts.calls,triangles:counts.triangles});
         if(frames.length>180)frames.shift();
         if(!peak||counts.calls>peak.render.calls){
           peak={render:counts,groups:[...groups].map(([name,v])=>({name,...v})).sort((a,b)=>b.submissions-a.submissions)};
         }
         groups=null;
       }
     };
     window.__DD_STOP_STRESS_PROFILE=()=>{
       r.render=originalRender;r.renderBufferDirect=originalSubmit;
       delete window.__DD_STOP_STRESS_PROFILE;
       return {peak,frames};
     };
   });
   let stressProfile;
   try{
     const result=await page.evaluate(()=>window.__DD_QA.spawnMeteorBarrage(8,0,10));
     assert.ok(result.ok,result.error);
     await page.waitForFunction(n=>window.__DD_QA.snap().frameTimes.frames>=n+12,start.frameTimes.frames,{timeout:90000});
   }finally{
     stressProfile=await page.evaluate(()=>window.__DD_STOP_STRESS_PROFILE());
   }
   assert.ok(stressProfile.frames.length>0&&stressProfile.peak?.groups.length>0,'No live rendering submissions captured');
   console.log('STRESS_PEAK_PROFILE',JSON.stringify({render:stressProfile.peak.render,groups:stressProfile.peak.groups.slice(0,25),frames:stressProfile.frames}));
   const data=await page.evaluate(()=>({snap:window.__DD_QA.snap(),metrics:window.__DD_GAME_METRICS,frameHealth:window.__DD_FRAME_HEALTH.summary()}));
   assert.ok(data.snap.frameTimes.frames>start.frameTimes.frames);
   console.log('STRESS_TELEMETRY',JSON.stringify({metrics:data.metrics,frameHealth:data.frameHealth,counts:data.snap.counts,scene:data.snap.scene}));
   await page.screenshot({path:out+'/stress.png'});
   return {...data,stressProfile};
 });
}catch(error){report.fatal=String(error);console.error(error);}
finally{
 if(page){try{await page.screenshot({path:out+'/last-frame.png',timeout:10000});}catch{}}
 if(browser)await browser.close();
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));
}
if(report.fatal||report.checks.some(c=>!c.pass)||report.errors.length)process.exitCode=1;
