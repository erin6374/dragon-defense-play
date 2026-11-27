// Count actual submitted object groups in frozen integrated scenes.
// Observe renderer.renderBufferDirect without altering object callbacks or
// eligibility for instancing. renderer.info remains authoritative.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-scene-profile-output';
await mkdir(out,{recursive:true});
const base=new URL(process.argv[2]||'http://127.0.0.1:8765/');
const report={scope:'software WebGL, frozen production scenes, actual object submissions; no GPU-time inference',cases:[],errors:[]};
let browser;
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:640,height:360},deviceScaleFactor:1,serviceWorkers:'block'});
 await page.addInitScript(()=>{let s=20261127;Math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);});
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.goto(new URL('?qa=1&motion=1',base).href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
 await page.evaluate(()=>{
  const q=window.__DD_QA;const s=q.start(1);if(!s.ok)throw Error(s.error);
  q.toggleFreeFlight(true);q.repairAllBuildings();q.clearMeteors();q.move(0,20);q.qaSettleAtmosphere();
  q.setMusicMuted(true);q.setSfxMuted(true);
  const T=window.__DD_THREE,cam=new T.PerspectiveCamera(52,640/360,.1,650);
  cam.position.set(0,34,65);cam.lookAt(0,12,0);window.__DD_PROFILE_CAMERA=cam;
 });
 for(const phase of ['intact','damage','south-end']){
  const data=await page.evaluate(phase=>{
   const q=window.__DD_QA,r=window.__DD_RENDERER,T=window.__DD_THREE,scene=window.__DD_SCENE,cam=window.__DD_PROFILE_CAMERA;
   if(phase==='damage'){
    const p=q.getCity().buildings.find(b=>b.school);
    q.verifyMeteorImpact(p.x,p.h*.75,p.z,3.6);
    q.runPresetSubway();
    q.advanceSimulation(30);
   }
   if(phase==='south-end'){
    const {maxX}=q.inspectionBounds();q.move(maxX-35,20);
    cam.position.set(maxX-35,34,65);cam.lookAt(maxX-35,12,0);
   }
   // Warm up production render, creating any deferred batch objects before
   // installing a temporary renderer observer. Restore it even on failure.
   q.renderFrame(cam,0);
   const groups=new Map();
   const category=o=>{
    let p=o,root=o,names=[];
    while(p&&p!==scene){if(p.name)names.push(p.name);root=p;p=p.parent;}
    if(root.name)return root.name;
    if(o.name)return o.name;
    if(names.length)return names.at(-1);
    return 'unnamed '+o.type+' / '+(o.material?.type||'material-array');
   };
   const original=r.renderBufferDirect;
   r.renderBufferDirect=function(camera,sceneArg,geometry,material,o,group){
    const key=category(o),count=groups.get(key)||{submissions:0,instances:0,geometryElements:0};
    count.submissions++;count.instances+=o.isInstancedMesh?o.count:1;
    const n=group?.count??geometry?.index?.count??geometry?.attributes?.position?.count??0;
    count.geometryElements+=n*(o.isInstancedMesh?o.count:1);
    groups.set(key,count);
    return original.apply(this,arguments);
   };
   try{q.renderFrame(cam,0);}finally{r.renderBufferDirect=original;}
   return {phase,render:{...r.info.render},groups:[...groups].map(([name,v])=>({name,...v})).sort((a,b)=>b.submissions-a.submissions),state:q.snap().counts,schoolDamage:q.getSchoolDamage(),renderer:r.getContext().getParameter(r.getContext().RENDERER)};
  },phase);
  assert.ok(data.render.calls>0&&data.groups.length>0,'No real render submissions captured');
  report.cases.push(data);
  console.log('SCENE_PROFILE '+JSON.stringify({phase,render:data.render,topGroups:data.groups.slice(0,15),state:data.state,schoolDamage:data.schoolDamage}));
  await page.screenshot({path:out+'/'+phase+'.png'});
 }
 assert.equal(report.errors.length,0);report.passed=true;
}catch(e){report.passed=false;report.fatal=String(e);console.error(e);}
finally{if(browser)await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
if(!report.passed)process.exitCode=1;
