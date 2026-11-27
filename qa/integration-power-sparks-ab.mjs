// Controlled production transformer spark comparison.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-power-sparks-output';await mkdir(out,{recursive:true});
const base=new URL(process.argv[2]||'http://127.0.0.1:8765/');
const report={cases:[],errors:[],scope:'Frozen seeded software WebGL production spark burst, not native FPS'};
let browser;
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const enabled of [false,true]){
  const page=await browser.newPage({viewport:{width:640,height:360},deviceScaleFactor:1,serviceWorkers:'block'});
  page.on('pageerror',e=>report.errors.push(String(e)));
  await page.addInitScript(()=>{let s=20261127;Math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);});
  await page.goto(new URL('?qa=1&motion=1&powerSparkBatch='+Number(enabled),base).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
  const result=await page.evaluate(()=>{
   const q=window.__DD_QA,T=window.__DD_THREE,r=window.__DD_RENDERER,scene=window.__DD_SCENE;
   q.start(1);q.toggleFreeFlight(true);q.clearMeteors();q.setMusicMuted(true);q.setSfxMuted(true);
   const probe=q.powerGridSparkProbe();if(!probe.ok)throw Error(probe.error);
   const data=probe.result,origin=new T.Vector3(...data.position);
   const cam=new T.PerspectiveCamera(52,640/360,.1,650);cam.position.copy(origin).add(new T.Vector3(0,3,12));cam.lookAt(origin);
   const root=scene.getObjectByName('power-grid-infrastructure');
   const sparks=new Set();root.traverse(o=>{if(o.name==='power-grid-spark-batch'||(o.isMesh&&o.material?.isMeshBasicMaterial&&o.visible))sparks.add(o);});
   q.renderFrame(cam,0);
   let submissions=0,triangles=0,instances=0;const original=r.renderBufferDirect;
   r.renderBufferDirect=function(camera,sceneArg,geometry,material,o,group){if(sparks.has(o)){submissions++;const n=o.isInstancedMesh?o.count:1;instances+=n;triangles+=(geometry.index?.count??geometry.attributes.position.count)/3*n;}return original.apply(this,arguments);};
   try{q.renderFrame(cam,0);}finally{r.renderBufferDirect=original;}
   return {...data,submissions,triangles,submittedInstances:instances,drawCalls:r.info.render.calls};
  });
  report.cases.push({enabled,...result});await page.screenshot({path:out+'/'+(enabled?'batched':'baseline')+'.png'});await page.close();
 }
 const [a,b]=report.cases;
 assert.equal(a.active,48);assert.equal(b.active,48);assert.equal(a.submissions,48);assert.equal(b.submissions,1);
 assert.equal(a.triangles,b.triangles);assert.equal(a.submittedInstances,b.submittedInstances);assert.deepEqual(a.position,b.position);
 assert.equal(report.errors.length,0);report.passed=true;console.log('POWER_SPARK_AB '+JSON.stringify({baseline:a,batched:b,saved:a.submissions-b.submissions}));
}catch(e){report.passed=false;report.fatal=String(e);console.error(e);}
finally{if(browser)await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
if(!report.passed)process.exitCode=1;
