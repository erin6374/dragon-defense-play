// Production camera review with real browser rendering, staged tutorial positions.
// Motion QA uses deterministic render steps, not native timing or an unassisted walkthrough.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-camera-output';await mkdir(out,{recursive:true});
const report={commit:process.env.GITHUB_SHA||null,scope:'Actual production camera and UI at staged tutorial objectives; deterministic render steps; not native FPS or unassisted tutorial completion',checks:[],errors:[]};
let browser,page;
async function check(name,fn){
 try{const result=await fn();report.checks.push({name,pass:true,result});console.log('PASS '+name);}
 catch(e){report.checks.push({name,pass:false,error:String(e)});console.error('FAIL '+name,e);await page.screenshot({path:out+'/failed-'+report.checks.length+'.png'}).catch(()=>{});}
}
const state=()=>page.evaluate(()=>{const q=window.__DD_QA,c=window.__DD_CAMERA,s=q.snap();return {training:q.trainingStats(),active:s.active,paused:s.paused,wave:s.wave,dragon:s.dragon,camera:{position:c.position.toArray(),rotation:c.rotation.toArray().slice(0,3),zoom:c.zoom,aspect:c.aspect}};});
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'});
 page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto(new URL('?qa=1&motion=1',process.argv[2]||'http://127.0.0.1:8765/').href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
 await check('Flight Academy launch from actual start menu',async()=>{
  await page.locator('#start-training').click();
  await page.evaluate(()=>window.__DD_QA.stepFrame(2,.05));
  const v=await state();assert.equal(v.training.active,true);assert.equal(v.training.step,1);assert.ok(v.active&&!v.paused);
  assert.ok(await page.locator('#dd-training-banner').isVisible());
  await page.screenshot({path:out+'/01-academy-opening.png'});return v;
 });
 for(const viewport of [{width:1280,height:720},{width:844,height:390},{width:390,height:844}]){
  await page.setViewportSize(viewport);
  for(const step of [{n:2,x:-6,y:26,z:15,px:-20,py:20},{n:4,x:14,y:7,z:15,px:0,py:18},{n:5,x:-12,y:4.5,z:15.5,px:6,py:17}]){
   const key=viewport.width+'x'+viewport.height+'-step'+step.n;
   await check('Camera frames Paulo and nearby objective '+key,async()=>{
    const v=await page.evaluate(step=>{
     const q=window.__DD_QA,c=window.__DD_CAMERA,T=window.__DD_THREE;
     q.advanceTrainingStep(step.n);q.move(step.px,step.py);
     q.stepFrame(12,.05);
     const s=q.snap(),p=new T.Vector3(s.dragon.x,s.dragon.y,s.dragon.z).project(c),o=new T.Vector3(step.x,step.y,step.z).project(c);
     const banner=document.getElementById('dd-training-banner').getBoundingClientRect();
     const point=a=>({x:a.x,y:a.y,z:a.z,pixelX:(a.x+1)*innerWidth/2,pixelY:(1-a.y)*innerHeight/2});
     return {training:q.trainingStats(),dragon:point(p),objective:point(o),zoom:c.zoom,aspect:c.aspect,banner:{left:banner.left,right:banner.right,top:banner.top,bottom:banner.bottom},camera:c.position.toArray()};
    },step);
    await page.screenshot({path:out+'/'+key+'.png'});
    assert.equal(v.training.step,step.n);assert.equal(v.training.active,true);
    for(const [label,p] of [['dragon',v.dragon],['objective',v.objective]]){
     assert.ok([p.x,p.y,p.z].every(Number.isFinite),label+' nonfinite projection');
     assert.ok(Math.abs(p.x)<1&&Math.abs(p.y)<1&&p.z>=-1&&p.z<=1,label+' outside viewport '+JSON.stringify(p));
     assert.ok(!(p.pixelX>=v.banner.left&&p.pixelX<=v.banner.right&&p.pixelY>=v.banner.top&&p.pixelY<=v.banner.bottom),label+' center behind tutorial banner '+JSON.stringify(p));
    }
    assert.ok(v.zoom>=.92&&v.zoom<=1.15,'unexpected camera zoom '+v.zoom);
    return v;
   });
  }
 }
 await page.setViewportSize({width:1280,height:720});
 await check('Real Tab skip restores street campaign camera and hides tutorial overlay',async()=>{
  await page.keyboard.press('Tab');
  await page.evaluate(()=>window.__DD_QA.stepFrame(12,.05));
  const v=await state();assert.equal(v.training.active,false);assert.equal(v.wave,1);assert.ok(v.active&&!v.paused);
  assert.equal(await page.locator('#dd-training-banner').isVisible(),false);
  assert.ok(v.camera.position.every(Number.isFinite));
  await page.screenshot({path:out+'/02-campaign-restored.png'});return v;
 });
}catch(e){report.errors.push(String(e));}
finally{
 report.passed=report.errors.length===0&&report.checks.length===11&&report.checks.every(c=>c.pass);
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('CAMERA_SUMMARY '+JSON.stringify(report));
 if(browser)await browser.close().catch(()=>{});process.exitCode=report.passed?0:1;
}
