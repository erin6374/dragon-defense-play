// Run from repository root: node tests/integration-preview-regressions.mjs
// Deterministic data and logic tests; no WebGL or browser is required.
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const root=new URL('../',import.meta.url);
const read=path=>readFileSync(new URL(path,root),'utf8');
const load=(path,params={},exports=[])=>{
 const source=read(path).replace(/^\uFEFF/,'').replace(/^import .*;\s*$/gm,'').replace(/^export /gm,'').replace(/import\.meta\.url/g,JSON.stringify(root.href));
 return new Function(...Object.keys(params),source+'\nreturn {'+exports.join(',')+'}')( ...Object.values(params));
};
let count=0;
const test=(name,fn)=>{fn();count++;console.log('PASS '+name);};
const district=load('broad-street/district.js',{},['buildings','roads']);
const grid=load('broad-street/broad-street-grid-data.mjs',{},['JUNCTIONS','curbAt','BROAD_EXTENTS']);
const parcels=load('src/simulation/viewer-parcels.js',{buildings:district.buildings},['viewerParcels','containsParcel','VIEWER_TO_GAME_X','VIEWER_TO_GAME_Z']);
const roads=load('src/simulation/road-corridors.js',{...grid,...parcels},['CROSS_STREETS','CROSS_STREET_X','BROAD_LANES','BROAD_X','isBroadRoad']);
const list=parcels.viewerParcels(JSON.parse(read('broad-street/mapped-data.json')).rows);
test('Unique valid parcel inventory',()=>{assert.equal(new Set(list.map(p=>p.id)).size,list.length);assert.ok(list.length>=122);assert.ok(list.every(p=>p.w>0&&p.d>0&&p.h>0));});
const route=load('src/simulation/responder-routing.js',{roads:district.roads,...roads,...parcels},['planResponderRoute','hoseReach','forcedVehicleRole']);
test('Explicit responder roles',()=>{for(const type of ['fireTruck','police','ambulance','bus'])assert.equal(route.forcedVehicleRole(type),type);});
test('Rear-block response follows mapped road graph',()=>{const fire={x:0,y:4,z:-52},p=route.planResponderRoute({x:-150,y:0,z:10},1,10,fire);assert.ok(p&&p.waypoints.length>2);assert.ok(route.hoseReach({...p.staging,y:0},fire));});
test('Unreachable fire is rejected',()=>assert.equal(route.planResponderRoute({x:0,y:0,z:10},1,10,{x:0,y:8,z:500}),null));
const lane=load('src/simulation/lane-safety.js',roads,['adjacentLane','choosePassingLane']);
const car={root:{position:{x:0,z:10}},laneZ:10,dir:1,length:4,speed:7,desiredSpeed:10};
test('Detour stays in direction of travel',()=>{assert.equal(lane.adjacentLane(10,1),13.5);assert.equal(lane.adjacentLane(23,-1),19);assert.equal(lane.adjacentLane(10,1,true),null);});
test('Two hazards prevent unsafe lane change',()=>assert.equal(lane.choosePassingLane(car,[car],[{x:12,z:10,radius:1,life:1},{x:18,z:13.5,radius:1,life:1}]),null));
const game=read('src/game.js');
const budgetStart=game.indexOf('function schoolMeteorBudget'),budgetEnd=game.indexOf('function carveSchool',budgetStart);
assert.ok(budgetStart>=0&&budgetEnd>budgetStart);
const damage=new Function(game.slice(budgetStart,budgetEnd)+'\nreturn {schoolMeteorBudget,penetrationDamageStep}')();
test('School meteor budgets bounded between 5 and 15 percent for damaging rocks',()=>{assert.equal(damage.schoolMeteorBudget(1.35),.05);assert.equal(damage.schoolMeteorBudget(1.1),0);for(let n=1.35;n<=20;n+=.1)assert.ok(damage.schoolMeteorBudget(n)>=.05&&damage.schoolMeteorBudget(n)<=.150000001);});
test('Penetration spends budget once at any tested step size',()=>{for(const size of [1.35,2,2.8,3.6,13])for(const delta of [.01,.3,2,30]){const budget=damage.schoolMeteorBudget(size);let y=16,remaining=budget;while(y>-.8){const next=Math.max(-.8,y-delta);remaining-=damage.penetrationDamageStep(budget,remaining,16,-.8,y,next);y=next;}assert.ok(Math.abs(remaining)<1e-9);}});
test('No global partial-damage floor clipping',()=>{const shader=read('src/rendering/school-source-damage.js');assert.ok(!shader.includes('collapseCutoff'));assert.ok(shader.includes('schoolDestructionRatio>=1.0'));});
test('Water-only preset is independent of subway breach',()=>assert.ok(game.includes('addCrater(0,BROAD_CENTER,4.5,{waterOnly:true})')));
const collision=load('src/simulation/meteor-collision.js',{containsParcel:parcels.containsParcel},['traceMeteorCollision']);
const school={min:{x:-13.5,z:-58.4},max:{x:13.5,z:.4,y:28}};
test('Every mapped building owns its vertical roof collision',()=>{
 for(const b of list){
  let sample=null;
  for(let u=1;u<20&&!sample;u++)for(let v=1;v<20&&!sample;v++){
   const x=b.x-b.w/2+b.w*u/20,z=b.z-b.d/2+b.d*v/20;
   if(parcels.containsParcel(b,x,z)&&!list.some(q=>q!==b&&parcels.containsParcel(q,x,z)))sample={x,z};
  }
  assert.ok(sample,'exclusive footprint sample for '+b.id);
  const hit=collision.traceMeteorCollision({...sample,y:b.h+35},{...sample,y:-2},list,school);
  assert.equal(hit?.building?.id,b.id);
  assert.ok(Math.abs(hit.point.y-b.h)<1e-6);
 }
});
test('Fast diagonal meteor hits facade even with endpoint beyond building',()=>{
 const b={id:'test',x:14,z:-10,w:5,d:12,h:8,damage:0};
 const hit=collision.traceMeteorCollision({x:5,y:7,z:-10},{x:25,y:3,z:-10},[b],school,false);
 assert.equal(hit?.building?.id,b.id);
});
test('Ground and collapsed building collision',()=>{
 const b={id:'test',x:14,z:-10,w:5,d:12,h:8,damage:1};
 assert.equal(collision.traceMeteorCollision({x:14,y:30,z:-10},{x:14,y:0,z:-10},[b],school).kind,'ground');
});
test('Penetration budget does not double-charge measured structural damage',()=>{
 const line=game.match(/b\.damage=Math\.max\(b\.damage\|\|0,Math\.min\(1\.0,m\.crunchInitialDamage\+m\.crunchDamageDealt\)\);/);
 assert.ok(line);
 const apply=new Function('b','m',line[0]+'return b.damage;');
 const b={damage:.3},m={crunchInitialDamage:.1,crunchDamageDealt:.2};
 assert.ok(Math.abs(apply(b,m)-.3)<1e-8);
 m.crunchDamageDealt=.5;
 assert.ok(Math.abs(apply(b,m)-.6)<1e-8);
 assert.ok(Math.abs(apply(b,m)-.6)<1e-8);
 b.damage=.8;assert.equal(apply(b,m),.8);
});
test('Forced damage detaches only its missing quota, without premature flattening',()=>{
 const structural=read('src/rendering/structural-city.js');
 const start=structural.indexOf(' function forceDamage('),end=structural.indexOf(' function update(',start);
 assert.ok(start>=0&&end>start);
 class V{constructor(x,y,z){Object.assign(this,{x,y,z});}distanceTo(v){return Math.hypot(this.x-v.x,this.y-v.y,this.z-v.z);}}
 let detaches=0;
 const force=new Function('THREE','detach',structural.slice(start,end)+'return forceDamage;')({Vector3:V},p=>{p.state='falling';detaches++;});
 const parts=Array.from({length:100},(_,i)=>({type:'wall',state:i<20?'settled':'attached',original:{position:new V(i%5,i%10,0)},position:new V(i%5,i%10,0)}));
 const b={x:0,z:0,w:10,h:10,d:10,damage:.2,pressure:.2,structuralParts:parts,parts};
 force(b,.5);assert.equal(detaches,30);
 force(b,.5);assert.equal(detaches,30);
 force(b,.9);assert.equal(parts.filter(p=>p.state==='attached').length,10);
 force(b,1);assert.equal(detaches,80);
 force(b,1);assert.equal(detaches,80);
});
test('Structural support queue drains after stable damage and retains delayed failures',()=>{
 const structural=read('src/rendering/structural-city.js');
 const start=structural.indexOf(' function scheduleSupport('),end=structural.indexOf(' function detach(',start);
 const a=structural.indexOf(' function update(dt)'),b=structural.indexOf('  for(const p of moving)',a);
 assert.ok(start>=0&&end>start&&a>=0&&b>a);
 const code=structural.slice(start,end)+structural.slice(a,b)+'\n}';
 const env=new Function('supportedFloors',
  "let time=0,supportPasses=0;const supportWork=new Set();function detach(p){if(p.state!=='attached')return 0;p.state='falling';scheduleSupport(p.building);return 1;}"+code+
  'return {scheduleSupport,update,state:()=>({supportPasses,pending:supportWork.size})}'
 )((parts,stories)=>Array(stories).fill(parts.some(p=>p.type==='column'&&p.state==='attached')));
 const mk=()=>{const b={school:false,h:6,stories:1,damage:0,pressure:.4,collapseClock:0,supportRevision:0,parts:[],sections:[],slabs:[]};
  b.parts=[{type:'column',state:'attached',floor:0,building:b,original:{position:{y:1}},position:{}},{type:'wall',state:'attached',floor:0,building:b,original:{position:{y:1}},position:{}}];b.structuralParts=b.parts;return b;};
 const one=mk();env.scheduleSupport(one);env.update(.3);assert.equal(env.state().pending,0);assert.equal(env.state().supportPasses,1);
 for(let i=0;i<100;i++)env.update(.1);assert.equal(env.state().supportPasses,1);
 one.parts[0].state='removed';env.scheduleSupport(one);env.update(.3);assert.equal(env.state().pending,1);assert.equal(one.parts[1].state,'attached');
 for(let i=0;i<20;i++)env.update(.3);assert.equal(one.parts[1].state,'falling');assert.equal(env.state().pending,0);
 for(let i=0;i<122;i++)env.scheduleSupport(mk());env.update(.3);const passes=env.state().supportPasses;
 for(let i=0;i<40;i++)env.update(.25);assert.equal(env.state().supportPasses,passes);assert.equal(env.state().pending,0);
});
test('Floor-indexed nearest supports match the original stable sort',()=>{
 const {nearestSupports}=load('src/simulation/structural-dynamics.js',{},['nearestSupports']);
 const vec=(x,y,z)=>({x,y,z,distanceToSquared(p){return (x-p.x)**2+(y-p.y)**2+(z-p.z)**2;}});
 const cols=Array.from({length:120},(_,i)=>({id:i,floor:i%5,position:vec(i%7,i%5*5,Math.floor(i/7)%4)}));
 const groups=Array.from({length:5},(_,f)=>cols.filter(c=>c.floor===f));
 for(let i=0;i<500;i++){
  const part={floor:i%5,type:i%2?'column':'wall',position:vec(i%13,i%8,i%9)};
  const floor=part.type==='column'&&part.floor>0?part.floor-1:part.floor;
  const expected=cols.filter(c=>c.floor===floor).sort((a,b)=>a.position.distanceToSquared(part.position)-b.position.distanceToSquared(part.position)).slice(0,2);
  assert.equal(nearestSupports(part,groups).map(c=>c.id).join(','),expected.map(c=>c.id).join(','));
 }
 assert.equal(nearestSupports({floor:8,type:'wall',position:vec(0,0,0)},groups).length,0);
});
test('Rubble writes are batched and capped',()=>{
 const a=game.indexOf('let rubbleDirty=false;'),b=game.indexOf('const crashedWrecks',a);
 const p=game.indexOf('function preserveRubble('),q=game.indexOf('function settleMeteorAsPermanentSlag',p);
 assert.ok(a>=0&&b>a&&p>=0&&q>p);
 let builds=0,adds=0;
 class V{constructor(x,y,z){Object.assign(this,{x,y,z});}}
 const api=new Function('THREE','rubblePool','scene','MAX_RUBBLE','const settledRubble=[];'+game.slice(a,b)+game.slice(p,q)+'return {preserveRubble,refreshRubble,settledRubble};')({Vector3:V},{begin(){builds++;},add(){adds++;},end(){}},{remove(){}},220);
 for(let i=0;i<50;i++)api.preserveRubble({position:{x:i,y:0,z:0},scale:.4});
 assert.equal(builds,0);api.refreshRubble();assert.equal(builds,1);assert.equal(adds,50);
 api.refreshRubble();assert.equal(builds,1);
 for(let i=0;i<300;i++)api.preserveRubble({position:{x:i,y:0,z:0},scale:.4});
 api.refreshRubble();assert.equal(api.settledRubble.length,220);assert.equal(adds,270);
});
test('Barrage scheduler enforces a global cap and cancels pending launches',()=>{
 const a=game.indexOf('const pendingBarrageTimers=new Set();'),b=game.indexOf('let dragonEnabled',a);
 assert.ok(a>=0&&b>a);let serial=0,spawned=0;const timers=new Map();
 const api=new Function('setTimeout','clearTimeout','sandboxReticle','dragon','spawnTestMeteorAt','sound','message',game.slice(a,b)+'return {spawnMeteorBarrage,clearPendingBarrages,pending:()=>pendingBarrageTimers.size};')((fn)=>{timers.set(++serial,fn);return serial;},id=>timers.delete(id),{visible:false},null,()=>spawned++,()=>{},()=>{});
 api.spawnMeteorBarrage(100,0,0);assert.equal(api.pending(),24);
 api.spawnMeteorBarrage(10,0,0);assert.equal(api.pending(),24);
 const fn=timers.get(1);timers.delete(1);fn();assert.equal(spawned,1);assert.equal(api.pending(),23);
 api.clearPendingBarrages();assert.equal(timers.size,0);assert.equal(api.pending(),0);
});
test('Cinematic particle upload ranges are bounded to active instances',()=>{
 const {uploadActivePrefix}=load('src/rendering/cinematic-effects.js',{},['uploadActivePrefix']);
 let ranges=[],versions=0;
 const attr={clearUpdateRanges(){ranges=[];},addUpdateRange(a,b){ranges.push([a,b]);},set needsUpdate(v){if(v)versions++;}};
 assert.equal(uploadActivePrefix(attr,0,16),false);assert.equal(versions,0);
 uploadActivePrefix(attr,7,16);assert.equal(ranges[0][1],112);
 uploadActivePrefix(attr,4,3);assert.equal(ranges.length,1);assert.equal(ranges[0][1],12);
 const legacy={needsUpdate:false};uploadActivePrefix(legacy,4,1);assert.equal(legacy.needsUpdate,true);
});
test('Generic particle pool respects capacity and active matrix ranges',()=>{
 const {InstancedParticlePool}=load('src/rendering/instanced-particles.js',{},['InstancedParticlePool']);
 class Mesh{constructor(){this.instanceMatrix={ranges:[],setUsage(){},clearUpdateRanges(){this.ranges=[];},addUpdateRange(a,b){this.ranges.push([a,b]);},needsUpdate:false};}setMatrixAt(){}}
 const T={Object3D:class{constructor(){this.position={copy(){}};this.rotation={set(){}};this.scale={setScalar(){}};}updateMatrix(){}},InstancedMesh:Mesh,DynamicDrawUsage:1};
 const pool=new InstancedParticlePool({THREE:T,parent:{add(){}},geometry:{},material:{},capacity:4});
 pool.begin();for(let i=0;i<3;i++)pool.add({},1);pool.end();
 assert.equal(pool.mesh.instanceMatrix.ranges[0][1],48);
 pool.begin();for(let i=0;i<4;i++)pool.add({},1);assert.equal(pool.add({},1),false);pool.end();
 assert.equal(pool.mesh.instanceMatrix.ranges[0][1],64);pool.clear();assert.equal(pool.mesh.count,0);
});
test('Parcel damage mask persists locally and restores original shared materials',()=>{
 const {createParcelDamageMask}=load('src/rendering/parcel-damage-mask.js',{},['createParcelDamageMask']);
 class V{constructor(x,y,z){Object.assign(this,{x,y,z});}}
 class Texture{constructor(data,w,h,d){this.image={data,w,h,d};this.disposals=0;}dispose(){this.disposals++;}}
 const T={Vector3:V,Data3DTexture:Texture};
 const original={clone(){return {dispose(){this.disposals=(this.disposals||0)+1;}};},customProgramCacheKey:()=> 'base',onBeforeCompile(){}};
 const a={isMesh:true,material:original},b={isMesh:true,material:original},other={isMesh:true,material:original};
 const mask=createParcelDamageMask(T,{traverse(cb){cb(a);cb(b);}},{minX:0,maxX:10,minY:0,maxY:10,minZ:0,maxZ:10});
 assert.equal(a.material,b.material);assert.ok(a.material!==original);assert.equal(other.material,original);
 const shader={uniforms:{},vertexShader:'#include <worldpos_vertex>',fragmentShader:'#include <clipping_planes_fragment>\n#include <color_fragment>'};
 a.material.onBeforeCompile(shader);
 assert.ok(shader.vertexShader.includes('instanceMatrix*parcelLocal'));
 const tex=shader.uniforms.uParcelDamageMap.value,im=tex.image;
 const sample=(x,y,z)=>{const o=shader.uniforms.uParcelDamageMin.value,s=shader.uniforms.uParcelDamageSize.value;return im.data[(Math.floor((z-o.z)/s.z*im.d)*im.h+Math.floor((y-o.y)/s.y*im.h))*im.w+Math.floor((x-o.x)/s.x*im.w)];};
 for(const [point,radius,strength] of [[{x:2,y:4,z:0},4,0],[{x:2,y:4,z:0},4,-1],[{x:2,y:4,z:0},4,NaN],[{x:2,y:4,z:0},4,Infinity],[{x:2,y:4,z:0},0,1],[null,4,1],[{x:NaN,y:4,z:0},4,1]])assert.equal(mask.stamp(point,radius,strength),false);
 assert.equal(mask.strikes(),0);assert.ok(im.data.every(value=>value===0));
 mask.stamp({x:2,y:4,z:0},4,1);assert.ok(sample(2,4,0)>122);
 assert.equal(sample(8,4,0),0);assert.equal(sample(2,4,10),0);
 mask.stamp({x:8,y:6,z:10},3,1);assert.ok(sample(2,4,0)>122&&sample(8,6,10)>122);
 assert.ok(mask.byteLength<=48**3);
 const clone=a.material;mask.dispose();mask.dispose();
 assert.equal(a.material,original);assert.equal(b.material,original);assert.equal(clone.disposals,1);assert.equal(tex.disposals,1);
});
test('Viewer damage never hides an entire floor band on a partial strike',()=>{
 const {createViewerCityModels}=load('src/rendering/viewer-city-models.js',{
 THREE:{Group:class{constructor(){this.children=[];this.visible=true;}add(o){this.children.push(o);}},Vector3:class{constructor(x,y,z){Object.assign(this,{x,y,z});}}},
 makeViewerBuilding:()=>({model:{visible:true},sections:Array.from({length:4},()=>({visible:true})),bounds:{min:{x:0,y:0,z:0},max:{x:1,y:1,z:1}}}),
 containsParcel:(b,x,z)=>Math.abs(x-b.x)<=b.w/2&&Math.abs(z)<=3,
 createParcelDamageMask:()=>{let n=0;return {stamp(){n++;},strikes(){return n;},dispose(){}};}
 },['createViewerCityModels']);
 const city={buildings:[{id:'a',name:'A',viewerParcel:true,h:6,x:0,z:0,w:6,front:3,damage:0},{id:'b',name:'B',viewerParcel:true,h:6,x:4,z:0,w:6,front:3,damage:0}],impact(b){b.damage+=.2;},forceDamage(b,v){b.damage=v;}};
 const api=createViewerCityModels({add(){}},city);
 for(const [point,radius,strength] of [[{x:2,y:3,z:0},3,0],[{x:2,y:3,z:0},3,-1],[{x:2,y:3,z:0},3,NaN],[{x:2,y:3,z:0},3,Infinity],[{x:2,y:3,z:0},0,1],[null,3,1],[{x:NaN,y:3,z:0},3,1]])assert.equal(api.impactBuilding('b',point,radius,strength),0);
 assert.equal(api.impact(null,3,1),0);
 assert.equal(api.entries[1].targetBuilding.damage,0);assert.ok(!api.entries[1].impactMask);
 api.impactBuilding('b',{x:2,y:3,z:0},3,1);assert.equal(api.entries[0].damage,0);
 assert.ok(api.entries[1].sections.every(s=>s.visible));
 assert.equal(api.entries[1].impactMask.strikes(),1);
 api.impactBuilding('b',{x:2,y:4,z:0},3,1);assert.equal(api.entries[1].impactMask.strikes(),2);
 api.restore();assert.equal(api.entries[1].impactMask,null);
});
test('Exposed interior geometry is floor-specific and conservatively footprint-contained',()=>{
 const structural=read('src/rendering/structural-city.js');
 const a=structural.indexOf(' function interiorFitsParcel('),b=structural.indexOf(' function scheduleSupport(',a);
 assert.ok(a>=0&&b>a);const writes=[];
 const api=new Function('write','containsParcel',structural.slice(a,b)+'return {interiorFitsParcel,exposeInterior};')(p=>writes.push(p),(b,x,z)=>x>=0&&x<=10&&z>=0&&z<=10&&!(x>4&&x<6&&z>4&&z<6));
 const part=(x,z,w,d)=>({original:{position:{x,z},size:{x:w,z:d}}});
 assert.equal(api.interiorFitsParcel({},part(2,2,2,2)),true);
 assert.equal(api.interiorFitsParcel({},part(1,1,4,4)),false);
 assert.equal(api.interiorFitsParcel({},part(5,5,8,8)),false);
 const building={viewerParcel:true,exposedFloors:new Set(),floorHeight:3,stories:4,parts:[{floor:1,state:'attached',type:'slab',interiorFits:true},{floor:1,state:'attached',type:'column',interiorFits:false},{floor:1,state:'attached',type:'wall',interiorFits:true}]};
 assert.equal(api.exposeInterior(building,{y:4.5},1),1);assert.equal(writes.length,1);assert.equal(writes[0],building.parts[0]);
 assert.equal(api.exposeInterior(building,{y:4.5},1),0);assert.equal(writes.length,1);
});
test('Landmark-aware interior profiles preserve open assembly spaces and school exception',()=>{
 const {interiorProfile,interiorFurnishings}=load('src/simulation/interior-profiles.js',{},['interiorProfile','interiorFurnishings']);
 const expected={'1005656':'worship','1000951':'worship','district-5':'worship','district-29':'assembly','1005655':'restaurant','1003022':'retail','1073318':'retail','district-1':'residence-hall'};
 for(const [id,kind] of Object.entries(expected)){
  const b=list.find(p=>p.id===id);assert.ok(b);
  const profile=interiorProfile(b);assert.equal(profile.kind,kind);
  if(['worship','assembly','restaurant'].includes(kind)||['1003022','1073318'].includes(id))assert.equal(profile.stories,1);
  assert.ok(interiorFurnishings(b,profile).length>0);
 }
 const school=interiorProfile({school:true,h:28,stories:5});
 assert.equal(school.kind,'school-source');assert.equal(school.requiresSourceVerification,true);
 assert.equal(interiorFurnishings({school:true,w:27,d:58.8,h:28},school).length,0);
});
test('All 122 mapped parcels have interior profiles and conservative furnishing placement',()=>{
 const {interiorProfile,interiorFurnishings}=load('src/simulation/interior-profiles.js',{},['interiorProfile','interiorFurnishings']);
 const structural=read('src/rendering/structural-city.js');
 const a=structural.indexOf(' function interiorFitsParcel('),b=structural.indexOf(' function exposeInterior(',a);
 const fits=new Function('containsParcel',structural.slice(a,b)+'return interiorFitsParcel;')(parcels.containsParcel);
 let total=0,worship=0,assembly=0;
 for(const p of list){
  const profile=interiorProfile(p);assert.ok(profile.kind&&profile.stories>0);
  const plan=interiorFurnishings(p,profile);
  const placed=plan.filter(q=>q.y-q.h/2>=0&&q.y+q.h/2<=p.h&&fits(p,{original:{position:{x:q.x,y:q.y,z:q.z},size:{x:q.w,y:q.h,z:q.d}}}));
  assert.ok(placed.every(q=>q.w>0&&q.h>0&&q.d>0));
  total+=placed.length;
  if(profile.kind==='worship'){worship++;assert.equal(profile.stories,1);assert.ok(placed.length>0);}
  if(profile.kind==='assembly'){assembly++;assert.equal(profile.stories,1);assert.ok(placed.length>0);}
 }
 assert.equal(list.length,122);assert.equal(worship,3);assert.equal(assembly,1);assert.ok(total>1000);
 console.log('  Accepted interior furnishings: '+total);
});
test('School source fixtures retained only within the original school zone',()=>{
 const {schoolSourceCategory,classifyArchitecturalMesh,schoolInteriorSourceEligible}=load('src/rendering/tech-freire-source-fit.js',{},['schoolSourceCategory','classifyArchitecturalMesh','schoolInteriorSourceEligible']);
 const box={min:{x:0,y:1,z:-10},max:{x:2,y:3,z:-8}};
 for(const [name,category] of [['Furniture_Desk','furniture'],['Stairs_123','circulation'],['Basic Wall','walls'],['Floor_Slab','floors'],['Structural Column','structure'],['Door_14','doors'],['Lighting_Fixture','lighting'],['Plumbing_Sink','plumbing']])assert.equal(schoolSourceCategory({name}),category);
 assert.equal(classifyArchitecturalMesh({name:'Furniture_Desk'},box),'school');
 assert.equal(classifyArchitecturalMesh({name:'Furniture_Desk'},{min:{...box.min,x:49},max:{...box.max,x:51}}),null);
 assert.equal(schoolInteriorSourceEligible({name:'Furniture_Desk'},{min:{...box.min,x:-29},max:{...box.max,x:46}}),false);
});
test('Production FBX batching retains source interiors and suppresses approximate attached geometry',()=>{
 const batch=read('src/rendering/school-source-batch.js'),proxy=read('src/rendering/destructible-school.js');
 assert.ok(!/if\s*\(role\s*===\s*['"]interior['"]\)\s*continue/.test(batch));
 assert.ok(batch.includes('bySurface'));
 assert.ok(proxy.includes('if(overlayMode&&!p.falling&&!p.resting)continue;'));
 assert.ok(game.includes("attachedGeometrySource:'original FBX',damagePhysicsSource:'approximate proxy'"));
});
test('Spatial batches separate floors and bays without clipping large components',()=>{
 const {schoolBatchRegion}=load('src/rendering/school-source-batch.js',{},['schoolBatchRegion']);
 const box=(x,y,z,w=4,h=3,d=4)=>({min:{x,y,z},max:{x:x+w,y:y+h,z:z+d}});
 assert.equal(schoolBatchRegion('brick',box(0,0,0)),'shell');
 assert.equal(schoolBatchRegion('interior',box(1,1,1)),schoolBatchRegion('interior',box(6,3,9)));
 assert.ok(schoolBatchRegion('interior',box(1,1,1))!==schoolBatchRegion('interior',box(1,20,1)));
 assert.ok(schoolBatchRegion('interior',box(1,1,1))!==schoolBatchRegion('interior',box(1,1,-70)));
 assert.equal(schoolBatchRegion('interior',box(0,0,0,60,1,60)),'large');
 assert.equal(schoolBatchRegion('interior',box(0,0,0,-1)),'unbounded');
});
test('Original school component index chooses only nearby materials',()=>{
 const {sourceComponentMaterial,createSchoolComponentIndex}=load('src/simulation/school-source-impact.js',{},['sourceComponentMaterial','createSchoolComponentIndex']);
 const rec=(category,min,max,name='')=>({category,min,max,material:sourceComponentMaterial(category,name)});
 const index=createSchoolComponentIndex([rec('glazing',{x:0,y:3,z:0},{x:2,y:5,z:.2}),rec('walls',{x:0,y:3,z:-20},{x:2,y:5,z:-19},'brick'),rec('structure',{x:1,y:3,z:-1},{x:1.5,y:5,z:0}),rec('floors',{x:-30,y:0,z:-60},{x:30,y:.2,z:0})]);
 assert.equal(index.query({x:1,y:4,z:0},2).map(x=>x.material).sort().join(','),'glass,metal');
 assert.equal(index.query({x:1,y:4,z:-20},1)[0].material,'brick');
 assert.equal(index.query({x:0,y:.1,z:-30},1)[0].category,'floors');
 assert.equal(index.query({x:100,y:100,z:100},4).length,0);
 assert.equal(index.query({x:1,y:4,z:0},2,1).length,1);
 assert.equal(sourceComponentMaterial('glazing','mullion'),'metal');
});
test('Source-school health gauge does not fabricate partial debris',()=>{
 const proxy=read('src/rendering/destructible-school.js');
 const start=proxy.indexOf(' function syncDestruction('),end=proxy.indexOf(' function reset()',start);
 assert.ok(start>=0&&end>start);
 let collapses=0;
 const fn=new Function('collapse','THREE','let currentRatio=0,schoolCracksGroup=null,overlayMode=true;'+proxy.slice(start,end)+'return syncDestruction;')(()=>collapses++,{});
 fn(.15);fn(.9);assert.equal(collapses,0);fn(1);assert.equal(collapses,1);
});
console.log(count+' integration regression groups passed. Browser/GPU validation is separate.');
