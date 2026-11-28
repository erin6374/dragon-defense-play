import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from '../vendor/three/build/three.module.js';
import {preparePark13Expansion,createPark13Expansion,clipContextRect,contextIntersectsExpansion} from '../src/rendering/park13-expansion.js';
import {viewerParcels,schoolGameEnvelope,VIEWER_TO_GAME_X,VIEWER_TO_GAME_Z} from '../src/simulation/viewer-parcels.js';
import {intersectionArea,AREA_TOLERANCE} from '../broad-street/park13-integration/park13-polygon-overlap.mjs';
const root=new URL('../broad-street/park13-integration/',import.meta.url);
const read=async name=>JSON.parse(await readFile(new URL(name,root),'utf8'));
const data=preparePark13Expansion(...await Promise.all(['park13-GIS-precise-20261127.json','park13-southern-20261127.json','park13-public-realm-20261127.json','park13-southern-realm-full-20261127.json','park13-diamond-seam-20261127.json'].map(read)));
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
const layer=createPark13Expansion(T,data),s=layer.stats();
assert.equal(s.buildings,165);assert.equal(s.components,2893);assert.equal(s.triangles,44260);assert.equal(s.architectureDrawObjects,80);assert.equal(s.damageable,false);
assert.equal(s.surfaceDrawObjects,3);assert.ok(!data.records.some(r=>r.bin==='1048635'));
const box=new T.Box3().setFromObject(layer.root);assert.ok([...box.min.toArray(),...box.max.toArray()].every(Number.isFinite));
const zone=[{minX:-10,maxX:10,minZ:-5,maxZ:5}],parts=clipContextRect(zone,0,0,100,20);
assert.equal(parts.reduce((sum,p)=>sum+p.w*p.d,0),1800);assert.ok(parts.every(p=>!contextIntersectsExpansion(zone,p.x,p.z,p.w,p.d)));
assert.equal(clipContextRect(zone,0,0,3,3).length,0);assert.equal(clipContextRect(zone,30,30,4,4).length,1);
console.log('PARK13_SOURCE_AUDIT '+JSON.stringify({checks,baseline:baseline.length,stats:s,bounds:{min:box.min.toArray(),max:box.max.toArray()}}));
