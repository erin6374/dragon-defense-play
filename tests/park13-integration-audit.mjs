import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import * as T from '../vendor/three/build/three.module.js';
import {preparePark13Expansion,createPark13Expansion,clipContextRect,contextIntersectsExpansion,park13DamageHeight} from '../src/rendering/park13-expansion.js';
import {viewerParcels,schoolGameEnvelope,VIEWER_TO_GAME_X,VIEWER_TO_GAME_Z} from '../src/simulation/viewer-parcels.js';
import {buildPark13Breach,createPark13BreachTracer} from '../src/rendering/park13-breach.js';
import {createPark13Fragments} from '../src/rendering/park13-fragments.js';
import {traceMeteorCollision} from '../src/simulation/meteor-collision.js';
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
const normals=()=>meshes.filter(m=>!m.isInstancedMesh).map(m=>Array.from(m.geometry.attributes.normal.array));
const originalNormals=normals();
const site={x:0,y:12,z:0,radius:5,budget:.15};
assert.equal(park13DamageHeight(3,0,0,12,.15,[site]),3);
assert.ok(park13DamageHeight(12,0,0,12,.15,[site])<park13DamageHeight(12,8,0,12,.15,[site]));
assert.equal(park13DamageHeight(12,8,0,12,.15,[site]),12*(1-.75*.15));
assert.equal(park13DamageHeight(12,0,0,12,0,[site]),12);
assert.equal(layer.setDamage('unknown',.5),false);assert.equal(layer.setDamage(id,NaN),false);
assert.equal(layer.setDamage(id,.15),true);assert.equal(layer.damageOf(id),.15);assert.equal(layer.damageOf(other),0);
const partial=arrays();assert.ok(partial.some((a,i)=>a.some((v,j)=>v!==original[i][j])));
assert.equal(layer.setDamage(id,1),true);assert.equal(layer.stats().damaged,1);
const collapsed=arrays();assert.ok(collapsed.some((a,i)=>a.some((v,j)=>v!==partial[i][j])));
layer.restore();assert.equal(layer.stats().damaged,0);assert.deepEqual(arrays(),original);
assert.equal(layer.stats().architectureDrawObjects,80);
assert.equal(layer.targetAt(NaN,0),null);assert.equal(layer.targetAt(1e6,1e6),null);
let found=null;for(const r of expanded){const ring=r.polys[0][0];const xs=ring.map(p=>p[0]),zs=ring.map(p=>p[1]);for(let i=1;i<10&&!found;i++)for(let j=1;j<10&&!found;j++){const x=Math.min(...xs)+(Math.max(...xs)-Math.min(...xs))*i/10,z=Math.min(...zs)+(Math.max(...zs)-Math.min(...zs))*j/10;const hit=layer.targetAt(x,z);if(hit?.id===r.id)found=hit;}if(found)break;}
assert.ok(found);assert.equal(layer.strikeTarget(found.id,1,{x:found.x,y:found.y,z:found.z}),true);assert.equal(layer.stats().impactSites,1);assert.ok(normals().flat().every(Number.isFinite));assert.equal(layer.damageOf(found.id),.15);assert.ok(layer.targetAt(found.x,found.z).y<found.y);assert.equal(layer.strikeTarget(found.id,-1),false);layer.restore();assert.deepEqual(arrays(),original);
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
 const sweep=traceMeteorCollision({x:hit.x,y:hit.y+40,z:hit.z},{x:hit.x,y:0,z:hit.z},baseline,null,false,layer.collisionParcels);
 assert.equal(sweep.kind,'expansion');assert.equal(sweep.building.id,r.id);assert.ok(Math.abs(sweep.point.y-hit.y)<1e-6);
 assert.ok(layer.strikeTarget(r.id,1));assert.equal(layer.damageOf(r.id),.15);
 assert.equal(layer.stats().damaged,1);
 for(const other of expanded)if(other.id!==r.id)assert.equal(layer.damageOf(other.id),0);
 assert.ok(layer.targetAt(hit.x,hit.z).y<hit.y);
 const reduced=traceMeteorCollision({x:hit.x,y:hit.y+40,z:hit.z},{x:hit.x,y:0,z:hit.z},baseline,null,false,layer.collisionParcels);
 assert.equal(reduced.kind,'expansion');assert.equal(reduced.building.id,r.id);
 assert.ok(Math.abs(reduced.point.y-layer.targetAt(hit.x,hit.z).y)<1e-6);
 assert.equal(layer.setDamage(r.id,1),true);
 assert.equal(layer.targetAt(hit.x,hit.z),null);
 const collapsedHit=traceMeteorCollision({x:hit.x,y:hit.y+40,z:hit.z},{x:hit.x,y:0,z:hit.z},baseline,null,false,layer.collisionParcels);
 assert.equal(collapsedHit.kind,'ground','Collapsed parcel must no longer block a meteor: '+r.id);
 assert.equal(layer.strikeTarget(r.id,1),false);
 layer.restore();assert.equal(layer.damageOf(r.id),0);
 const repaired=traceMeteorCollision({x:hit.x,y:hit.y+40,z:hit.z},{x:hit.x,y:0,z:hit.z},baseline,null,false,layer.collisionParcels);
 assert.equal(repaired.building.id,r.id);assert.ok(Math.abs(repaired.point.y-hit.y)<1e-6);testedTargets++;
}
assert.equal(testedTargets,165);assert.deepEqual(arrays(),original);assert.deepEqual(normals(),originalNormals);assert.equal(layer.stats().impactSites,0);
console.log('PARK13_ALL_TARGETS '+JSON.stringify({testedTargets,restored:true}));
// Synthetic courtyard and adjacent parcel exercise horizontal edge entry,
// ordering independent of inventory order, and transparent footprint holes.
const ring=(x0,z0,x1,z1)=>[[x0,z0],[x1,z0],[x1,z1],[x0,z1],[x0,z0]];
const courtyard={id:'courtyard',x:5,z:5,w:10,d:10,h:12,damage:0,polys:[[ring(0,0,10,10),ring(3,3,7,7)]]};
const adjacent={id:'adjacent',x:15,z:5,w:10,d:10,h:12,damage:0,polys:[[ring(10,0,20,10)]]};
const trace=(start,end,parcels=[adjacent,courtyard])=>traceMeteorCollision(start,end,[],null,false,parcels);
const side=trace({x:-5,y:10,z:5},{x:18,y:2,z:5});
assert.equal(side.kind,'expansion');assert.equal(side.building.id,'courtyard');assert.ok(Math.abs(side.point.x)<1e-4);
const throughHole=trace({x:5,y:25,z:5},{x:5,y:0,z:5});
assert.equal(throughHole.kind,'ground');
const innerWall=trace({x:5,y:10,z:5},{x:9,y:2,z:5});
assert.equal(innerWall.building.id,'courtyard');assert.ok(Math.abs(innerWall.point.x-7)<1e-4);
const reverse=trace({x:25,y:10,z:5},{x:-5,y:2,z:5},[courtyard,adjacent]);
assert.equal(reverse.building.id,'adjacent');assert.ok(Math.abs(reverse.point.x-20)<1e-4);
courtyard.damage=1;
const bypass=trace({x:-5,y:10,z:5},{x:18,y:2,z:5});
assert.equal(bypass.building.id,'adjacent');assert.ok(Math.abs(bypass.point.x-10)<1e-4);
console.log('PARK13_COLLISION_EDGE_CASES '+JSON.stringify({sideEntry:true,courtyardOpening:true,innerWall:true,nearestOwner:true,collapsedBypass:true,allParcelHeightRepair:testedTargets}));

