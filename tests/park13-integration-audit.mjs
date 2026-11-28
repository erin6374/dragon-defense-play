import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from '../vendor/three/build/three.module.js';
import {preparePark13Expansion,createPark13Expansion,clipContextRect,contextIntersectsExpansion} from '../src/rendering/park13-expansion.js';
import {viewerParcels,schoolGameEnvelope,VIEWER_TO_GAME_X,VIEWER_TO_GAME_Z} from '../src/simulation/viewer-parcels.js';
import {intersectionArea,AREA_TOLERANCE} from '../broad-street/park13-integration/park13-polygon-overlap.mjs';
const root=new URL('../broad-street/park13-integration/',import.meta.url);
const read=async name=>JSON.parse(await readFile(new URL(name,root),'utf8'));
const data=preparePark13Expansion(...await Promise.all(['park13-GIS-precise-20261127.json','park13-southern-20261127.json','park13-public-realm-20261127.json','park13-southern-realm-full-20261127.json','park13-diamond-seam-20261127.json','park13-campus-links-20261127.json'].map(read)));
const grid=JSON.parse(await readFile(new URL('../broad-street/mapped-data.json',import.meta.url),'utf8'));
const baseline=viewerParcels(grid.rows);
assert.equal(baseline.length,122);
const school=schoolGameEnvelope(grid.rows);
const schoolRing=[[[[school.minX,school.minZ],[school.maxX,school.minZ],[school.maxX,school.maxZ],[school.minX,school.maxZ],[school.minX,school.minZ]]]];
const expanded=data.records.map(r=>({...r,polys:r.polys.map(poly=>poly.map(ring=>ring.map(([x,z])=>[x+VIEWER_TO_GAME_X,z+VIEWER_TO_GAME_Z])))}));
let checks=0;
for(let i=0;i<expanded.length;i++){
 const a=expanded[i];for(const b of [...baseline,{id:'school',polys:schoolRing},...expanded.slice(0,i)]){
  const area=intersectionArea(a.polys,b.polys);checks++;assert.ok(area<=AREA_TOLERANCE,'Footprint conflict '+a.id+' vs '+b.id+': '+area);
 }
 for(const [x,z] of a.polys.flat(2))assert.ok(data.zones.some(b=>x>=b.minX&&x<=b.maxX&&z>=b.minZ&&z<=b.maxZ),'Outside replacement coverage '+a.id);
}
// Check every imported road, sidewalk, joint, seam and pedestrian strip
// against the exact active game footprints, not only the Viewer records.
let surfaceChecks=0;const conflicts=[];
for(const {items} of data.surfaces)for(const item of items){
 const polys=item.polys.map(poly=>poly.map(ring=>ring.map(([x,z])=>[x+VIEWER_TO_GAME_X,z+VIEWER_TO_GAME_Z])));
 for(const b of [...baseline,{id:'school',polys:schoolRing},...expanded]){
  const area=intersectionArea(polys,b.polys);surfaceChecks++;
  if(area>AREA_TOLERANCE)conflicts.push({surface:item.id,building:b.id,area});
 }
}
console.log('PARK13_SURFACE_AUDIT '+JSON.stringify({surfaceChecks,conflicts}));
assert.equal(conflicts.length,0,'Imported pavement overlaps active building footprints');
const layer=createPark13Expansion(T,data),s=layer.stats();
assert.equal(s.buildings,165);assert.equal(s.components,2893);assert.equal(s.triangles,44260);assert.equal(s.architectureDrawObjects,80);assert.equal(s.damageable,false);
assert.equal(s.surfaceDrawObjects,3);assert.deepEqual(s.realmCounts,{roads:343,sidewalks:686,pedestrianPaths:51,campusSurfaces:78});assert.ok(!data.records.some(r=>r.bin==='1048635'));
const box=new T.Box3().setFromObject(layer.root);assert.ok([...box.min.toArray(),...box.max.toArray()].every(Number.isFinite));
// Exact geometry round trip and isolation: damage only the chosen parcel.
const meshes=layer.root.children[0].children;
const arrays=()=>meshes.map(m=>Array.from(m.isInstancedMesh?m.instanceMatrix.array:m.geometry.attributes.position.array));
const original=arrays(),id=data.records[0].id,other=data.records[1].id;
assert.equal(layer.setDamage('unknown',.5),false);assert.equal(layer.setDamage(id,NaN),false);
assert.equal(layer.setDamage(id,.15),true);assert.equal(layer.damageOf(id),.15);assert.equal(layer.damageOf(other),0);
const partial=arrays();assert.ok(partial.some((a,i)=>a.some((v,j)=>v!==original[i][j])));
assert.equal(layer.setDamage(id,1),true);assert.equal(layer.stats().damaged,1);
const collapsed=arrays();assert.ok(collapsed.some((a,i)=>a.some((v,j)=>v!==partial[i][j])));
layer.restore();assert.equal(layer.stats().damaged,0);assert.deepEqual(arrays(),original);
assert.equal(layer.stats().architectureDrawObjects,80);
assert.equal(layer.targetAt(NaN,0),null);assert.equal(layer.targetAt(1e6,1e6),null);
let found=null;for(const r of expanded){const ring=r.polys[0][0];const xs=ring.map(p=>p[0]),zs=ring.map(p=>p[1]);for(let i=1;i<10&&!found;i++)for(let j=1;j<10&&!found;j++){const x=Math.min(...xs)+(Math.max(...xs)-Math.min(...xs))*i/10,z=Math.min(...zs)+(Math.max(...zs)-Math.min(...zs))*j/10;const hit=layer.targetAt(x,z);if(hit?.id===r.id)found=hit;}if(found)break;}
assert.ok(found);assert.equal(layer.strikeTarget(found.id,1),true);assert.equal(layer.damageOf(found.id),.15);assert.ok(layer.targetAt(found.x,found.z).y<found.y);assert.equal(layer.strikeTarget(found.id,-1),false);layer.restore();assert.deepEqual(arrays(),original);
// Exercise every imported parcel, not merely the first record. Interior samples
// must resolve to their own polygon and damage must leave every other owner intact.
let testedTargets=0;
for(const r of expanded){
 let hit=null;
 for(const poly of r.polys){
  const ring=poly[0],xs=ring.map(p=>p[0]),zs=ring.map(p=>p[1]);
  for(let i=1;i<20&&!hit;i++)for(let j=1;j<20&&!hit;j++){
   const x=Math.min(...xs)+(Math.max(...xs)-Math.min(...xs))*i/20,z=Math.min(...zs)+(Math.max(...zs)-Math.min(...zs))*j/20;
   const candidate=layer.targetAt(x,z);if(candidate?.id===r.id)hit=candidate;
  }
  if(hit)break;
 }
 assert.ok(hit,'No interior target for '+r.id);
 assert.ok(layer.strikeTarget(r.id,1));assert.equal(layer.damageOf(r.id),.15);
 assert.equal(layer.stats().damaged,1);
 for(const other of expanded)if(other.id!==r.id)assert.equal(layer.damageOf(other.id),0);
 assert.ok(layer.targetAt(hit.x,hit.z).y<hit.y);
 layer.restore();assert.equal(layer.damageOf(r.id),0);testedTargets++;
}
assert.equal(testedTargets,165);assert.deepEqual(arrays(),original);
console.log('PARK13_ALL_TARGETS '+JSON.stringify({testedTargets,restored:true}));
const zone=[{minX:-10,maxX:10,minZ:-5,maxZ:5}],parts=clipContextRect(zone,0,0,100,20);
assert.equal(parts.reduce((sum,p)=>sum+p.w*p.d,0),1800);assert.ok(parts.every(p=>!contextIntersectsExpansion(zone,p.x,p.z,p.w,p.d)));
assert.equal(clipContextRect(zone,0,0,3,3).length,0);assert.equal(clipContextRect(zone,30,30,4,4).length,1);
console.log('PARK13_SOURCE_AUDIT '+JSON.stringify({checks,baseline:baseline.length,stats:s,bounds:{min:box.min.toArray(),max:box.max.toArray()}}));
