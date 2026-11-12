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