// Independent residential shell fixture: hit roof center and side wall,
// verify actual triangle removal and exposed floors, then exact restoration.
const fixtureRecord=(id,x)=>({id,replaceable:true,provisionalOnly:false,address:id,height:10,polys:[[ring(x,0,x+5,12)]]});
const fixture=createPark13Expansion(T,{records:[fixtureRecord('park13-fixture-a',0),fixtureRecord('park13-fixture-b',8)],surfaces:[],held:[],source:'fixture',realmCounts:{}});
const ax=VIEWER_TO_GAME_X+2.5,az=VIEWER_TO_GAME_Z+6;
const snapFixture=()=>fixture.root.children[0].children.map(m=>Array.from(m.isInstancedMesh?m.instanceMatrix.array:m.geometry.attributes.position.array));
const pristine=snapFixture(),initialDraws=fixture.stats().architectureDrawObjects;
assert.equal(fixture.stats().breachDrawObjects,0);
assert.ok(fixture.strikeTarget('park13-fixture-a',1,{x:ax,y:10,z:az}));
const breach=fixture.stats();
assert.ok(breach.fragments.active>0);assert.equal(breach.fragments.drawObjects,1);
assert.equal(breach.fragments.capacity,256);
assert.equal(breach.breached,1);assert.equal(breach.breachDrawObjects,1);
assert.ok(breach.removedTriangles>0);assert.ok(breach.interiorTriangles>0);assert.ok(breach.breachTriangles>0);
assert.equal(breach.architectureDrawObjects,initialDraws);assert.equal(fixture.damageOf('park13-fixture-b'),0);
const shell=fixture.root.children.find(m=>m.name==='Park13 exposed structure');
assert.ok(shell.visible);assert.ok(shell.geometry.attributes.position.array.every(Number.isFinite));
fixture.root.updateMatrixWorld(true);
const ray=new T.Raycaster(new T.Vector3(ax,20,az),new T.Vector3(0,-1,0));
const openHits=ray.intersectObject(shell,false);
assert.ok(openHits.length>0,'Expected interior floor under roof breach');
assert.ok(openHits[0].point.y<fixture.targetAt(ax,az).y-.4,'Roof opening should expose a lower deck');
const startOpen={x:ax,y:20,z:az},endOpen={x:ax,y:0,z:az};
const throughRoof=traceMeteorCollision(startOpen,endOpen,[],null,false,fixture.collisionParcels);
assert.equal(throughRoof.kind,'expansion');assert.equal(throughRoof.building.id,'park13-fixture-a');
assert.ok(Math.abs(throughRoof.point.y-openHits[0].point.y)<1e-4,'Collision must agree with rendered breach surface');
assert.ok(fixture.strikeTarget('park13-fixture-b',1,{x:VIEWER_TO_GAME_X+8,y:5,z:az}));
assert.equal(fixture.stats().breached,2);assert.equal(fixture.stats().breachDrawObjects,1);
const rebuildsBeforeRepair=fixture.stats().breachRebuilds;
fixture.restore();assert.equal(fixture.stats().breachRebuilds,rebuildsBeforeRepair+1);
assert.equal(fixture.stats().fragments.active,0);assert.equal(fixture.stats().fragments.drawObjects,0);
assert.equal(fixture.stats().breached,0);assert.equal(fixture.stats().breachDrawObjects,0);
assert.deepEqual(snapFixture(),pristine);
assert.ok(fixture.collisionParcels.every(b=>!b.traceBreach));
const repairedRoof=traceMeteorCollision(startOpen,endOpen,[],null,false,fixture.collisionParcels);
assert.equal(repairedRoof.building.id,'park13-fixture-a');assert.equal(repairedRoof.point.y,10);
// Same-frame impact publication: collision changes immediately, even
// before the shared render mesh is flushed at the outer transaction.
const beforeBatch=fixture.stats().breachRebuilds;
fixture.batchDamage(()=>{
 assert.ok(fixture.strikeTarget('park13-fixture-a',1,{x:ax,y:10,z:az}));
 assert.equal(fixture.stats().breachRebuilds,beforeBatch);
 assert.ok(fixture.collisionParcels[0].traceBreach);
 const next=traceMeteorCollision(startOpen,endOpen,[],null,false,fixture.collisionParcels);
 assert.ok(next.point.y<9);
 fixture.batchDamage(()=>{
  assert.ok(fixture.strikeTarget('park13-fixture-b',1,{x:VIEWER_TO_GAME_X+8,y:5,z:az}));
 });
 assert.equal(fixture.stats().breachRebuilds,beforeBatch);
});
assert.equal(fixture.stats().breachRebuilds,beforeBatch+1);
assert.equal(fixture.stats().breached,2);
fixture.restore();assert.deepEqual(snapFixture(),pristine);
const beforeError=fixture.stats().breachRebuilds;
let caught=false;
try{fixture.batchDamage(()=>{fixture.strikeTarget('park13-fixture-a',1,{x:ax,y:10,z:az});throw Error('fixture');});}catch(e){caught=e.message==='fixture';}
assert.ok(caught);assert.equal(fixture.stats().breachRebuilds,beforeError+1);
fixture.restore();assert.deepEqual(snapFixture(),pristine);
console.log('PARK13_DAMAGE_BATCH '+JSON.stringify({sameFrameRebuilds:1,nested:true,immediateCollision:true,exceptionFlush:true}));
// Two disjoint triangles form a roof with a gap; a lower deck catches
// the through-gap trajectory. Offset tests catch world/local confusion.
const triangle=(x,y,z)=>[x,y,z,x+2,y,z,x,y,z+2];
const tracer=createPark13BreachTracer([...triangle(0,8,0),...triangle(4,8,0),...triangle(2,3,0)],100,-50);
const segment=(x,z)=>[{x:x+100,y:10,z:z-50},{x:x+100,y:0,z:z-50}];
assert.ok(Math.abs(tracer(...segment(.5,.5))-.2)<1e-7);
assert.ok(Math.abs(tracer(...segment(2.5,.5))-.7)<1e-7);
assert.equal(tracer(...segment(3.9,1.9)),null);
assert.equal(tracer(...segment(2.5,.5),.5),null);
assert.equal(tracer(...segment(100,100)),null);
console.log('PARK13_BREACH_FIXTURE '+JSON.stringify({roofOpening:true,sideOpening:true,interiorDecks:true,sharedDamageDraw:true,restored:true}));

