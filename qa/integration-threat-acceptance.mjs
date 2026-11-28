// Actual browser raster/material evidence for threat readability.
// Staged production objects, not a full playthrough or an interceptability proof by itself.
import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='integration-threat-output';await mkdir(out,{recursive:true});
const report={commit:process.env.GITHUB_SHA||null,scope:'Actual production radar canvas and meteor assets, staged ordinary campaign; deterministic render; no native-device claim',checks:[],errors:[]};
let browser,page;
const save=(name,png)=>writeFile(out+'/'+name+'.png',Buffer.from(png.split(',').at(-1),'base64'));
const check=(name,fn)=>{try{const result=fn();report.checks.push({name,pass:true,result});console.log('PASS '+name);}catch(e){report.checks.push({name,pass:false,error:String(e)});console.error('FAIL '+name,e);}};
try{
 browser=await chromium.launch({channel:'chrome',args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1,serviceWorkers:'block'});
 page.on('pageerror',e=>report.errors.push(String(e)));
 await page.goto(new URL('?qa=1&motion=1',process.argv[2]||'http://127.0.0.1:8765/').href,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>window.__DD_QA?.snap().renderVisibility.actualSchoolOverlayReady,undefined,{timeout:180000});
 const evidence=await page.evaluate(()=>{
  const q=window.__DD_QA,start=q.start(6);if(!start.ok)throw Error(start.error);
  const canvas=document.getElementById('incoming-radar'),ctx=canvas.getContext('2d'),texts=[];
  const original=ctx.fillText;
  ctx.fillText=function(text,...args){texts.push(String(text));return original.call(this,text,...args);};
  let result;
  try{result=q.stageThreatReadability();}finally{ctx.fillText=original;}
  if(!result.ok)throw Error(result.error);
  const v=result.result,rgba=ctx.getImageData(0,0,canvas.width,canvas.height).data;
  const colors={orange:[255,122,50],blue:[96,165,250],red:[255,82,82],highlight:[255,242,206]};
  const pixels=Object.fromEntries(Object.entries(colors).map(([name,[r,g,b]])=>{
   let count=0;for(let i=0;i<rgba.length;i+=4)if(Math.abs(rgba[i]-r)<=3&&Math.abs(rgba[i+1]-g)<=3&&Math.abs(rgba[i+2]-b)<=3&&rgba[i+3]>200)count++;
   return [name,count];
  }));
  const legend=document.getElementById('meteor-zone-key'),rect=legend.getBoundingClientRect();
  const legendData={text:legend.innerText,visible:rect.width>0&&rect.height>0&&getComputedStyle(legend).visibility!=='hidden'};
  q.renderFrame(null,0);
  const frame=window.__DD_RENDERER.domElement.toDataURL('image/png');
  return {v,texts,pixels,legend:legendData,frame};
 });
 const {v,texts,pixels,legend,frame}=evidence;const radar=v.radar;delete v.radar;
 await save('01-radar',radar);await save('02-meteor-scene',frame);
 check('Ordinary campaign real radar draws school warning and ETA',()=>{
  assert.equal(v.wave,6);assert.equal(v.warning.label,'SCHOOL');assert.ok(Math.abs(v.warning.eta-2.8)<.01);
  assert.ok(texts.includes('SCHOOL IMPACT'));assert.ok(texts.includes('3s'));
  assert.ok(texts.some(t=>t.includes('POWERUP')&&t.includes('HUNTER')));
  return {warning:v.warning,texts};
 });
 check('Radar canvas contains actual orange, blue and red threat pixels',()=>{
  assert.ok(pixels.orange>=4,'No ordinary threat pixels');assert.ok(pixels.blue>=4,'No pickup pixels');assert.ok(pixels.red>=4,'No hunter pixels');
  return pixels;
 });
 check('Foreground combat threats use solid meshes and distinct pickup asset',()=>{
  assert.equal(v.foreground.length,3);assert.ok(v.foreground.every(m=>m.solid));
  assert.ok(v.foreground.some(m=>m.kind==='molten'&&m.corona));
  assert.ok(v.foreground.some(m=>m.pickup==='blue_fireball'&&m.corona));
  assert.ok(v.foreground.some(m=>m.hunter));
  return v.foreground;
 });
 check('Actual distant sprite is separate from combat list and has cool palette',()=>{
  assert.equal(v.distant.sprite,true);assert.equal(v.distant.parentIsSkyline,true);assert.equal(v.distant.inCombatList,false);
  assert.equal(v.distant.normal.color,'b8d0e8');assert.equal(v.distant.escalated.color,'e0edff');
  const [r,g,b,a]=v.distant.corePixel;assert.ok(b>g&&g>r&&a>0,'Distant texture core is not cool blue-gray');
  return v.distant;
 });
 check('Defense-zone legend and retained image evidence',()=>{
  assert.ok(legend.visible);assert.match(legend.text,/blue-gray streaks/);assert.match(legend.text,/bright rocks/);
  assert.ok(radar.length>1000&&frame.length>1000);return legend;
 });
}catch(e){report.errors.push(String(e));}
finally{
 report.passed=report.errors.length===0&&report.checks.length===5&&report.checks.every(c=>c.pass);
 await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('THREAT_SUMMARY '+JSON.stringify(report));
 if(browser)await browser.close().catch(()=>{});process.exitCode=report.passed?0:1;
}
