import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='qa-output/cinematic',report={sha:execFileSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).trim(),views:[],errors:[]};
await mkdir(out,{recursive:true});
let browser;
try{
 assert.ok(!process.env.EXPECTED_HEAD_SHA||report.sha===process.env.EXPECTED_HEAD_SHA);
 browser=await chromium.launch({channel:process.env.QA_BROWSER_CHANNEL,executablePath:process.env.QA_BROWSER_EXECUTABLE,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 const page=await browser.newPage({viewport:{width:1280,height:720},serviceWorkers:'block'});
 page.on('pageerror',e=>report.errors.push(String(e)));
 page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text());});
 await page.addInitScript(()=>{let seed=1221237;Math.random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296);});
 await page.goto('http://127.0.0.1:8765/?qa=1&motion=1&hud=cinematic');
 await page.waitForFunction(()=>window.__DD_CINEMATIC_REVIEW&&window.__DD_QA.snap().renderVisibility.actualSchoolOverlayReady,null,{timeout:90000});
 // Full material/shadow preset is intentional: the gameplay motion suite also
 // retains its separate mobile-preset performance/effect coverage.
 await page.locator('#graphics').selectOption('cinematic');
 for(const [name,wave,x] of [['day',1,0],['dusk',4,0],['night',7,0],['left',4,-75],['right',4,75]]){
  const state=await page.evaluate(([w,x])=>window.__DD_CINEMATIC_REVIEW.stage(w,x),[wave,x]);
  await page.evaluate(()=>window.__DD_CINEMATIC_REVIEW.frame());
  const {png,...metrics}=await page.evaluate(()=>window.__DD_CINEMATIC_REVIEW.frame());
  assert.ok(metrics.schoolReady&&metrics.lighting.materials>10);
  assert.equal(metrics.trees,6);assert.equal(metrics.lighting.extraFramePasses,0);
  await writeFile(`${out}/${name}.png`,Buffer.from(png,'base64'));
  report.views.push({name,...state,...metrics});
 }
 const day=report.views.find(v=>v.name==='day'),night=report.views.find(v=>v.name==='night');
 assert.ok(night.sun<day.sun*.3&&night.ambient<day.ambient*.65,'night illumination is materially darker than daylight');
 assert.deepEqual(report.errors,[]);
}catch(error){report.errors.push(String(error));process.exitCode=1;}
finally{await writeFile(`${out}/report.json`,JSON.stringify(report,null,2));await browser?.close();}
