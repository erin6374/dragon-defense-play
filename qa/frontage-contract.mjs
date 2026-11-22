import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/build/three.module.js';
import {createStructuralCity} from '../src/rendering/structural-city.js';
import {populateCity,footprintsOverlap} from '../src/simulation/city-layout.js';
import {occupiesCrossStreet} from '../src/simulation/road-corridors.js';
function make(includeEdges){
 const mat=()=>new THREE.MeshStandardMaterial();
 const city=createStructuralCity(THREE,new THREE.Scene(),{getBuilding:mat,concrete:mat(),roof:mat(),blackMetal:mat(),images:{}});
 populateCity({addBuilding(o){if(includeEdges||!o.name.startsWith('broad-'))return city.addBuilding(o);}});
 city.finalize();return city;
}
const base=make(false),city=make(true),edges=city.buildings.filter(b=>b.name.startsWith('broad-'));
// RC120 replaced the old 2-lot Broad extension with three mapped 2100-block
// storefronts. The 2131 pharmacy and 2109 McDonald's are separately named.
assert.equal(edges.length,3,'all three RC120 2100-block storefronts are present');
assert.equal(city.stats().drawBatches,base.stats().drawBatches,'extension reuses existing instanced draw batches');
for(const b of edges){assert.ok(!b.background&&!occupiesCrossStreet(b.x,b.w));assert.equal(b.parts.filter(p=>p.type==='stair').length,0);}
const pharmacy=city.buildings.find(b=>b.name==='former-cvs-2131-broad');
const restaurant=city.buildings.find(b=>b.name==='mcdonalds-2109-broad');
const church=city.buildings.find(b=>b.name==='south-diamond-corner');
assert.ok(pharmacy?.institutional&&pharmacy.h<7&&pharmacy.w>=18&&pharmacy.front<=0,
 'retail pharmacy has a low one-storey building set back from Broad');
assert.ok(restaurant&&restaurant.h<7&&restaurant.x>pharmacy.x&&restaurant.x<church.x,
 'McDonalds remains an independent low building with a drive-thru approach');
assert.ok(church&&church.x>restaurant.x&&church.stories===4&&church.x+church.w*.5<245,
 'Berean Church remains a four-storey independent parcel west of Diamond');
assert.ok(!city.buildings.some(b=>b.background&&footprintsOverlap(b,pharmacy)),
 'no procedural houses intersect the pharmacy');
for(const b of [edges[0],edges.at(-1)]){
 assert.ok(city.impact(b,new THREE.Vector3(b.x,b.h*.6,b.front),5,2)>0);
 assert.ok(b.pressure>0&&b.parts.some(p=>p.state!=='attached'));
}
city.restore();assert.ok(edges.every(b=>b.damage===0&&b.parts.every(p=>p.state==='attached')));
console.log('RC120 2100-block frontage/damage/reset/road-clearance PASS', {addedComponents:city.stats().components-base.stats().components,addedDrawBatches:city.stats().drawBatches-base.stats().drawBatches});

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

// RC120 calibrated Dauphin at x=-98, not the obsolete x=-53.
const dollMuseum=city.buildings.find(b=>b.name==='north-doll-museum');
assert.ok(dollMuseum&&dollMuseum.x>-90&&dollMuseum.x<0&&dollMuseum.historicSash,
 'Doll Museum is on the school side of W Dauphin with historic sash openings');
// The 2300 block PECO corner is now an external-model replacement, not the
// former procedural north-dauphin-historic-corner identity.
const northCorner=city.buildings.find(b=>b.name==='north-2300-corner-commercial');
assert.ok(northCorner&&northCorner.x<-135&&northCorner.projectingBays,
 '2300-block PECO corner retains projecting bays across Dauphin');
console.log('RC120 North Broad reference parcel alignment PASS');
// These historical parcels do not have GLB replacements in RC120. They must
// remain rendered as procedural buildings rather than disappear entirely.
for(const name of ['maximus-cares-brownstone','historic-tan-rowhouses']){
 const parcel=city.buildings.find(b=>b.name===name);
 assert.ok(parcel&&!parcel.hideIntactGeometry,
  `Missing historical GLB must retain procedural geometry: ${name}`);
}
console.log('Unmapped historic parcels retain procedural visibility PASS');


// RC120 background parcel contract: procedurally generated houses must never
// intrude into another physical building footprint or an intersecting street.
// This checks every depth row, not just the two named Broad Street edge cases.
const backgroundBuildings=city.buildings.filter(b=>b.background);
assert.ok(backgroundBuildings.length>=200,'retain a populated city after collision filtering');
for(const b of backgroundBuildings){
 assert.ok(!occupiesCrossStreet(b.x,b.w,5.0),`background ${b.name} invades a street right-of-way`);
 for(const neighbor of city.buildings){
  if(neighbor===b)continue;
  assert.ok(!footprintsOverlap(b,neighbor),
   `background parcel collision: ${b.name} overlaps ${neighbor.name}`);
 }
}
console.log('All generated rowhouses clear mapped parcels and each other PASS',
 {backgroundParcels:backgroundBuildings.length});

// Mapping the real school FBX against the adjacent GLB parcel pivots still
// requires visual alignment. Report front-row proxy collisions explicitly;
// do not silently count this background-only check as full map acceptance.
const frontage=city.buildings.filter(b=>!b.background);
const unresolved=[];
for(let i=0;i<frontage.length;i++)for(let j=i+1;j<frontage.length;j++){
 if(footprintsOverlap(frontage[i],frontage[j]))unresolved.push(
  `${frontage[i].name} / ${frontage[j].name}`);
}
if(unresolved.length)console.warn('Frontage proxy footprint overlaps require 3D model review:',unresolved);


// A single 15% school hit must NOT strip an entire top band of structural
// elements. Real impacts detach local pieces; health synchronization only
// updates the gauge until the school has accumulated 100% damage.
city.setParticlesEnabled(false);
const school=city.buildings.find(b=>b.school);
assert.ok(school,'school must have a structural proxy');
const attachedStructure=()=>school.structuralParts.filter(p=>p.state==='attached').length;
const initialStructure=attachedStructure();
city.forceDamage(school,.15);
assert.equal(school.damage,.15);
assert.equal(attachedStructure(),initialStructure,'15% health loss cannot erase global roof/floor bands');
city.impact(school,new THREE.Vector3(school.x,school.h-.8,school.front),5,1.2);
const afterLocalStrike=attachedStructure();
assert.ok(initialStructure-afterLocalStrike<=Math.ceil(initialStructure*.025),
 'one local school impact may detach at most 2.5% of structural components');
city.forceDamage(school,.30);
assert.equal(attachedStructure(),afterLocalStrike,
 'cumulative 30% damage must not remove new parts outside actual impact points');
city.forceDamage(school,1);
assert.equal(attachedStructure(),0,'100% school damage must allow full structural collapse');
city.restore();
assert.equal(attachedStructure(),initialStructure,'school reset must restore all structural components');
console.log('School localized damage/gauge reconciliation/full-collapse/reset PASS');
