import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='park13-integration-output';await mkdir(out,{recursive:true});
const report={source:process.env.GITHUB_SHA,errors:[],runs:[]};
let browser;
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const enabled of [false,true]){
  const page=await browser.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});
  page.on('pageerror',e=>report.errors.push(String(e)));
  await page.goto('http://127.0.0.1:8765/?qa=1&motion=1&park13='+(enabled?1:0),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
  const state=await page.evaluate(()=>{
   const q=window.__DD_QA;return {expansion:q.park13ExpansionStats(),context:q.distantNeighborhoodStats(),parcels:q.northBroadModels().result.loadedCount,school:q.snap().renderVisibility.actualSchoolOverlayReady};
  });
  assert.equal(state.parcels,122);assert.ok(state.school);
  if(enabled){assert.equal(state.expansion.buildings,165);assert.equal(state.expansion.components,2893);assert.equal(state.expansion.triangles,44260);assert.equal(state.expansion.architectureDrawObjects,80);assert.ok(state.context.excludedByExpansion>0);}
  else{assert.equal(state.expansion,null);assert.equal(state.context.excludedByExpansion,0);}
  const positions=[[-185,42],[110,55],[360,70]];
  for(const [i,[x,y]] of positions.entries()){
   const png=await page.evaluate(({x,y,i})=>{const q=window.__DD_QA;if(i===0){q.start(1);q.toggleFreeFlight(true);}q.move(x,y);q.stepFrame(4,.05);q.renderFrame(null,0);return window.__DD_RENDERER.domElement.toDataURL('image/png').split(',')[1];},{x,y,i});
   assert.ok(png.length>1000);await writeFile(out+'/'+(enabled?'expansion':'baseline')+'-'+i+'.png',Buffer.from(png,'base64'));
  }
  report.runs.push({enabled,...state});await page.close();
 }
 assert.ok(report.runs[1].context.buildings<report.runs[0].context.buildings);
 assert.equal(report.errors.length,0);report.passed=true;
}catch(e){report.errors.push(String(e));console.error(e);report.passed=false;}
finally{if(browser)await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('PARK13_BROWSER '+JSON.stringify(report));}
if(!report.passed)process.exitCode=1;
