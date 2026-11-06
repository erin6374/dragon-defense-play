// Batches static Revit/FBX draw objects by architectural material category.
// Source FBX is not altered. Rendering keeps the same local geometry and world transform;
// this is deliberately a *render* conversion, not an architectural semantics extractor.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

function roleFor(mesh){
 const s=((mesh.name||'')+' '+(mesh.material?.name||'')+' '+(mesh.parent?.name||'')).toLowerCase();
 if(/glass|glaz|window|curtain/.test(s))return 'glazing';
 if(/roof|membrane/.test(s))return 'roof';
 if(/brick|masonry|exterior wall/.test(s))return 'brick';
 if(/stone|limestone|concrete|column/.test(s))return 'limestone';
 if(/metal|frame|steel|rail|mullion/.test(s))return 'metal';
 const m=Array.isArray(mesh.material)?mesh.material[0]:mesh.material;
 if(m?.color){const c=m.color,hsl={h:0,s:0,l:0};c.getHSL(hsl);
  if(hsl.s<.10&&hsl.l>.65)return 'limestone';
  if(hsl.s>.15&&hsl.h<.12)return 'brick';
  if(hsl.l<.30)return 'metal';
 }
 return 'concrete';
}
function roleMaterial(role){
 const colors={glazing:0x668e9d,roof:0x343c41,brick:0x874f3f,limestone:0xc2b7a6,metal:0x48545c,concrete:0x8f928e};
 return new THREE.MeshStandardMaterial({color:colors[role],roughness:role==='glazing'?.29:role==='metal'?.58:.84,
  metalness:role==='glazing'?.15:role==='metal'?.38:.01,side:THREE.DoubleSide});
}
export function batchStaticBim(root,{maxVerticesPerBatch=320000,maxMeshesPerBatch=500,exteriorOnly=false,exteriorMargin=3.6,meshFilter=null}={}){
 root.updateWorldMatrix(true,true);
 const inverseRoot=new THREE.Matrix4().copy(root.matrixWorld).invert();
 const jobs=new Map(),skipped=[];let sourceMeshes=0,processed=0;
 const envelope=new THREE.Box3().setFromObject(root);
 let totalSourceTriangles=0,discardedTriangles=0,culledInteriorMeshes=0;
 const meshBounds=new THREE.Box3();
 const exteriorEvidence=(mesh)=>{
  if(!exteriorOnly)return true;
  const tag=((mesh.name||'')+' '+(mesh.parent?.name||'')+' '+(Array.isArray(mesh.material)?mesh.material.map(m=>m?.name).join(' '):mesh.material?.name||'')).toLowerCase();
  if(/(^|[^a-z])(interior|furniture|chair|desk|table|plumbing|sanitary|toilet|casework|duct|lighting fixture|diffuser|sprinkler|fire alarm)([^a-z]|$)/i.test(tag)&&!/exterior|façade|facade|curtain|glaz|window/.test(tag))return false;
  meshBounds.setFromObject(mesh);
  const near=(edge,coord)=>Math.abs(edge-coord)<=exteriorMargin;
  const side=near(meshBounds.min.x,envelope.min.x)||near(meshBounds.max.x,envelope.max.x)||near(meshBounds.min.z,envelope.min.z)||near(meshBounds.max.z,envelope.max.z);
  const roof=meshBounds.max.y>=envelope.max.y-exteriorMargin;
  const visibleName=/exterior|facade|façade|curtain|glaz|window|mullion|parapet|roof|membrane|brick|masonry|cladding|cornice|storefront/i.test(tag);
  const centerY=(meshBounds.min.y+meshBounds.max.y)*.5;
  // Large spanning elements often are slabs/structural walls. Keep those touching
  // the exterior envelope, but omit deep interior floors and fittings.
  return (side||roof||visibleName)&&centerY>=envelope.min.y+1.0;
 };

 root.traverse(mesh=>{
  if(!mesh.isMesh)return;
  sourceMeshes++;
  const originalTriangles=mesh.geometry?.index?.count/3||mesh.geometry?.attributes?.position?.count/3||0;
  totalSourceTriangles+=originalTriangles;
  if((meshFilter&&!meshFilter(mesh))||!exteriorEvidence(mesh)){
   culledInteriorMeshes++;discardedTriangles+=originalTriangles;return;
  }
  // Animated/skin-morphed content stays in source object; never silently corrupt it.
  if(mesh.isSkinnedMesh||mesh.morphTargetInfluences?.length){skipped.push(mesh);return;}
  const geometry=mesh.geometry;
  if(!geometry?.attributes?.position||geometry.attributes.position.count>600000){skipped.push(mesh);return;}
  const role=roleFor(mesh);
  if(!jobs.has(role))jobs.set(role,[]);
  jobs.get(role).push(mesh);
 });
 const group=new THREE.Group();group.name='GPU-BATCHED-TECH-FREIRE';
 group.position.copy(root.position);group.quaternion.copy(root.quaternion);group.scale.copy(root.scale);
 let batches=0,failed=0;const failedMeshes=[];
 for(const [role,meshes] of jobs){
  const material=roleMaterial(role);let pending=[],pendingMeshes=[],count=0;
  const flush=()=>{
   if(!pending.length)return;
   try{
    const combined=mergeGeometries(pending,false);
    if(!combined)throw new Error('Geometry attributes not mergeable');
    const visible=new THREE.Mesh(combined,material);
    visible.name='batched-'+role+'-'+batches;visible.receiveShadow=true;visible.castShadow=false;visible.frustumCulled=false;
    group.add(visible);batches++;
   }catch(e){failed+=pending.length;failedMeshes.push(...pendingMeshes);console.warn('BIM group merge failed:',role,e);}
   finally{for(const p of pending)p.dispose();pending=[];pendingMeshes=[];count=0;}
  };
  for(const mesh of meshes){
   try{
    const localTransform=new THREE.Matrix4().multiplyMatrices(inverseRoot,mesh.matrixWorld);
    let geometry=mesh.geometry.clone();geometry.applyMatrix4(localTransform);
    if(geometry.index){const expanded=geometry.toNonIndexed();geometry.dispose();geometry=expanded;}
    if(!geometry.attributes.normal)geometry.computeVertexNormals();
    const n=geometry.attributes.position.count;
    if(!geometry.attributes.uv)geometry.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(n*2),2));
    // Only retain attributes guaranteed to be consistent across static FBX meshes.
    for(const name of Object.keys(geometry.attributes))if(!['position','normal','uv'].includes(name))geometry.deleteAttribute(name);
    geometry.clearGroups();geometry.setDrawRange(0,Infinity);
    if(pending.length && (count+n>maxVerticesPerBatch||pending.length>=maxMeshesPerBatch))flush();
    pending.push(geometry);pendingMeshes.push(mesh);count+=n;processed++;
   }catch(e){failed++;skipped.push(mesh);console.warn('Skipped BIM mesh',mesh.name,e);}
  }
  flush();
 }
 // Skipped geometry remains available, in the source root's local coordinate system.
 if(skipped.length||failedMeshes.length){
  const extras=new THREE.Group();extras.name='unbatchable-BIM-components';group.add(extras);
  // Reparent while preserving exact world positions.
  group.updateWorldMatrix(true,false);
  for(const mesh of [...skipped,...failedMeshes])extras.attach(mesh);
 }
 if(!group.children.length)return {model:root,sourceMeshes,batches:0,processed:0,failed:sourceMeshes,used:false,culledInteriorMeshes:0,discardedTriangles:0,totalSourceTriangles};
 return {model:group,sourceMeshes,batches,processed,failed,used:true,culledInteriorMeshes,discardedTriangles:Math.round(discardedTriangles),totalSourceTriangles:Math.round(totalSourceTriangles)};
}