// Isolated pool test uses real Three.js matrices and a small capacity to
// force recycling. Validate visible motion, bounded memory and cleanup.
const pool=createPark13Fragments(T,32);
assert.equal(pool.spawn(NaN,4,0,.15),0);
assert.equal(pool.spawn(0,8,0,.15),17);
assert.equal(pool.stats().active,17);
const firstMatrix=new T.Matrix4();pool.mesh.getMatrixAt(0,firstMatrix);
pool.update(.05);
const movedMatrix=new T.Matrix4();pool.mesh.getMatrixAt(0,movedMatrix);
assert.notDeepEqual(movedMatrix.elements,firstMatrix.elements);
for(let i=0;i<20;i++)pool.spawn(i,12,0,.15);
assert.equal(pool.stats().active,32);assert.ok(pool.stats().evicted>0);
assert.equal(pool.mesh.count,32);assert.equal(pool.stats().drawObjects,1);
for(let i=0;i<120;i++)pool.update(.05);
assert.equal(pool.stats().active,0);assert.equal(pool.mesh.visible,false);
pool.spawn(0,2,0,.05);pool.clear();
assert.equal(pool.mesh.count,0);assert.equal(pool.mesh.visible,false);assert.equal(pool.stats().spawned,0);
console.log('PARK13_FRAGMENT_POOL '+JSON.stringify({bounded:32,motion:true,expired:true,repairCleared:true}));
const zone=[{minX:-10,maxX:10,minZ:-5,maxZ:5}],parts=clipContextRect(zone,0,0,100,20);
assert.equal(parts.reduce((sum,p)=>sum+p.w*p.d,0),1800);assert.ok(parts.every(p=>!contextIntersectsExpansion(zone,p.x,p.z,p.w,p.d)));
assert.equal(clipContextRect(zone,0,0,3,3).length,0);assert.equal(clipContextRect(zone,30,30,4,4).length,1);
console.log('PARK13_SOURCE_AUDIT '+JSON.stringify({checks,baseline:baseline.length,stats:s,bounds:{min:box.min.toArray(),max:box.max.toArray()}}));


