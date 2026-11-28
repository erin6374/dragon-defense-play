import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {pathToFileURL} from 'node:url';
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const out='park13-integration-output';await mkdir(out,{recursive:true});
const report={source:process.env.QA_SOURCE_SHA||process.env.GITHUB_SHA,backend:'SwiftShader',errors:[],runs:[]};
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
  assert.ok(state.context.proceduralCrossStreetCenters.length>0);assert.equal(state.context.proceduralCrossStreetOverlaps,0);
  if(enabled){assert.equal(state.expansion.buildings,165);assert.equal(state.expansion.components,2893);assert.equal(state.expansion.triangles,44260);assert.equal(state.expansion.architectureDrawObjects,80);assert.deepEqual(state.expansion.realmCounts,{roads:343,sidewalks:686,pedestrianPaths:51,campusSurfaces:78});assert.ok(state.context.excludedByExpansion>0);}
  else{assert.equal(state.expansion,null);assert.equal(state.context.excludedByExpansion,0);}
  const positions=[[-185,42],[110,55],[360,70]];
  for(const [i,[x,y]] of positions.entries()){
   const png=await page.evaluate(({x,y,i})=>{const q=window.__DD_QA;if(i===0){q.start(1);q.toggleFreeFlight(true);}q.move(x,y);q.stepFrame(4,.05);q.renderFrame(null,0);return window.__DD_RENDERER.domElement.toDataURL('image/png').split(',')[1];},{x,y,i});
   assert.ok(png.length>1000);await writeFile(out+'/'+(enabled?'expansion':'baseline')+'-'+i+'.png',Buffer.from(png,'base64'));
  }
  // Paired, deliberately aimed views of actual scene geometry. These
  // supplement the player-camera captures and are not visual approvals.
  const views=[
   ['north',-350,-115,145],['central',0,-115,145],
   ['south',345,-120,150],['campus',515,-135,125],
   ['street-seams',264,-169,75]
  ];
  state.visualViews=[];
  for(const [name,x,z,distance] of views){
   const capture=await page.evaluate(async({x,z,distance})=>{
    const {PerspectiveCamera}=await import('/vendor/three/build/three.module.js');
    const q=window.__DD_QA,cam=new PerspectiveCamera(50,innerWidth/innerHeight,.1,2500);
    cam.position.set(x-distance*.40,distance*.75,z+distance*.7);
    cam.lookAt(x,3,z);cam.updateMatrixWorld(true);
    q.renderFrame(cam,0);
    return {png:window.__DD_RENDERER.domElement.toDataURL('image/png').split(',')[1],camera:cam.position.toArray(),target:[x,3,z]};
   },{x,z,distance});
   assert.ok(capture.png.length>1000);
   const file=(enabled?'expansion':'baseline')+'-view-'+name+'.png';
   await writeFile(out+'/'+file,Buffer.from(capture.png,'base64'));
   state.visualViews.push({name,file,camera:capture.camera,target:capture.target});
  }
  if(enabled){
   state.damage=await page.evaluate(()=>{
    const q=window.__DD_QA;
    let hit=null;
    for(let x=-425;x<620&&!hit;x+=2)for(let z=-160;z<-103&&!hit;z+=2)hit=q.park13TargetAt(x,z);
    if(!hit)throw Error('No expansion target');
    const start={x:hit.x,y:hit.y+40,z:hit.z},end={x:hit.x,y:0,z:hit.z};
    const first=q.park13TraceImpact(start,end,4).result;
    const second=q.park13TraceImpact(start,end,4).result;
    const damaged=q.park13ExpansionStats();
    q.repairAllBuildings();
    const repaired=q.park13ExpansionStats(),roof=q.park13TargetAt(hit.x,hit.z);
    return {hit,first,second,damaged,repaired,roof};
   });
   const d=state.damage;assert.equal(d.first.kind,'expansion');assert.equal(d.first.id,d.hit.id);
   assert.ok(d.first.after>0&&d.first.after<=.15);
   // A second meteor aimed through a new hole can hit the remaining shell
   // or floor deck, or pass to ground if there is no surviving surface.
   if(d.second.kind==='expansion'){
    assert.equal(d.second.id,d.hit.id);
    assert.ok(d.second.after>d.first.after&&d.second.after-d.first.after<=.1500001);
    assert.equal(d.second.healthBefore,d.second.healthAfter);
   }else assert.equal(d.second.kind,'ground');
   assert.equal(d.first.healthBefore,d.first.healthAfter);assert.equal(d.first.hpBefore,d.first.hpAfter);
   assert.equal(d.damaged.damaged,1);assert.equal(d.repaired.damaged,0);assert.equal(d.roof.y,d.hit.y);
   assert.ok(d.damaged.fragments.active>0);assert.equal(d.damaged.fragments.drawObjects,1);assert.equal(d.repaired.fragments.active,0);assert.equal(d.repaired.fragments.drawObjects,0);
   // Exercise a real spawned meteor through the fixed-step game loop, not
   // just the QA helper that calls the collision and damage routines directly.
   state.liveMeteor=await page.evaluate(hit=>{
    const q=window.__DD_QA;
    q.toggleDragon(false);
    q.repairAllBuildings();
    const before=q.park13TargetAt(hit.x,hit.z);
    const healthBefore=q.neighborhoodHealth();
    const targetY=Math.max(.7,before.y-15);
    q.spawnTestMeteorAt(hit.x,targetY,hit.z,4,'iron');
    const spawned=q.meteorsList().length;
    let frames=0,after=before;
    while(frames<60&&after?.damage===0){
     q.stepFrame(1,.05);frames++;
     after=q.park13TargetAt(hit.x,hit.z);
    }
    const damaged=q.park13ExpansionStats();
    const healthAfter=q.neighborhoodHealth();
    // Repair must cancel both a live projectile and delayed sandbox barrages.
    q.spawnTestMeteorAt(hit.x,targetY,hit.z,4,'iron');
    q.spawnMeteorBarrage(4,hit.x,hit.z);
    q.repairAllBuildings();
    return {before,after,spawned,frames,damaged,healthBefore,healthAfter,
     repaired:q.park13TargetAt(hit.x,hit.z),remaining:q.meteorsList().length};
   },d.hit);
   const live=state.liveMeteor;
   assert.ok(live.spawned>0);assert.ok(live.frames>0&&live.frames<=60);
   assert.equal(live.after?.id,live.before.id);assert.ok(live.after.damage>0&&live.after.damage<=.1500001);
   assert.equal(live.damaged.damaged,1);assert.equal(live.healthBefore,live.healthAfter);
   assert.ok(live.damaged.fragments.active>0);assert.ok(live.damaged.fragments.active<=live.damaged.fragments.capacity);
   assert.equal(live.repaired.damage,0);assert.equal(live.repaired.y,live.before.y);assert.equal(live.remaining,0);
   await page.waitForTimeout(900);
   state.afterRepairDelay=await page.evaluate(()=>{
    const q=window.__DD_QA;q.stepFrame(2,.05);
    return {meteors:q.meteorsList().length,damaged:q.park13ExpansionStats().damaged,fragments:q.park13ExpansionStats().fragments.active};
   });
   assert.deepEqual(state.afterRepairDelay,{meteors:0,damaged:0,fragments:0});
   // Capture the same parcel intact, breached and repaired with a close
   // inspection camera. Use a residential-scale source target for floors.
   state.damageViews=await page.evaluate(async()=>{
    const q=window.__DD_QA;
    const {PerspectiveCamera}=await import('/vendor/three/build/three.module.js');
    const records=await fetch('/broad-street/park13-integration/park13-GIS-precise-20261127.json').then(r=>r.json());
    let hit=null;
    for(const record of records.records){
     const points=record.polys.flat(2),xs=points.map(p=>p[0]),zs=points.map(p=>p[1]),w=Math.max(...xs)-Math.min(...xs),d=Math.max(...zs)-Math.min(...zs);
     if(w<3||w>8||d<7||d>20||record.height<6||record.height>13)continue;
     const x=(Math.max(...xs)+Math.min(...xs))/2+255.88,z=(Math.max(...zs)+Math.min(...zs))/2+22.06;
     const target=q.park13TargetAt(x,z);if(target?.id===record.id){hit=target;break;}
    }
    if(!hit)throw Error('No residential inspection target');
    const cam=new PerspectiveCamera(45,innerWidth/innerHeight,.1,2500);
    cam.position.set(hit.x+15,hit.y+16,hit.z+23);cam.lookAt(hit.x,hit.y*.5,hit.z);cam.updateMatrixWorld(true);
    const capture=()=>{q.renderFrame(cam,0);return window.__DD_RENDERER.domElement.toDataURL('image/png').split(',')[1];};
    q.repairAllBuildings();
    const intact=capture();
    const start={x:hit.x,y:hit.y+30,z:hit.z},end={x:hit.x,y:0,z:hit.z};
    const impact=q.park13TraceImpact(start,end,4).result;
    const damaged=capture(),stats=q.park13ExpansionStats();
    q.repairAllBuildings();const repaired=capture();
    return {hit,impact,stats,frames:{intact,damaged,repaired},restored:q.park13ExpansionStats()};
   });
   const dv=state.damageViews;
   assert.equal(dv.impact.id,dv.hit.id);assert.ok(dv.stats.breached>0&&dv.stats.interiorTriangles>0);
   assert.equal(dv.restored.breached,0);assert.equal(dv.restored.fragments.active,0);
   for(const [name,png] of Object.entries(dv.frames)){assert.ok(png.length>1000);await writeFile(out+'/expansion-damage-'+name+'.png',Buffer.from(png,'base64'));}
   dv.files=Object.keys(dv.frames).map(name=>'expansion-damage-'+name+'.png');delete dv.frames;
  }
  report.runs.push({enabled,...state});await page.close();
 }
 assert.ok(report.runs[1].context.buildings<report.runs[0].context.buildings);
 assert.equal(report.errors.length,0);report.passed=true;
}catch(e){report.errors.push(String(e));console.error(e);report.passed=false;}
finally{if(browser)await browser.close();await writeFile(out+'/report.json',JSON.stringify(report,null,2));console.log('PARK13_BROWSER '+JSON.stringify(report));}
if(!report.passed)process.exitCode=1;
