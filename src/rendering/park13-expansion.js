// Park-to-13th integration pilot: pinned Viewer geometry, independent of damageable parcels.
import {createPark13Fragments} from './park13-fragments.js';
import {buildPark13Breach,createPark13BreachTracer} from './park13-breach.js';
import {renderPark13Record} from '../../broad-street/park13-integration/park13-background.mjs';
import {VIEWER_TO_GAME_X,VIEWER_TO_GAME_Z} from '../simulation/viewer-parcels.js';
export const SOURCE_COMMIT='8c101b70d6771ac50a0a9f7dc70af6696ff94f9e';
const FILES=['park13-GIS-precise-20261127.json','park13-southern-20261127.json','park13-public-realm-20261127.json','park13-southern-realm-full-20261127.json','park13-diamond-seam-20261127.json','park13-campus-links-20261127.json'];
export async function loadPark13Expansion(fetcher=fetch){
 const data=await Promise.all(FILES.map(async name=>{
  const r=await fetcher(new URL('../../broad-street/park13-integration/'+name,import.meta.url));
  if(!r.ok)throw Error('Park13 '+name+' HTTP '+r.status);return r.json();
 }));
 return preparePark13Expansion(...data);
}
export function preparePark13Expansion(pilot,south,realm,southRealm,seam,campus){
 if(pilot.records.length!==163||south.records.length!==2||pilot.held.length!==1||
 pilot.held[0].bin!=='1048635'||realm.roads.length!==274||southRealm.roads.length!==58||
 realm.sidewalks.length!==548||southRealm.sidewalks.length!==116||seam.roadSeams.length!==2||campus.roads.length!==11||campus.sidewalks.length!==22||campus.roadJoints.length!==1||campus.sidewalkJoints.length!==2||campus.pedestrianPaths.length!==42||campus.held.length||campus.heldJoints.length||campus.pedestrianHeld.length)throw Error('Unexpected Park13 source inventory');
 const records=[...pilot.records,...south.records];
 if(new Set(records.map(r=>r.id)).size!==165||records.some(r=>!r.replaceable||r.provisionalOnly||!Number.isFinite(r.height)||r.height<=0||!r.polys.length))throw Error('Invalid expansion records');
 const shift=r=>({minX:r.minX+VIEWER_TO_GAME_X,maxX:r.maxX+VIEWER_TO_GAME_X,minZ:r.minZ+VIEWER_TO_GAME_Z,maxZ:r.maxZ+VIEWER_TO_GAME_Z});
 // Preserve the main replacement areas. For campus links, suppress only
 // procedural context intersecting individual pavement envelopes rather than
 // clearing an entire bounding rectangle across the campus.
 const zones=[shift(realm.bounds),shift(southRealm.bounds),shift({minX:realm.bounds.maxX,maxX:southRealm.bounds.minX,minZ:southRealm.bounds.minZ,maxZ:southRealm.bounds.maxZ})];
 const campusItems=[...campus.roads,...campus.sidewalks,...campus.roadJoints,...campus.sidewalkJoints,...campus.pedestrianPaths];
 for(const item of campusItems){const p=item.polys.flat(2);zones.push(shift({minX:Math.min(...p.map(v=>v[0])),maxX:Math.max(...p.map(v=>v[0])),minZ:Math.min(...p.map(v=>v[1])),maxZ:Math.max(...p.map(v=>v[1]))}));}
 const surfaces=[
 {items:[...realm.sidewalks,...realm.sidewalkJoints,...southRealm.sidewalks,...southRealm.sidewalkJoints,...seam.sidewalkSeams,...campus.sidewalks,...campus.sidewalkJoints],color:0xadaaa0,y:-.215},
 {items:[...realm.roads,...realm.roadJoints,...southRealm.roads,...southRealm.roadJoints,...seam.roadSeams,...campus.roads,...campus.roadJoints],color:0x454a4c,y:-.195},
 {items:[...southRealm.pedestrianPaths,...campus.pedestrianPaths],color:0xb3a69a,y:-.21}
 ];
 return {records,zones,surfaces,held:pilot.held,source:SOURCE_COMMIT,realmCounts:{roads:343,sidewalks:686,pedestrianPaths:51,campusSurfaces:campusItems.length}};
}
const overlaps=(a,b)=>a.minX<b.maxX&&a.maxX>b.minX&&a.minZ<b.maxZ&&a.maxZ>b.minZ;
export function contextIntersectsExpansion(zones,x,z,w,d){
 const r={minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2};
 return zones?.some(b=>overlaps(r,b))??false;
}
// Axis-aligned procedural road and walk strips are cut, not merely hidden
// at their centers. Preserve both outside sides of a long crossing strip.
export function clipContextRect(zones,x,z,w,d){
 let pieces=[{minX:x-w/2,maxX:x+w/2,minZ:z-d/2,maxZ:z+d/2}];
 for(const zone of zones??[]){
  pieces=pieces.flatMap(r=>{
   if(!overlaps(r,zone))return [r];
   const a=Math.max(r.minX,zone.minX),b=Math.min(r.maxX,zone.maxX),c=Math.max(r.minZ,zone.minZ),e=Math.min(r.maxZ,zone.maxZ);
   return [{...r,maxX:a},{...r,minX:b},{minX:a,maxX:b,minZ:r.minZ,maxZ:c},{minX:a,maxX:b,minZ:e,maxZ:r.maxZ}].filter(p=>p.maxX-p.minX>1e-6&&p.maxZ-p.minZ>1e-6);
  });
 }
 return pieces.map(p=>({x:(p.minX+p.maxX)/2,z:(p.minZ+p.maxZ)/2,w:p.maxX-p.minX,d:p.maxZ-p.minZ}));
}
// Preserve intact lower storeys and concentrate deformation at the upper
// structure. Collision retains the conservative, flat effective roof cap.
export function park13DamageHeight(y,x,z,height,damage,impacts=[]){
 if(damage===0)return y;
 if(damage>=1)return y*.025;
 const cap=height*(1-.75*damage),hinge=Math.max(0,cap-height*.28);
 const upper=Math.max(0,Math.min(1,(y-hinge)/Math.max(.001,height-hinge)));
 const base=y<=hinge?y:hinge+(y-hinge)*(cap-hinge)/Math.max(.001,height-hinge);
 let dent=0;
 for(const p of impacts){
  const horizontal=Math.hypot(x-p.x,z-p.z)/p.radius;
  if(horizontal>=1)continue;
  const proximity=(1-horizontal)**2;
  const vertical=Math.max(0,1-Math.abs(y-p.y)/Math.max(2.5,height*.55));
  dent+=height*.24*p.budget*proximity*vertical*upper;
 }
 return Math.max(0,base-Math.min(dent,Math.max(0,base-hinge)*.8));
}
export function createPark13Expansion(T,data){
 const root=new T.Group();root.name='Park-to-13th GIS expansion candidate';root.position.set(VIEWER_TO_GAME_X,0,VIEWER_TO_GAME_Z);
 const architecture=new T.Group();architecture.name='Pinned source architecture';root.add(architecture);
 const material=new Map(),volumes=new Map(),details=new Map(),dummy=new T.Object3D(),cube=new T.BoxGeometry(1,1,1);
 const mat=c=>{if(!material.has(c))material.set(c,new T.MeshStandardMaterial({color:c,roughness:.95}));return material.get(c);};
 const shapePath=(r,C)=>{const p=new C();r.forEach(([x,z],i)=>i?p.lineTo(x,-z):p.moveTo(x,-z));p.closePath();return p;};
 let volumeCount=0,detailCount=0,triangles=0;
 const inventory=[],owners=new Map(),collisionParcels=[];
 for(const record of data.records){
  const polys=record.polys.map(poly=>poly.map(ring=>ring.map(([x,z])=>[x+VIEWER_TO_GAME_X,z+VIEWER_TO_GAME_Z])));
  const p=polys.flat(2),xs=p.map(v=>v[0]),zs=p.map(v=>v[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minZ=Math.min(...zs),maxZ=Math.max(...zs);
  const collision={id:record.id,name:record.address,polys,x:(minX+maxX)/2,z:(minZ+maxZ)/2,w:maxX-minX,d:maxZ-minZ,h:record.height,damage:0,expansion:true};
  collisionParcels.push(collision);
  const owner={id:record.id,record,collision,damage:0,volumes:[],details:[],impacts:[]};owners.set(record.id,owner);
  const stats=renderPark13Record(record,{
   block(poly,h,c,base=0){
    const shape=shapePath(poly[0],T.Shape);shape.holes=poly.slice(1).map(r=>shapePath(r,T.Path));
    const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,base,0);
    const pos=geo.attributes.position.array,normal=geo.attributes.normal.array;
    if(!pos.length||!pos.every(Number.isFinite)||!normal.every(Number.isFinite))throw Error('Invalid volume '+record.id);
    if(!volumes.has(c))volumes.set(c,[]);volumes.get(c).push({pos,normal,owner,color:c});volumeCount++;triangles+=pos.length/9;geo.dispose();
   },
   box(x,y,z,w,h,d,c,angle=0){
    if(![x,y,z,w,h,d,angle].every(Number.isFinite)||Math.min(w,h,d)<=0)throw Error('Invalid detail '+record.id);
    dummy.position.set(x,y,z);dummy.rotation.set(0,angle,0);dummy.scale.set(w,h,d);dummy.updateMatrix();
    if(!details.has(c))details.set(c,[]);details.get(c).push({matrix:dummy.matrix.clone(),owner});detailCount++;triangles+=12;
   }
  });inventory.push(stats);
 }
 for(const [c,items] of volumes){
  const n=items.reduce((s,i)=>s+i.pos.length,0),pos=new Float32Array(n),normal=new Float32Array(n);let at=0;
  for(const item of items){pos.set(item.pos,at);normal.set(item.normal,at);item.offset=at;at+=item.pos.length;}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('normal',new T.BufferAttribute(normal,3));geo.computeBoundingSphere();geo.attributes.position.setUsage(T.DynamicDrawUsage);geo.attributes.normal.setUsage(T.DynamicDrawUsage);for(const item of items)item.owner.volumes.push({attribute:geo.attributes.position,normal:geo.attributes.normal,offset:item.offset,original:item.pos,originalNormal:item.normal,color:item.color});
  const mesh=new T.Mesh(geo,mat(c));mesh.name='Park13 mass '+c;architecture.add(mesh);
 }
 for(const [c,items] of details){
  const mesh=new T.InstancedMesh(cube,mat(c),items.length);items.forEach((item,i)=>{mesh.setMatrixAt(i,item.matrix);item.owner.details.push({mesh,index:i,original:item.matrix,color:c});});mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.name='Park13 details '+c;architecture.add(mesh);
 }
 const publicRealm=new T.Group();publicRealm.name='Park13 provisional road widths';root.add(publicRealm);
 for(const {items,color,y} of data.surfaces){
  const pos=[];
  for(const item of items)for(const poly of item.polys){
   const rings=poly.map(r=>{const points=r.map(([x,z])=>new T.Vector2(x,z));if(points[0].equals(points.at(-1)))points.pop();return points;});
   const [outer,...holes]=rings,faces=T.ShapeUtils.triangulateShape(outer,holes),vertices=rings.flat();
   if(!faces.length)throw Error('Empty pavement triangulation '+item.id);
   for(const face of faces)for(const i of face){const p=vertices[i];pos.push(p.x,y,p.y);}
  }
  if(!pos.length)continue;
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.computeVertexNormals();geo.computeBoundingSphere();
  publicRealm.add(new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide})));
 }
 // Parcel-local upper-storey failure and impact dents; update only the
 // owned vertex/instance ranges. No new draw objects or per-frame rebuild.
 const changed=new Set(),matrix=new T.Matrix4(),breaches=new Map();
 // A single additional draw only while damaged shells exist. The shared mesh
 // is rebuilt on impact/repair, never on the animation tick.
 const breachMaterial=new T.MeshStandardMaterial({vertexColors:true,roughness:.95,side:T.DoubleSide});
 const breachMesh=new T.Mesh(new T.BufferGeometry(),breachMaterial);breachMesh.name='Park13 exposed structure';breachMesh.visible=false;root.add(breachMesh);
 const fragments=createPark13Fragments(T);root.add(fragments.mesh);
 let breachBatchDepth=0,breachDirty=false,breachRebuilds=0;
 function syncBreaches(){
  if(breachBatchDepth){breachDirty=true;return;}
  breachDirty=false;breachRebuilds++;
  const size=[...breaches.values()].reduce((sum,b)=>sum+b.positions.length,0),p=new Float32Array(size),c=new Float32Array(size);let offset=0;
  for(const b of breaches.values()){p.set(b.positions,offset);c.set(b.colors,offset);offset+=b.positions.length;}
  const old=breachMesh.geometry;
  const g=new T.BufferGeometry();if(size){g.setAttribute('position',new T.BufferAttribute(p,3));g.setAttribute('color',new T.BufferAttribute(c,3));g.computeVertexNormals();g.computeBoundingSphere();}
  breachMesh.geometry=g;breachMesh.visible=size>0;old.dispose();
 }
 function setDamage(id,value){const o=owners.get(id);if(!o||!Number.isFinite(value))return false;const d=Math.max(0,Math.min(1,value));if(d===o.damage)return true;
  if(d===0)o.impacts.length=0;
  o.damage=d;const h=d===1?.025:1-.75*d;o.collision.damage=d;o.collision.h=o.record.height*h;
  const height=o.record.height;
  const deform=(y,x,z)=>park13DamageHeight(y,x,z,height,d,o.impacts);
  const breach=buildPark13Breach(T,o,deform),hadBreach=breaches.has(id);
  if(breach){
   breaches.set(id,breach);
   o.collision.traceBreach=createPark13BreachTracer(breach.positions,VIEWER_TO_GAME_X,VIEWER_TO_GAME_Z);
  }else{
   breaches.delete(id);delete o.collision.traceBreach;
  }
  for(const v of o.volumes){
   const a=v.attribute.array,n=v.normal.array,off=v.offset;
   if(d===0){a.set(v.original,off);n.set(v.originalNormal,off);}
   else if(breach){
    // Degenerate original faces at a vertex belonging to this parcel.
    // Do not move hidden geometry into a neighbor or enlarge batch bounds.
    for(let i=0;i<v.original.length;i+=3){a[off+i]=v.original[0];a[off+i+1]=0;a[off+i+2]=v.original[2];}
    n.set(v.originalNormal,off);
   }
   else{
    for(let i=0;i<v.original.length;i+=3){
     const x=v.original[i],z=v.original[i+2];a[off+i]=x;a[off+i+1]=deform(v.original[i+1],x,z);a[off+i+2]=z;
    }
    // ExtrudeGeometry is non-indexed; recalculate only affected face normals.
    for(let i=off;i<off+v.original.length;i+=9){
     const ux=a[i+3]-a[i],uy=a[i+4]-a[i+1],uz=a[i+5]-a[i+2],vx=a[i+6]-a[i],vy=a[i+7]-a[i+1],vz=a[i+8]-a[i+2];
     const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,len=Math.hypot(nx,ny,nz);
     if(len<1e-9){n.set(v.originalNormal.subarray(i-off,i-off+9),i);continue;}
     for(let j=0;j<9;j+=3){n[i+j]=nx/len;n[i+j+1]=ny/len;n[i+j+2]=nz/len;}
    }
   }
   v.attribute.addUpdateRange(off,v.original.length);v.attribute.needsUpdate=true;v.normal.addUpdateRange(off,v.original.length);v.normal.needsUpdate=true;
  }
  for(const v of o.details){
   matrix.copy(v.original);
   if(d!==0){
    const e=matrix.elements,x=e[12],y=e[13],z=e[14],half=Math.abs(e[5])/2;
    const low=deform(y-half,x,z),high=deform(y+half,x,z);
    const factor=Math.max(.001,(high-low)/Math.max(.001,2*half));e[5]*=factor;e[13]=(low+high)/2;
    // When a breach exists, its replacement mesh contains the clipped
    // portions of intersecting facade boxes. Only hide those originals.
    // Otherwise retain the small-detail damage fallback.
    const span=Math.max(Math.hypot(e[0],e[2]),Math.hypot(e[8],e[10]),half*2);
    let local=0;
    for(const p of o.impacts){
     if(span>p.radius*1.5)continue;
     const dist=Math.hypot(x-p.x,(y-p.y)*.85,z-p.z)/p.radius;
     local+=p.budget*Math.max(0,1-dist);
    }
    // Use a near-zero, non-singular matrix; Three.js instance normals divide by squared axis scale.
    if(d>=1||(breach?breach.clippedDetails.has(v):local>=.045)){for(const i of [0,1,2,4,5,6,8,9,10])e[i]*=.0001;}
   }
   v.mesh.setMatrixAt(v.index,matrix);v.mesh.instanceMatrix.addUpdateRange(v.index*16,16);v.mesh.instanceMatrix.needsUpdate=true;
  }
  if(breach||hadBreach)syncBreaches();
  if(d)changed.add(id);else changed.delete(id);return true;
 }
 function restore(){
  breachBatchDepth++;
  try{for(const id of [...changed])setDamage(id,0);fragments.clear();}
  finally{breachBatchDepth--;if(!breachBatchDepth&&breachDirty)syncBreaches();}
 }
 function inside(r,x,z){let hit=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const [a,b]=r[i],[c,e]=r[j];if((b>z)!==(e>z)&&x<(c-a)*(z-b)/(e-b)+a)hit=!hit;}return hit;}
 function targetAt(x,z){if(!Number.isFinite(x)||!Number.isFinite(z))return null;const lx=x-VIEWER_TO_GAME_X,lz=z-VIEWER_TO_GAME_Z;for(const o of owners.values()){if(o.damage>=1)continue;const r=o.record;if(r.polys.some(p=>inside(p[0],lx,lz)&&!p.slice(1).some(h=>inside(h,lx,lz))))return {id:o.id,x,z,y:o.collision.h,damage:o.damage};}return null;}
 function strikeTarget(id,strength,point=null){const o=owners.get(id);if(!o||!Number.isFinite(strength)||strength<=0||o.damage>=1)return false;
  const budget=Math.min(1-o.damage,.15,strength*.15);
  if(point&&[point.x,point.y,point.z].every(Number.isFinite)){
   o.impacts.push({x:point.x-VIEWER_TO_GAME_X,y:Math.max(0,Math.min(o.record.height,point.y)),z:point.z-VIEWER_TO_GAME_Z,radius:Math.max(2.5,Math.min(9,Math.max(o.collision.w,o.collision.d)*.32)),budget});
   if(o.impacts.length>32)o.impacts.shift();
  }
  const applied=setDamage(id,o.damage+budget);
  if(applied&&point&&[point.x,point.y,point.z].every(Number.isFinite))fragments.spawn(point.x-VIEWER_TO_GAME_X,Math.max(.3,Math.min(o.record.height,point.y)),point.z-VIEWER_TO_GAME_Z,budget,o.volumes[0]?.color??0x95745c);
  return applied;
 }
 root.updateMatrixWorld(true);
 return {root,inventory,collisionParcels,setDamage,restore,targetAt,strikeTarget,update:fragments.update,damageOf:id=>owners.get(id)?.damage??null,stats:()=>({source:data.source,buildings:inventory.length,volumes:volumeCount,details:detailCount,components:volumeCount+detailCount,triangles,architectureDrawObjects:architecture.children.length,surfaceDrawObjects:publicRealm.children.length,realmCounts:data.realmCounts,held:data.held.length,damageable:false,parcelDamagePrototype:true,localizedDamage:true,fragments:fragments.stats(),breached:breaches.size,breachDrawObjects:breachMesh.visible?1:0,breachRebuilds,breachTriangles:[...breaches.values()].reduce((sum,b)=>sum+b.positions.length/9,0),removedTriangles:[...breaches.values()].reduce((sum,b)=>sum+b.removed,0),interiorTriangles:[...breaches.values()].reduce((sum,b)=>sum+b.interiorTriangles,0),clippedDetails:[...breaches.values()].reduce((sum,b)=>sum+b.clippedDetails.size,0),reliefRemovedTriangles:[...breaches.values()].reduce((sum,b)=>sum+b.reliefRemoved,0),impactSites:[...changed].reduce((sum,id)=>sum+owners.get(id).impacts.length,0),damaged:changed.size,visible:root.visible})};
}
