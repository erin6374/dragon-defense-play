import assert from 'node:assert/strict';
import * as THREE from '../vendor/three/build/three.module.js';
import {createStructuralCity} from '../src/rendering/structural-city.js';
import {populateCity,footprintsOverlap} from '../src/simulation/city-layout.js';
import {occupiesCrossStreet} from '../src/simulation/road-corridors.js';
import {boundsOverlap3D,parcelOverhang,overlapsBetweenLoadedModels} from '../src/simulation/model-footprint-audit.js';

function make(includeEdges){
 const mat=()=>new THREE.MeshStandardMaterial();
 const city=createStructuralCity(THREE,new THREE.Scene(),{getBuilding:mat,concrete:mat(),roof:mat(),blackMetal:mat(),images:{}});
 populateCity({addBuilding(o){if(includeEdges||!o.name.startsWith('broad-'))return city.addBuilding(o);}});
 city.finalize();return city;
}

const base=make(false),city=make(true),edges=city.buildings.filter(b=>b.name.startsWith('broad-'));
// 2100-block storefronts and residential parcels
assert.ok(edges.length>=3,'all 2100-block storefronts are present');
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
console.log('2100-block frontage/damage/reset/road-clearance PASS', {addedComponents:city.stats().components-base.stats().components,addedDrawBatches:city.stats().drawBatches-base.stats().drawBatches});

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

// Dauphin calibrated at x=-98
const dollMuseum=city.buildings.find(b=>b.name==='north-doll-museum');
assert.ok(dollMuseum&&dollMuseum.x>-98&&dollMuseum.x<0&&dollMuseum.historicSash,
 'Philadelphia Doll Museum is situated on the school side of Dauphin with historic sash openings');

// 2300 block PECO corner across Dauphin (x < -98) features projecting bays
const northCorner=city.buildings.find(b=>b.name==='north-2300-corner-commercial');
assert.ok(northCorner&&northCorner.x<-98&&northCorner.projectingBays,
 '2300-block PECO corner retains projecting bays across Dauphin');
console.log('North Broad reference parcel alignment PASS');

// These historical parcels do not have GLB replacements. They must
// remain rendered as procedural buildings rather than disappear entirely.
for(const name of ['maximus-cares-brownstone','historic-tan-rowhouses']){
 const parcel=city.buildings.find(b=>b.name===name);
 assert.ok(parcel&&!parcel.hideIntactGeometry,
  `Missing historical GLB must retain procedural geometry: ${name}`);
}
console.log('Unmapped historic parcels retain procedural visibility PASS');

// Procedurally generated background houses must never intrude into another
// physical building footprint or an intersecting street.
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

// Frontage proxy footprints report
const frontage=city.buildings.filter(b=>!b.background);
const unresolved=[];
for(let i=0;i<frontage.length;i++)for(let j=i+1;j<frontage.length;j++){
 if(footprintsOverlap(frontage[i],frontage[j]))unresolved.push(
  `${frontage[i].name} / ${frontage[j].name}`);
}
if(unresolved.length)console.warn('Frontage proxy footprint overlaps require 3D model review:',unresolved);
else console.log('Zero frontage proxy footprint overlaps PASS');

// School localized damage / gauge reconciliation / full collapse
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

// 3D Bounding box diagnostics
const box=(minX,maxX,minY=0,maxY=10,minZ=-10,maxZ=0)=>({minX,maxX,minY,maxY,minZ,maxZ});
const a=box(-10,0),b=box(-1,8),adjacent=box(0,8);
assert.equal(boundsOverlap3D(a,adjacent),null,'shared party wall is not an intersection');
const crossing=boundsOverlap3D(a,b);
assert.ok(crossing&&crossing.x>.9&&crossing.y>0&&crossing.z>0);
assert.equal(boundsOverlap3D(a,box(-4,2,11,14)),null,'models at separate elevations do not collide');
assert.deepEqual(parcelOverhang(box(-9,1),{x:-5,w:10,z:-5,d:10}),
 {northX:0,southX:1,rearZ:0,frontZ:0},'show the side where a model overhangs its parcel');
const entries=[
 {def:{id:'1',address:'A'},loaded:true,worldBounds:a},
 {def:{id:'2',address:'B'},loaded:true,worldBounds:b},
 {def:{id:'3',address:'Pending'},loaded:false,worldBounds:box(-9,1)}
];
assert.deepEqual(overlapsBetweenLoadedModels(entries).map(x=>[x.first,x.second]),[['1','2']],
 'report only loaded model pairs with a 3D volume intersection');
console.log('Imported GLB geometry footprint/parcel overhang diagnostics PASS');
