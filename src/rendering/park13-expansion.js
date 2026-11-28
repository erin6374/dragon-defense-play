// Park-to-13th integration pilot: pinned Viewer geometry, independent of damageable parcels.
import {renderPark13Record} from '../../broad-street/park13-integration/park13-background.mjs';
import {VIEWER_TO_GAME_X,VIEWER_TO_GAME_Z} from '../simulation/viewer-parcels.js';
export const SOURCE_COMMIT='8c101b70d6771ac50a0a9f7dc70af6696ff94f9e';
const FILES=['park13-GIS-precise-20261127.json','park13-southern-20261127.json','park13-public-realm-20261127.json','park13-southern-realm-full-20261127.json','park13-diamond-seam-20261127.json'];
export async function loadPark13Expansion(fetcher=fetch){
 const data=await Promise.all(FILES.map(async name=>{
  const r=await fetcher(new URL('../../broad-street/park13-integration/'+name,import.meta.url));
  if(!r.ok)throw Error('Park13 '+name+' HTTP '+r.status);return r.json();
 }));
 return preparePark13Expansion(...data);
}
export function preparePark13Expansion(pilot,south,realm,southRealm,seam){
 if(pilot.records.length!==163||south.records.length!==2||pilot.held.length!==1||
 pilot.held[0].bin!=='1048635'||realm.roads.length!==274||southRealm.roads.length!==58||
 realm.sidewalks.length!==548||southRealm.sidewalks.length!==116||seam.roadSeams.length!==2)throw Error('Unexpected Park13 source inventory');
 const records=[...pilot.records,...south.records];
 if(new Set(records.map(r=>r.id)).size!==165||records.some(r=>!r.replaceable||r.provisionalOnly||!Number.isFinite(r.height)||r.height<=0||!r.polys.length))throw Error('Invalid expansion records');
 const shift=r=>({minX:r.minX+VIEWER_TO_GAME_X,maxX:r.maxX+VIEWER_TO_GAME_X,minZ:r.minZ+VIEWER_TO_GAME_Z,maxZ:r.maxZ+VIEWER_TO_GAME_Z});
 // Pilot and southern strip only. Keep campus links outside these zones for the later seam audit.
 const zones=[shift(realm.bounds),shift(southRealm.bounds),shift({minX:realm.bounds.maxX,maxX:southRealm.bounds.minX,minZ:southRealm.bounds.minZ,maxZ:southRealm.bounds.maxZ})];
 const surfaces=[
 {items:[...realm.sidewalks,...realm.sidewalkJoints,...southRealm.sidewalks,...southRealm.sidewalkJoints,...seam.sidewalkSeams],color:0xadaaa0,y:-.215},
 {items:[...realm.roads,...realm.roadJoints,...southRealm.roads,...southRealm.roadJoints,...seam.roadSeams],color:0x454a4c,y:-.195},
 {items:southRealm.pedestrianPaths,color:0xb3a69a,y:-.21}
 ];
 return {records,zones,surfaces,held:pilot.held,source:SOURCE_COMMIT};
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
 const inventory=[];
 for(const record of data.records){
  const stats=renderPark13Record(record,{
   block(poly,h,c,base=0){
    const shape=shapePath(poly[0],T.Shape);shape.holes=poly.slice(1).map(r=>shapePath(r,T.Path));
    const geo=new T.ExtrudeGeometry(shape,{depth:h,bevelEnabled:false});geo.rotateX(-Math.PI/2);geo.translate(0,base,0);
    const pos=geo.attributes.position.array,normal=geo.attributes.normal.array;
    if(!pos.length||!pos.every(Number.isFinite)||!normal.every(Number.isFinite))throw Error('Invalid volume '+record.id);
    if(!volumes.has(c))volumes.set(c,[]);volumes.get(c).push({pos,normal});volumeCount++;triangles+=pos.length/9;geo.dispose();
   },
   box(x,y,z,w,h,d,c,angle=0){
    if(![x,y,z,w,h,d,angle].every(Number.isFinite)||Math.min(w,h,d)<=0)throw Error('Invalid detail '+record.id);
    dummy.position.set(x,y,z);dummy.rotation.set(0,angle,0);dummy.scale.set(w,h,d);dummy.updateMatrix();
    if(!details.has(c))details.set(c,[]);details.get(c).push(dummy.matrix.clone());detailCount++;triangles+=12;
   }
  });inventory.push(stats);
 }
 for(const [c,items] of volumes){
  const n=items.reduce((s,i)=>s+i.pos.length,0),pos=new Float32Array(n),normal=new Float32Array(n);let at=0;
  for(const item of items){pos.set(item.pos,at);normal.set(item.normal,at);at+=item.pos.length;}
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.BufferAttribute(pos,3));geo.setAttribute('normal',new T.BufferAttribute(normal,3));geo.computeBoundingSphere();
  const mesh=new T.Mesh(geo,mat(c));mesh.name='Park13 mass '+c;architecture.add(mesh);
 }
 for(const [c,items] of details){
  const mesh=new T.InstancedMesh(cube,mat(c),items.length);items.forEach((m,i)=>mesh.setMatrixAt(i,m));mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.name='Park13 details '+c;architecture.add(mesh);
 }
 const publicRealm=new T.Group();publicRealm.name='Park13 provisional road widths';root.add(publicRealm);
 for(const {items,color,y} of data.surfaces){
  const pos=[];
  for(const item of items){const ring=item.polys[0][0];for(let i=1;i<ring.length-2;i++)for(const j of [0,i+1,i])pos.push(ring[j][0],y,ring[j][1]);}
  if(!pos.length)continue;
  const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(pos,3));geo.computeVertexNormals();geo.computeBoundingSphere();
  publicRealm.add(new T.Mesh(geo,new T.MeshStandardMaterial({color,roughness:1,side:T.DoubleSide})));
 }
 root.updateMatrixWorld(true);
 return {root,inventory,stats:()=>({source:data.source,buildings:inventory.length,volumes:volumeCount,details:detailCount,components:volumeCount+detailCount,triangles,architectureDrawObjects:architecture.children.length,surfaceDrawObjects:publicRealm.children.length,held:data.held.length,damageable:false,visible:root.visible})};
}
