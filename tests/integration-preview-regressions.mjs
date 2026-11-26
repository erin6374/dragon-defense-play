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
console.log(count+' integration regression groups passed. Browser/GPU validation is separate.');
