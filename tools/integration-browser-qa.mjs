// Real browser QA for the integration preview. Run from any directory.
import {createServer} from 'node:http';
import {readFile,stat,mkdir,writeFile} from 'node:fs/promises';
import {createReadStream} from 'node:fs';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {resolve,extname,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
const root=resolve(fileURLToPath(new URL('../',import.meta.url)));
const out=resolve(root,'integration-qa-results',new Date().toISOString().replace(/[:.]/g,'-'));
await mkdir(out,{recursive:true});
const report={started:new Date().toISOString(),commit:null,checks:[],errors:[],warnings:[],benchmark:null,releaseCertified:false};
try{report.commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch{}
const save=()=>writeFile(resolve(out,'report.json'),JSON.stringify(report,null,2));
const timeoutMs=Number(process.env.DD_QA_TIMEOUT_MS||240000);
if(!Number.isFinite(timeoutMs)||timeoutMs<60000||timeoutMs>1800000)throw Error('DD_QA_TIMEOUT_MS must be 60000–1800000');
const watchdog=setTimeout(()=>{report.errors.push('Overall QA timeout: browser or renderer stopped responding.');report.passed=false;report.finished=new Date().toISOString();save().finally(()=>process.exit(2));},timeoutMs);
const mime={'.bin':'application/octet-stream','.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.webp':'image/webp','.wasm':'application/wasm','.woff2':'font/woff2','.ogg':'audio/ogg','.mp3':'audio/mpeg','.wav':'audio/wav'};
const server=createServer(async(req,res)=>{
 try{
  const raw=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  let path=resolve(root,'.'+raw);
  if(path!==root&&!path.startsWith(root.endsWith(sep)?root:root+sep)){res.writeHead(403).end();return;}
  if((await stat(path)).isDirectory())path=resolve(path,'index.html');
  const info=await stat(path);
  res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream','Content-Length':info.size,'Cache-Control':'no-store'});
  createReadStream(path).pipe(res);
 }catch{res.writeHead(404).end();}
});
let browser,page;
const assert=(ok,msg)=>{if(!ok)throw Error(msg);};
const check=async(name,fn)=>{
 try{const details=await fn();report.checks.push({name,pass:true,details});console.log('PASS '+name);if(name.includes('performance sample'))console.log('BENCHMARK_SUMMARY '+JSON.stringify(details));}
 catch(e){report.checks.push({name,pass:false,error:String(e)});console.error('FAIL '+name+': '+e);}
 await save();
};
try{
 let playwright;
 if(process.env.PLAYWRIGHT_MODULE)playwright=await import(pathToFileURL(resolve(process.env.PLAYWRIGHT_MODULE)).href);
 else{try{playwright=await import('./.integration-qa-runtime/node_modules/playwright/index.mjs');}
 catch{playwright=await import('playwright');}}
 const headless=process.argv.includes('--headless');
 const software=process.argv.includes('--software');
 const executablePath=process.env.DD_QA_CHROMIUM;
 const launch={headless,executablePath,args:software?['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[]};
 const channel=process.env.QA_BROWSER_CHANNEL||'msedge';
 try{browser=await playwright.chromium.launch(executablePath?launch:{...launch,channel});}
 catch(error){if(process.env.QA_BROWSER_CHANNEL||executablePath)throw error;browser=await playwright.chromium.launch(launch);}
 report.browser=browser.version();report.headless=headless;report.softwareRequested=software;
 await new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',yes);});
 const url='http://127.0.0.1:'+server.address().port+'/?qa=1&benchmark=1';
 report.url=url;
 page=await browser.newPage({viewport:{width:software?640:1280,height:software?360:800}});
 page.on('pageerror',e=>{if(report.errors.length<100)report.errors.push(String(e));});
 page.on('console',msg=>{const t=msg.text();if(/shader error|shader compilation|program not valid|GL_INVALID_OPERATION|WebGL context lost/i.test(t)){if(report.errors.length<100)report.errors.push(t);}else if(msg.type()==='error'&&report.warnings.length<100)report.warnings.push(t);});
 page.on('response',r=>{if(r.status()<400)return;const url=r.url(),msg=r.status()+' '+url;const critical=/\.(?:m?js|fbx|glb|gltf|wasm|bin)(?:\?|$)|\/broad-street\/mapped-data\.json(?:\?|$)/i.test(url);const list=critical?report.errors:report.warnings;if(list.length<100)list.push(msg);});
 await page.goto(url,{waitUntil:'domcontentloaded',timeout:45000});
 await page.waitForFunction(()=>window.__DD_QA&&window.__DD_BOOT_OK,{},{timeout:90000});
 await page.bringToFront();
 await page.waitForFunction(()=>window.__DD_QA.snap().renderVisibility.actualSchoolOverlayReady,{},{timeout:90000,polling:500});
 report.build=await page.evaluate(()=>window.__DD_BUILD_INFO);
 report.renderer=await page.evaluate(()=>{const gl=window.__DD_RENDERER.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),vendor:ext?gl.getParameter(ext.UNMASKED_VENDOR_WEBGL):gl.getParameter(gl.VENDOR)};});
 await save();
 await check('Boot, FBX-derived school play mesh, and all 122 mapped buildings',async()=>{
  const v=await page.evaluate(()=>({snapshot:window.__DD_QA.snap(),slots:window.__DD_QA.getBuildingSlots()}));
  assert(v.snapshot.renderVisibility.actualSchoolOverlayReady,'School play mesh absent');
  assert(!v.snapshot.renderVisibility.fbxRowhouses.left&&!v.snapshot.renderVisibility.fbxRowhouses.right,'Legacy FBX flank visible');
  assert(v.slots.length===122,'Expected 122 imported building slots, got '+v.slots.length);
  assert(new Set(v.slots.map(s=>s.id)).size===122,'Duplicate building slots');
  assert(v.slots.every(s=>s.status==='loaded'),'Missing building model');
  assert(v.slots.every(s=>s.worldBounds&&Object.values(s.worldBounds).every(Number.isFinite)),'Invalid imported bounds');
  const audit=v.snapshot.sourceSchool.interiorAudit;
  const school=await page.evaluate(()=>window.__DD_QA.actualSchoolGeometry().result?.details);
  assert(audit?.componentIndex?.components>0,'Source school impact inventory absent');
  assert(school?.outputTriangles>0&&school.outputTriangles<250000,'School render mesh exceeds its budget');
  assert(audit.renderSimplification?.floors?.kept>0&&audit.renderSimplification?.walls?.kept>0,
   'Source interior walls or floors missing');
  const bootAssets=await page.evaluate(()=>performance.getEntriesByType('resource').map(r=>r.name));
  assert(bootAssets.some(url=>url.endsWith('/assets/tech-freire-play-mesh-v1.bin')),'Play mesh request missing');
  assert(!bootAssets.some(url=>url.endsWith('/assets/tech-freire-original.fbx')||url.endsWith('/manifest.webmanifest')),
   'Game boot requested an unnecessary source FBX or manifest');
  await page.screenshot({path:resolve(out,'01-architecture.png')});
  return {count:v.slots.length,build:v.snapshot.build,school:v.snapshot.renderVisibility.schoolModelCalibration,interiorAudit:audit};
 });
 await check('Start sandbox and keyboard movement',async()=>{
  await page.evaluate(()=>{window.startSandboxDirect();window.__DD_SANDBOX.setDragonEnabled(true);window.__DD_SANDBOX.setSfxMuted(true);window.__DD_SANDBOX.setMusicMuted(true);});
  const before=await page.evaluate(()=>window.__DD_QA.snap().dragon);
  await page.keyboard.down('ArrowRight');await page.waitForTimeout(900);await page.keyboard.up('ArrowRight');
  const after=await page.evaluate(()=>window.__DD_QA.snap().dragon);
  assert(Math.abs(after.x-before.x)>.1,'Dragon did not move');
  return {before,after};
 });
 await check('Single parcel hit does not damage neighbors',async()=>{
  const result=await page.evaluate(async()=>{
   const {containsParcel}=await import('/src/simulation/viewer-parcels.js');
   const q=window.__DD_QA;q.repairAllBuildings();
   const city=q.getCity(),list=city.buildings.filter(b=>b.viewerParcel);
   let target=null;
   for(const b of list.filter(b=>!b.background&&b.w>4&&b.d>4&&Math.abs(b.x)>25)){
    for(let u=1;u<10&&!target;u++)for(let v=1;v<10&&!target;v++){
     const x=b.x-b.w/2+b.w*u/10,z=b.z-b.d/2+b.d*v/10;
     if(containsParcel(b,x,z)&&!list.some(p=>p!==b&&containsParcel(p,x,z)))target={b,x,z};
    }
    if(target)break;
   }
   if(!target)throw Error('No exclusive frontage sample');
   const {b,x,z}=target,before=list.map(x=>x.damage);
   q.verifyMeteorImpact(x,Math.min(5,b.h*.7),z,2.0);
   const model=q.northBroadModels().result?.models?.find(e=>e.id===b.id);
   const damaged=list.filter((b,i)=>b.damage>before[i]+.0001).map(b=>b.id);
   q.repairAllBuildings();
   const repaired=q.northBroadModels().result?.models?.find(e=>e.id===b.id);
   return {target:b.id,damaged,localizedStrikes:model?.localizedStrikes??0,repairedDamage:repaired?.damage,repairedStrikes:repaired?.localizedStrikes};
  });
  assert(result.damaged.length===1&&result.damaged[0]===result.target,'Incorrect direct-hit ownership: '+JSON.stringify(result));
  assert(result.localizedStrikes>0&&result.repairedDamage===0&&result.repairedStrikes===0,'Localized mask did not apply or clear: '+JSON.stringify(result));
  return result;
 });
 await check('School health damage is bounded',async()=>{
  const v=await page.evaluate(()=>{const q=window.__DD_QA;q.repairAllBuildings();q.verifyMeteorImpact(0,14,-16,3.6);return q.getSchoolDamage();});
  assert(v>=.049&&v<=.150001,'Unexpected school damage: '+v);return {damage:v};
 });
 await check('Subway derailment, flood, exit signs and camera switching',async()=>{
  const before=await page.evaluate(()=>{const q=window.__DD_QA;q.repairAllBuildings();q.runPresetSubway();return {derailed:q.isSubwayTrainDerailed(),water:q.hasFloodedSubwayWater(),exits:q.getEmergencyExitSignsCount(),flood:q.getSubwayFloodLevel(),camera:q.setSubwayCam(true)};});
  assert(before.derailed&&before.water&&before.exits>=2&&before.camera,'Incomplete subway features');
  const after=await page.evaluate(()=>{const q=window.__DD_QA;q.advanceSimulation(120);return q.getSubwayFloodLevel();});assert(after>before.flood,'Flood level did not rise');
  await page.screenshot({path:resolve(out,'02-subway.png')});
  const switched=await page.evaluate(()=>{const q=window.__DD_QA;q.setBasementCam(true);return q.isBasementCamActive()&&!q.isSubwayCamActive();});
  assert(switched,'Camera state conflict');await page.screenshot({path:resolve(out,'03-basement.png')});
  return {before,after};
 });
 await check('Independent water-main rupture and cleanup',async()=>{
  const v=await page.evaluate(()=>{const q=window.__DD_QA;q.repairAllBuildings();q.runPresetWaterMain();return {water:q.hasWaterMainGeyser(),puddle:q.hasAsphaltWaterPuddle(),subway:q.getSubwayCarsCount(),activeHoles:q.getCraterUniforms().filter(h=>h.active>0).length};});
  assert(v.water&&v.puddle&&v.subway===0&&v.activeHoles===0,'Water-only rupture created subway or road hole');
  await page.screenshot({path:resolve(out,'04-water-main.png')});
  await page.evaluate(()=>window.__DD_QA.repairAllBuildings());
  assert(await page.evaluate(()=>window.__DD_QA.getCraters().length===0&&!window.__DD_QA.isSubwayCamActive()&&!window.__DD_QA.isBasementCamActive()),'Repair did not reset crater/camera');
  return v;
 });
 await check('Explicit emergency dispatch',async()=>{
  const v=await page.evaluate(()=>{const q=window.__DD_QA;return ['fireTruck','police','ambulance','bus'].map((type,i)=>{const c=q.spawnCar(-70+i*15,10,1,type);return {type,roles:['fireTruck','police','ambulance','bus'].filter(k=>c[k])};});});
  assert(v.every(c=>c.roles.length===1&&c.roles[0]===c.type),'Wrong dispatched role: '+JSON.stringify(v));return v;
 });
 await check('30-second sustained bombardment performance sample',async()=>{
  await page.evaluate(()=>{const q=window.__DD_QA;q.repairAllBuildings();q.setTrafficEnabled(true);q.setPedestriansEnabled(true);window.__DD_BENCHMARK.start('integration-bombardment');});
  for(let i=0;i<6;i++){
   await page.evaluate(i=>{const q=window.__DD_QA;for(const [x,z] of [[0,-16],[-30,16],[30,16]])q.spawnTestMeteorAt(x,8,z,2.4+(i%3)*.6,'iron');},i);
   await page.waitForTimeout(5000);
  }
  report.benchmark=await page.evaluate(()=>window.__DD_BENCHMARK.stop());
  await save();
  assert(report.benchmark.frames>0,'No rendered frames');
  assert(!report.benchmark.samples.some(s=>s.contextLost),'WebGL context lost');
  assert(report.benchmark.durationSec>=29,'Benchmark shorter than intended');
  assert(!report.benchmark.samples.some(s=>!Number.isFinite(s.frameMs)||!Number.isFinite(s.simMs)||!Number.isFinite(s.renderMs)),'Invalid frame timings');
  report.performanceAssessment={hardwareRequired:true,softwareRequested:software,focusedStalls1000:report.benchmark.focusedStalls1000,stalls500:report.benchmark.stalls500,notes:'Sample only; not a full campaign or hardware certification.'};
  await page.screenshot({path:resolve(out,'05-bombardment.png')});
  return {fps:report.benchmark.fps,p95FrameMs:report.benchmark.p95FrameMs,maxFrameMs:report.benchmark.maxFrameMs,stalls500:report.benchmark.stalls500};
 });
 await check('Exit sandbox to fresh playable campaign',async()=>{
  const v=await page.evaluate(()=>{const q=window.__DD_QA;q.toggleFreeFlight(false);return q.snap();});
  assert(v.active&&!v.campaign.freeFlightMode&&v.campaign.dragonEnabled&&v.hp===100&&v.campaign.remaining>0,'Defense session did not restart cleanly');
  await page.waitForTimeout(2500);
  await page.screenshot({path:resolve(out,'06-defense.png')});
  return v.campaign;
 });
}catch(e){report.errors.push(String(e));}
finally{
 report.finished=new Date().toISOString();
 report.passed=report.errors.length===0&&report.checks.length===9&&report.checks.every(c=>c.pass);
 console.log('QA_SUMMARY '+JSON.stringify({commit:report.commit,build:report.build,renderer:report.renderer,passed:report.passed,checks:report.checks.map(c=>({name:c.name,pass:c.pass,error:c.error})),errors:report.errors}));
 await save();console.log('Report: '+resolve(out,'report.json'));
 if(browser)await browser.close().catch(()=>{});
 server.close();clearTimeout(watchdog);process.exitCode=report.passed?0:1;
}
