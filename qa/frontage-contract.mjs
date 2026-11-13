import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/build/three.module.js';
import {createStructuralCity} from '../src/rendering/structural-city.js';
import {populateCity} from '../src/simulation/city-layout.js';
import {occupiesCrossStreet} from '../src/simulation/road-corridors.js';
function make(includeEdges){
 const mat=()=>new THREE.MeshStandardMaterial();
 const city=createStructuralCity(THREE,new THREE.Scene(),{getBuilding:mat,concrete:mat(),roof:mat(),blackMetal:mat(),images:{}});
 populateCity({addBuilding(o){if(includeEdges||!o.name.startsWith('broad-'))return city.addBuilding(o);}});
 city.finalize();return city;
}
const base=make(false),city=make(true),edges=city.buildings.filter(b=>b.name.startsWith('broad-'));
assert.equal(edges.length,2);assert.equal(city.stats().drawBatches,base.stats().drawBatches,'extension reuses existing instanced draw batches');
for(const b of edges){assert.ok(!b.background&&!occupiesCrossStreet(b.x,b.w));assert.equal(b.parts.filter(p=>p.type==='stair').length,0);}
const campus=edges.find(b=>b.institutional);
assert.ok(campus.h<7&&campus.w>25&&campus.front<=-5,'preserve low, broad, set-back south footprint');
assert.ok(!city.buildings.some(b=>b.background&&Math.abs(b.x-campus.x)<(b.w+campus.w)/2&&Math.abs(b.z-campus.z)<(b.d+campus.d)/2),'no procedural houses intersect campus');
for(const b of [edges[0],edges.at(-1)]){
 assert.ok(city.impact(b,new THREE.Vector3(b.x,b.h*.6,b.front),5,2)>0);
 assert.ok(b.damage>0&&b.parts.some(p=>p.state!=='attached'));
}
city.restore();assert.ok(edges.every(b=>b.damage===0&&b.parts.every(p=>p.state==='attached')));
console.log('Frontage damage/reset/road-clearance PASS', {addedComponents:city.stats().components-base.stats().components,addedDrawBatches:city.stats().drawBatches-base.stats().drawBatches});

// Historic upper-storey openings must stay narrow, recessed and enclosed by
// masonry, while school/modern glazing retains its original proportions.
for(const b of city.buildings.filter(b=>b.historicSash)){
 for(const pane of b.windows.filter(p=>p.floor>0)){
  assert.ok(pane.size.x<=1.45&&pane.size.x<=b.w/b.bays*.48+1e-8);
  const walls=b.sections.filter(p=>p.floor===pane.floor);
  const left=pane.position.x-pane.size.x/2,right=pane.position.x+pane.size.x/2;
  assert.ok(walls.some(p=>Math.abs(p.position.x+p.size.x/2-left)<1e-6&&Math.abs(p.position.y-pane.position.y)<1e-6));
  assert.ok(walls.some(p=>Math.abs(p.position.x-p.size.x/2-right)<1e-6&&Math.abs(p.position.y-pane.position.y)<1e-6));
  assert.ok(walls.some(p=>Math.abs(p.position.x-pane.position.x)<1e-6&&p.position.z>pane.position.z));
 }
}
console.log('Historic sash opening enclosure/recess PASS');

// Doll Museum at 2253 N Broad must be on the school side of Dauphin (x > -53).
const dollMuseum=city.buildings.find(b=>b.name==='north-doll-museum');
assert.ok(dollMuseum&&dollMuseum.x>-53&&dollMuseum.x<0&&dollMuseum.historicSash,
 'Philadelphia Doll Museum is situated on the school side of Dauphin with historic sash openings');

// 2300 block corner across Dauphin (x < -59) features projecting stone bays and ornate roofline.
const northCorner=city.buildings.find(b=>b.name==='north-dauphin-historic-corner');
assert.ok(northCorner&&northCorner.x<-59&&northCorner.projectingBays&&northCorner.ornateRoofline,
 '2300 block historic corner features projecting bays and ornate roofline');
console.log('North Broad reference alignment (Doll Museum & 2300 corner) PASS');
