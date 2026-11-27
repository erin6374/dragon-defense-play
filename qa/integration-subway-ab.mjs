// Compare the same staged production subway breach in fresh seeded contexts.
// Count actual render submissions and exact triangle inventory, not FPS.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-subway-ab-output';await mkdir(out,{recursive:true});
const base=new URL(process.argv[2]||'http://127.0.0.1:8765/');
const report={scope:'same seeded production subway scene, software WebGL; no native FPS claim',cases:[],errors:[]};
let browser;
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const enabled of [false,true]){
  const page=await browser.newPage({viewport:{width:640,height:360},deviceScaleFactor:1,serviceWorkers:'block'});
  page.on('pageerror',e=>report.errors.push(String(e)));
  await page.addInitScript(()=>{let s=20261127;Math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);});
  await page.goto(new URL('?qa=1&motion=1&subwayBatch='+Number(enabled),base).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
  const data=await page.evaluate(()=>{
   const q=window.__DD_QA,T=window.__DD_THREE,r=window.__DD_RENDERER,scene=window.__DD_SCENE;
   const start=q.start(1);if(!start.ok)throw Error(start.error);
   q.toggleFreeFlight(true);q.repairAllBuildings();q.clearMeteors();q.move(0,20);q.qaSettleAtmosphere();
   q.setMusicMuted(true);q.setSfxMuted(true);q.runPresetSubway();
   const root=scene.getObjectByName('subway-cavern-group');
   if(!root)throw Error('Subway preset missing cavern');
   const train=root.getObjectByName('septa-b4-subway-car'),station=root.getObjectByName('subway-station-mezzanine');
   if(!train||!station)throw Error('Missing train or station');
   const rigid=[train,...station.children.filter(o=>o.name==='station-turnstile')];
   const owned=new Set();let triangles=0,meshes=0;
   for(const group of rigid)group.traverse(o=>{if(o.isMesh){owned.add(o);meshes++;triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
   const cam=new T.PerspectiveCamera(52,640/360,.1,650);cam.position.copy(root.position).add(new T.Vector3(0,16,28));cam.lookAt(root.position.clone().add(new T.Vector3(0,-4,0)));
   q.renderFrame(cam,0);
   let submissions=0;const original=r.renderBufferDirect;
   r.renderBufferDirect=function(camera,sceneArg,geometry,material,o,group){if(owned.has(o))submissions++;return original.apply(this,arguments);};
   try{q.renderFrame(cam,0);}finally{r.renderBufferDirect=original;}
   return {meshes,triangles,submissions,totalCalls:r.info.render.calls,derailed:!!train.userData.derailed,trainPosition:train.position.toArray(),trainQuaternion:train.quaternion.toArray(),turnstiles:rigid.length-1,animatedParts:Object.keys(root.userData.animatedParts||{}).filter(k=>root.userData.animatedParts[k])};
  });
  report.cases.push({enabled,...data});await page.screenshot({path:out+'/'+(enabled?'batched':'baseline')+'.png'});await page.close();
 }
 const [a,b]=report.cases;
 assert.ok(a.submissions>0&&b.submissions>0);assert.equal(a.triangles,b.triangles);assert.equal(a.derailed,true);assert.equal(b.derailed,true);assert.deepEqual(a.trainPosition,b.trainPosition);assert.deepEqual(a.trainQuaternion,b.trainQuaternion);assert.equal(a.turnstiles,b.turnstiles);assert.deepEqual(a.animatedParts,b.animatedParts);
 assert.ok(b.meshes<a.meshes&&b.submissions<a.submissions,'Rigid subtree must reduce actual submissions');
 assert.equal(report.errors.length,0);report.passed=true;console.log('SUBWAY_AB '+JSON.stringify({baseline:a,batched:b,saved:a.submissions-b.submissions}));
}catch(e){report.passed=false;report.fatal=String(e);console.error(e);}
finally{if(browser)await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
if(!report.passed)process.exitCode=1;
