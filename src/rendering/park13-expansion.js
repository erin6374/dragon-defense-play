// Park-to-13th integration pilot: pinned Viewer geometry, independent of damageable parcels.
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
  const owner={id:record.id,record,collision,damage:0,volumes:[],details:[]};owners.set(record.id,owner);
  const stats=renderPark13Record(record,{
   block(poly,h,c,base=0){
    const shape=shapePath(poly[0],T.Shape);shape.holes=poly.slice(1).map(r=>shapePath(r,T.Path));
    const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,base,0);
    const pos=geo.attributes.position.array,normal=geo.attributes.normal.array;
    if(!pos.length||!pos.every(Number.isFinite)||!normal.every(Number.isFinite))throw Error('Invalid volume '+record.id);
    if(!volumes.has(c))volumes.set(c,[]);volumes.get(c).push({pos,normal,owner});volumeCount++;triangles+=pos.length/9;geo.dispose();
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
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('normal',new T.BufferAttribute(normal,3));geo.computeBoundingSphere();geo.attributes.position.setUsage(T.DynamicDrawUsage);for(const item of items)item.owner.volumes.push({attribute:geo.attributes.position,offset:item.offset,original:item.pos});
  const mesh=new T.Mesh(geo,mat(c));mesh.name='Park13 mass '+c;architecture.add(mesh);
 }
 for(const [c,items] of details){
  const mesh=new T.InstancedMesh(cube,mat(c),items.length);items.forEach((item,i)=>{mesh.setMatrixAt(i,item.matrix);item.owner.details.push({mesh,index:i,original:item.matrix});});mesh.instanceMatrix.setUsage(T.DynamicDrawUsage);mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.name='Park13 details '+c;architecture.add(mesh);
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
 // Parcel-local deformation preserves material batches and never mutates neighbors.
 const changed=new Set(),matrix=new T.Matrix4(),scale=new T.Matrix4();
 function setDamage(id,value){const o=owners.get(id);if(!o||!Number.isFinite(value))return false;const d=Math.max(0,Math.min(1,value));if(d===o.damage)return true;o.damage=d;const h=d===1?.025:1-.75*d;o.collision.damage=d;o.collision.h=o.record.height*h;
  for(const v of o.volumes){const a=v.attribute.array;for(let i=0;i<v.original.length;i+=3){a[v.offset+i]=v.original[i];a[v.offset+i+1]=v.original[i+1]*h;a[v.offset+i+2]=v.original[i+2];}v.attribute.addUpdateRange(v.offset,v.original.length);v.attribute.needsUpdate=true;}
  scale.makeScale(1,h,1);for(const v of o.details){if(d===0)matrix.copy(v.original);else matrix.multiplyMatrices(scale,v.original);v.mesh.setMatrixAt(v.index,matrix);v.mesh.instanceMatrix.addUpdateRange(v.index*16,16);v.mesh.instanceMatrix.needsUpdate=true;}
  if(d)changed.add(id);else changed.delete(id);return true;
 }
 function restore(){for(const id of [...changed])setDamage(id,0);}
 function inside(r,x,z){let hit=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const [a,b]=r[i],[c,e]=r[j];if((b>z)!==(e>z)&&x<(c-a)*(z-b)/(e-b)+a)hit=!hit;}return hit;}
 function targetAt(x,z){if(!Number.isFinite(x)||!Number.isFinite(z))return null;const lx=x-VIEWER_TO_GAME_X,lz=z-VIEWER_TO_GAME_Z;for(const o of owners.values()){if(o.damage>=1)continue;const r=o.record;if(r.polys.some(p=>inside(p[0],lx,lz)&&!p.slice(1).some(h=>inside(h,lx,lz))))return {id:o.id,x,z,y:r.height*(1-.75*o.damage),damage:o.damage};}return null;}
 function strikeTarget(id,strength){const o=owners.get(id);if(!o||!Number.isFinite(strength)||strength<=0||o.damage>=1)return false;return setDamage(id,o.damage+Math.min(.15,strength*.15));}
 root.updateMatrixWorld(true);
 return {root,inventory,collisionParcels,setDamage,restore,targetAt,strikeTarget,damageOf:id=>owners.get(id)?.damage??null,stats:()=>({source:data.source,buildings:inventory.length,volumes:volumeCount,details:detailCount,components:volumeCount+detailCount,triangles,architectureDrawObjects:architecture.children.length,surfaceDrawObjects:publicRealm.children.length,realmCounts:data.realmCounts,held:data.held.length,damageable:false,parcelDamagePrototype:true,damaged:changed.size,visible:root.visible})};
}