// Broad roof cladding that spans an impact must be cut, not merely moved
// or left covering an opening. Preserve the unaffected end and distant box.
const reliefBox=(x,y,z,w,h,d)=>({original:{elements:[w,0,0,0,0,h,0,0,0,0,d,0,x,y,z,1]},color:0x999999});
const spanning=reliefBox(5,10.1,5,8,.2,3),distant=reliefBox(10,10.1,10,1,.2,1);
const reliefOwner={record:{height:10},collision:{w:12,d:12},damage:.15,impacts:[{x:5,y:10,z:5,radius:4,budget:.15}],
 volumes:[{color:0x996633,original:new Float32Array([0,10,0,12,10,0,12,10,12,0,10,0,12,10,12,0,10,12])}],details:[spanning,distant]};
const relief=buildPark13Breach(T,reliefOwner,y=>y);
assert.ok(relief.removed>0&&relief.reliefRemoved>0);
assert.ok(relief.clippedDetails.has(spanning));assert.ok(!relief.clippedDetails.has(distant));
const reliefTrace=createPark13BreachTracer(relief.positions);
const reliefRay=(x,z)=>reliefTrace({x,y:20,z},{x,y:0,z});
assert.equal(reliefRay(5,5),null);assert.ok(Math.abs(reliefRay(1,1)-.5)<1e-7);
assert.ok(reliefRay(8.5,5)<.5);
assert.ok(relief.positions.every(Number.isFinite));assert.equal(relief.positions.length,relief.colors.length);
console.log('PARK13_RELIEF_BREACH '+JSON.stringify({openingClear:true,unaffectedPanelPreserved:true,removed:relief.removed,reliefRemoved:relief.reliefRemoved}));
