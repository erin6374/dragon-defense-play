// Controlled ambient skyline submission comparison; batching now follows original alignment. Keep all landmark and
// damage logic outside the batch, and compare the entire ambient inventory.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-skyline-ab-output';await mkdir(out,{recursive:true});
const base=new URL(process.argv[2]||'http://127.0.0.1:8765/');
const report={scope:'seeded production ambient skyline, whole skyline view, software WebGL; no native FPS claim',cases:[],errors:[]};
let browser;
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const enabled of [false,true]){
  const page=await browser.newPage({viewport:{width:960,height:540},deviceScaleFactor:1,serviceWorkers:'block'});
  page.on('pageerror',e=>report.errors.push(String(e)));
  await page.addInitScript(()=>{let s=20261127;Math.random=()=>((s=(Math.imul(s,1664525)+1013904223)>>>0)/4294967296);});
  await page.goto(new URL('?qa=1&motion=1&ambientSkylineBatch='+Number(enabled),base).href,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
  const data=await page.evaluate(()=>{
   const q=window.__DD_QA,T=window.__DD_THREE,r=window.__DD_RENDERER,scene=window.__DD_SCENE;
   q.start(1);q.toggleFreeFlight(true);q.clearMeteors();q.qaSettleAtmosphere();
   const root=scene.getObjectByName('PHILADELPHIA-ORIGINAL-3D-SKYLINE'),ambient=new Set();
   if(!root)throw Error('Missing skyline');
   root.updateWorldMatrix(true,true);
   const bounds=new T.Box3();let triangles=0;
   root.traverse(o=>{if(o.isMesh&&/^ambient-skyline-(facade|side)$/.test(o.material?.name||'')){ambient.add(o);bounds.union(new T.Box3().setFromObject(o,true));triangles+=(o.geometry.index?.count??o.geometry.attributes.position.count)/3;}});
   const center=bounds.getCenter(new T.Vector3()),size=bounds.getSize(new T.Vector3());
   const w=size.x*1.1,h=Math.max(size.y*1.1,w*540/960);
   const cam=new T.OrthographicCamera(-w/2,w/2,h/2,-h/2,.1,10000);cam.position.copy(center).add(new T.Vector3(0,0,500));cam.lookAt(center);cam.updateMatrixWorld(true);
   let submissions=0,submittedTriangles=0;const original=r.renderBufferDirect;
   r.renderBufferDirect=function(camera,sceneArg,geometry,material,o,group){if(ambient.has(o)){submissions++;submittedTriangles+=(group?.count??geometry.index?.count??geometry.attributes.position.count)/3;}return original.apply(this,arguments);};
   try{r.render(scene,cam);}finally{r.renderBufferDirect=original;}
   return {meshes:ambient.size,triangles,submissions,submittedTriangles,rootMatrix:root.matrixWorld.toArray(),bounds:{min:bounds.min.toArray(),max:bounds.max.toArray()}};
  });
  report.cases.push({enabled,...data});await page.screenshot({path:out+'/'+(enabled?'batched':'baseline')+'.png'});await page.close();
 }
 const [a,b]=report.cases;console.log('SKYLINE_AB_DIAGNOSTIC '+JSON.stringify({baseline:a,batched:b}));
 for(let i=0;i<16;i++)assert.ok(Math.abs(a.rootMatrix[i]-b.rootMatrix[i])<.01,'Skyline anchor transform changed');
 assert.ok(a.submissions>0&&b.submissions>0&&b.submissions<a.submissions);
 assert.equal(a.triangles,b.triangles);assert.equal(a.submittedTriangles,b.submittedTriangles);
 for(const k of ['min','max'])for(let i=0;i<3;i++)assert.ok(Math.abs(a.bounds[k][i]-b.bounds[k][i])<.01,'Skyline world bound changed');
 assert.equal(report.errors.length,0);report.passed=true;console.log('SKYLINE_AB '+JSON.stringify({baseline:a,batched:b,saved:a.submissions-b.submissions}));
}catch(e){report.passed=false;report.fatal=String(e);console.error(e);}
finally{if(browser)await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
if(!report.passed)process.exitCode=1;
