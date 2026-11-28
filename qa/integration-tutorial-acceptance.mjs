// Input-driven tutorial acceptance. Staged positioning is explicitly assisted;
// no forced training-step advancement, target removal, or direct success awards.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-tutorial-output';await mkdir(out,{recursive:true});
const report={commit:process.env.GITHUB_SHA||null,scope:'Real keyboard and mouse input; accelerated simulation; QA positioning for proximity objectives, no forced training success',checks:[],errors:[]};
let browser,page;
const evidence=()=>page.evaluate(()=>window.__DD_QA.trainingInputEvidence());
const advance=frames=>page.evaluate(n=>window.__DD_QA.advanceSimulation(n),frames);
const move=(x,y)=>page.evaluate(({x,y})=>{const q=window.__DD_QA;const r=q.move(x,y);if(!r.ok)throw Error(r.error);q.stepFrame(4,.05);},{x,y});
async function waitStep(step,limit=8){for(let i=0;i<limit;i++){const s=await evidence();if(s.training.step===step)return s;await advance(30);}throw Error('Expected step '+step+'; '+JSON.stringify(await evidence()));}
async function record(name,fn){const result=await fn();report.checks.push({name,result});console.log('PASS '+name+' '+JSON.stringify(result));}
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'});
 page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto(new URL('?qa=1&motion=1',process.argv[2]||'http://127.0.0.1:8765/').href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
 await page.locator('#start-training').click();
 await record('Actual movement input advances Flight Academy step 1',async()=>{
  await advance(120);const before=await evidence();assert.equal(before.training.step,1);
  await page.keyboard.down('KeyD');try{await advance(70);}finally{await page.keyboard.up('KeyD');}
  const after=await waitStep(2);assert.ok(after.training.flightDistance>=14);return {before,after};
 });
 await record('Aim at real practice meteor and fire using Space',async()=>{
  await move(-18,26);
  const before=await evidence();assert.equal(before.training.step,2);
  for(let i=0;i<8;i++){
   const s=await evidence();if(s.training.step!==2||!s.targets.some(t=>!t.buster))break;
   const target=s.targets.find(t=>!t.buster);
   assert.ok(target.screen[0]>0&&target.screen[0]<1280&&target.screen[1]>0&&target.screen[1]<720);
   await page.mouse.move(...target.screen);await page.keyboard.press('Space');await advance(30);
  }
  const after=await waitStep(3);assert.ok(after.shots>before.shots);return {before,after};
 });
 await record('Boost and directional input collide with moving buster target',async()=>{
  const s=await evidence(),t=s.targets.find(t=>t.buster);assert.ok(t);
  await move(t.position[0]+15,t.position[1]);
  await page.keyboard.down('KeyA');await page.keyboard.down('KeyF');
  try{await advance(45);}finally{await page.keyboard.up('KeyF');await page.keyboard.up('KeyA');}
  const after=await waitStep(4);assert.equal(after.busterRamCollided,true);return after;
 });
 await record('Proximity suppresses training roof fire via normal update',async()=>{
  await move(14,7);const after=await waitStep(5);assert.equal(after.training.mockHouseExtinguished,true);return after;
 });
 await record('Gas input disables mock cruiser and graduates to wave 1',async()=>{
  await move(-12,5);await advance(75);await page.keyboard.press('KeyF');
  const graduated=await waitStep(6);assert.equal(graduated.training.mockCruiserDisabled,true);
  for(let i=0;i<8&&(await evidence()).training.active;i++)await advance(30);
  const s=await page.evaluate(()=>window.__DD_QA.snap());const end=await evidence();
  assert.equal(end.training.active,false);assert.equal(s.wave,1);assert.ok(s.active&&!s.paused&&s.counts.meteors>0);
  const png=await page.evaluate(()=>{window.__DD_QA.renderFrame(null,0);return window.__DD_RENDERER.domElement.toDataURL('image/png').split(',')[1];});
  assert.ok(png.length>1000);await writeFile(out+'/graduated-campaign.png',Buffer.from(png,'base64'));return {graduated,end,wave:s.wave,meteors:s.counts.meteors};
 });
}catch(e){report.errors.push(String(e));if(page)try{report.failureEvidence=await evidence();}catch{}console.error(e);}
finally{report.passed=report.errors.length===0&&report.checks.length===5;await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('TUTORIAL_SUMMARY '+JSON.stringify(report));if(browser)await browser.close().catch(()=>{});process.exitCode=report.passed?0:1;}
