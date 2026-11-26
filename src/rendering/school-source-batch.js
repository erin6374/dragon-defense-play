import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// The exported model uses one neutral material. Color the actual named
// components without rebuilding any opening, façade panel, or roof surface.
const palette={glass:0x75959b,metal:0x9da6a6,spandrel:0x87968e,brick:0x856657,
 roof:0x39434a,stone:0xc2b7a4,door:0x53636c,interior:0x8f8b84};
function surface(mesh){
 const name=mesh.name.toLowerCase();
 if(/handrail|guardrail|top_rail/.test(name))return 'interior';
 if(/mullion|window_frame/.test(name))return 'metal';
 if(/spandrel|system_panel_solid/.test(name))return 'spandrel';
 if(/glazed|glass|glazing/.test(name))return 'glass';
 if(/door/.test(name))return 'door';
 if(/brick|exterior.*cmu/.test(name))return 'brick';
 if(/cornice|lintel|sill|parapet/.test(name))return 'stone';
 if(/roof|membrane|^mass_93_mass_93_971579$/.test(name))return 'roof';
 if(/^(?:exterior_)?mass_/.test(name))return 'brick';
 return 'interior';
}
function reverseTriangleWinding(geometry) {
 for(const {array,itemSize} of Object.values(geometry.attributes)){
  for(let offset=0;offset<array.length;offset+=3*itemSize){
   for(let component=0;component<itemSize;component++){
    const b=offset+itemSize+component,c=b+itemSize;
    const value=array[b];
    array[b]=array[c];
    array[c]=value;
   }
  }
 }
}

// Keep exact source triangles, but avoid a single giant interior draw batch
// whose bounding sphere keeps every floor and room visible to the renderer.
export function schoolBatchRegion(role,box){
 if(role!=='interior'||!box)return 'shell';
 const {min,max}=box;
 const span=[max.x-min.x,max.y-min.y,max.z-min.z];
 if(span.some(v=>!Number.isFinite(v)||v<0))return 'unbounded';
 if(span[0]>48||span[1]>22||span[2]>48)return 'large';
 const x=Math.floor((min.x+max.x)/2/40);
 const y=Math.floor((min.y+max.y)/2/18);
 const z=Math.floor((min.z+max.z)/2/40);
 return x+':'+y+':'+z;
}
export function batchSchoolSource(source, prepareMaterial) {
 const model=new THREE.Group();
 model.position.copy(source.position);
 model.scale.copy(source.scale);
 const buckets=new Map(), materials=new Map();
 const getMaterial=(original,role)=>{
  const usePalette=original.name==='__DEFAULT';
  const key=(usePalette?'palette':original.id)+'|'+role+'|'+original.side;
  if(!materials.has(key)){
   const isGlass=role==='glass';
   const isMatte=['brick','roof','stone','spandrel','interior','door'].includes(role);
   const material=usePalette?(
    isGlass?new THREE.MeshPhysicalMaterial({
     color:0x5e8ea8,roughness:.08,metalness:.30,
     clearcoat:1.0,clearcoatRoughness:.06,envMapIntensity:2.5,
     transparent:true,opacity:.82,depthWrite:false,side:original.side
    }):new THREE.MeshStandardMaterial({
     color:palette[role],side:original.side,
     roughness:isMatte?.95:role==='metal'?.48:.92,
     metalness:isMatte?0:role==='metal'?.45:0,
     envMapIntensity:isMatte?0.02:1.0,
     transparent:false,opacity:1,depthWrite:true
    })
   ):original.clone();
   if(!usePalette){
    if(isGlass){material.roughness=.08;material.metalness=.30;material.envMapIntensity=2.5;}
    else if(isMatte){material.roughness=.95;material.metalness=0;material.envMapIntensity=0.02;}
   }
   if(usePalette)material.color.setHex(palette[role]);
   material.userData.photoColor=material.color?.getHex();
   material.name='school-'+role;
   prepareMaterial(material);
   materials.set(key,material);
  }
  return materials.get(key);
 };
 let inputTriangles=0;const bySurface={};
 const MAX_BATCH_VERTICES=180000;
 let outputTriangles=0,largestBatchVertices=0;
 for(const mesh of [...source.children]){
  const geometry=mesh.geometry, role=surface(mesh);
  // Interior is now sourced from the actual FBX, not the fallback reconstruction.
  const triangleCount=(geometry.index?.count??geometry.attributes.position.count)/3;
  inputTriangles+=triangleCount;
  const audit=bySurface[role]??={meshes:0,triangles:0};
  audit.meshes++;audit.triangles+=triangleCount;
  if(Array.isArray(mesh.material)||mesh.isSkinnedMesh||
     mesh.morphTargetInfluences?.length||geometry.drawRange.start!==0||
     geometry.drawRange.count!==Infinity){
   const copy=mesh.clone(false);
   copy.material=Array.isArray(mesh.material)?mesh.material.map(m=>getMaterial(m,role)):getMaterial(mesh.material,role);
   model.add(copy);
   outputTriangles+=triangleCount;
   largestBatchVertices=Math.max(largestBatchVertices,geometry.attributes.position.count);
   continue;
  }
  const material=getMaterial(mesh.material,role);
  const transformed=geometry.index?geometry.toNonIndexed():geometry.clone();
  transformed.applyMatrix4(mesh.matrix);
  // Three reverses face culling for mirrored objects. Once the transform
  // is baked into the batch, preserve the same visible face explicitly.
  if(mesh.matrix.determinant()<0)reverseTriangleWinding(transformed);
  const format=Object.entries(transformed.attributes).sort(([a],[b])=>a.localeCompare(b))
   .map(([name,attr])=>[name,attr.itemSize,attr.normalized,attr.array.constructor.name].join(':')).join('|');
  transformed.computeBoundingBox();
  const region=schoolBatchRegion(role,transformed.boundingBox);
  const key=material.id+'|'+format+'|'+region;
  if(!buckets.has(key))buckets.set(key,{material,region,geometries:[]});
  buckets.get(key).geometries.push(transformed);
 }
 function append(geometry,material,region){
  geometry.computeBoundingSphere();
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name='school-source-'+region;
  model.add(mesh);
  const vertices=geometry.attributes.position.count;
  largestBatchVertices=Math.max(largestBatchVertices,vertices);
  outputTriangles+=(geometry.index?.count??vertices)/3;
 }
 for(const {material,region,geometries} of buckets.values()){
  let chunk=[],vertices=0;
  function flush(){
   if(!chunk.length)return;
   const batch=chunk.length===1?chunk[0]:mergeGeometries(chunk,false);
   if(batch){
    append(batch,material,region);
    if(chunk.length>1)chunk.forEach(geometry=>geometry.dispose());
   }else for(const geometry of chunk)append(geometry,material,region);
   chunk=[];vertices=0;
  }
  for(const geometry of geometries){
   const count=geometry.attributes.position.count;
   if(vertices+count>MAX_BATCH_VERTICES)flush();
   chunk.push(geometry);vertices+=count;
  }
  flush();
 }
 return {model,inputTriangles,outputTriangles,batches:model.children.length,bySurface,
  largestBatchVertices,spatialRegions:new Set([...buckets.values()].map(b=>b.region)).size};
}
