// Controlled draw-call comparison: same source, deterministic frozen scene,
// separate fresh browser contexts, query toggle is the only intended change.
// Software WebGL timings are diagnostic, not native GPU performance.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-debris-ab-output';
await mkdir(out,{recursive:true});
const base=new URL(process.argv[2]||'http://127.0.0.1:8765/');
const report={scope:'frozen production render path; 96 furniture fragments; software WebGL',cases:[],errors:[]};
let browser;
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const enabled of [false,true]){
  const context=await browser.newContext({viewport:{width:640,height:360},deviceScaleFactor:1,serviceWorkers:'block'});
  try{
   await context.addInitScript(()=>{
    let seed=20261127;
    window.__DD_AB_RESET_SEED=()=>{seed=20261127;};
    Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);
   });
   const page=await context.newPage();
   page.on('pageerror',e=>report.errors.push(String(e)));
   page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
   const url=new URL('?qa=1&motion=1&debrisBatch='+(enabled?'1':'0'),base);
   await page.goto(url.href,{waitUntil:'domcontentloaded',timeout:90000});
   await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
   const stage=await page.evaluate(()=>{
    const q=window.__DD_QA;
    window.__DD_AB_RESET_SEED();
    const started=q.start(1);if(!started.ok)throw Error(started.error);
    q.toggleFreeFlight(true);q.repairAllBuildings();q.clearMeteors();q.move(0,20);q.qaSettleAtmosphere();
    q.setMusicMuted(true);q.setSfxMuted(true);
    const T=window.__DD_THREE,cam=new T.PerspectiveCamera(52,640/360,.1,650);
    cam.position.set(0,34,65);cam.lookAt(0,12,0);
    window.__DD_AB_CAMERA=cam;
    q.renderFrame(cam,0);
    const renderer=window.__DD_RENDERER,base={calls:renderer.info.render.calls,triangles:renderer.info.render.triangles};
    for(let i=0;i<16;i++)q.spawnFurnitureBurst(-12+(i%8)*3,5+Math.floor(i/8)*4,12,6);
    return {base,count:q.getDebrisCount(),build:window.__DD_BUILD_INFO,scale:renderer.getPixelRatio(),state:q.snap().campaign};
   });
   assert.equal(stage.count,96,'Expected 96 actual production furniture fragments');
   const samples=await page.evaluate(()=>{
    const q=window.__DD_QA,r=window.__DD_RENDERER,cam=window.__DD_AB_CAMERA,gl=r.getContext();
    const samples=[];
    for(let i=0;i<8;i++){
     const t=performance.now();q.renderFrame(cam,0);const submit=performance.now()-t;
     gl.finish();
     const complete=performance.now()-t;
     samples.push({calls:r.info.render.calls,triangles:r.info.render.triangles,submitMs:submit,synchronizedMs:complete});
    }
    return samples;
   });
   const state=await page.evaluate(()=>({count:window.__DD_QA.getDebrisCount(),batch:window.__DD_QA.snap().scene,metrics:window.__DD_GAME_METRICS}));
   assert.equal(state.count,stage.count,'Frozen render must not advance fragment physics');
   await page.screenshot({path:out+'/'+(enabled?'batched':'individual')+'.png'});
   const last=samples.at(-1),result={enabled,stage,samples,state,incrementalCalls:last.calls-stage.base.calls,incrementalTriangles:last.triangles-stage.base.triangles};
   report.cases.push(result);
   console.log('DEBRIS_CASE '+JSON.stringify({enabled,count:stage.count,base:stage.base,last,incrementalCalls:result.incrementalCalls,incrementalTriangles:result.incrementalTriangles}));
  }finally{await context.close();}
 }
 const [a,b]=report.cases;
 assert.deepEqual(a.stage.build,b.stage.build);
 assert.equal(a.stage.scale,b.stage.scale);
 assert.equal(a.incrementalTriangles,b.incrementalTriangles,'Same visible fragment triangle count required');
 assert.ok(a.incrementalCalls>=90,'Baseline must actually draw ordinary debris');
 assert.ok(b.incrementalCalls<=a.incrementalCalls/4,'Expected at least 75% reduction in incremental fragment draws');
 assert.equal(report.errors.length,0,'Browser errors detected');
 report.reduction={individual:a.incrementalCalls,batched:b.incrementalCalls,saved:a.incrementalCalls-b.incrementalCalls};
 report.passed=true;console.log('DEBRIS_AB '+JSON.stringify(report.reduction));
}catch(e){report.passed=false;report.fatal=String(e);console.error(e);}
finally{if(browser)await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));}
if(!report.passed)process.exitCode=1;
