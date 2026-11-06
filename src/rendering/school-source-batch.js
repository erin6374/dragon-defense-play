import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';

// The exported model uses one neutral material. Color the actual named
// components without rebuilding any opening, façade panel, or roof surface.
const palette={glass:0x426d83,metal:0x273742,spandrel:0xb9a693,brick:0x8b5140,
 roof:0x39434a,stone:0xc2b7a4,door:0x53636c,interior:0x8f8b84};
function surface(mesh){
 const name=mesh.name.toLowerCase();
 if(/mullion|handrail|guardrail|top_rail|window_frame/.test(name))return 'metal';
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

export function batchSchoolSource(source, prepareMaterial) {
 const model=new THREE.Group();
 model.position.copy(source.position);
 model.scale.copy(source.scale);
 const buckets=new Map(), materials=new Map();
 const getMaterial=(original,role)=>{
  const usePalette=original.name==='__DEFAULT';
  const key=usePalette?role:original.id;
  if(!materials.has(key)){
   const material=original.clone();
   if(usePalette)material.color.setHex(palette[role]);
   material.userData.photoColor=material.color?.getHex();
   material.name='school-'+role;
   prepareMaterial(material);
   materials.set(key,material);
  }
  return materials.get(key);
 };
 let inputTriangles=0;
 for(const mesh of [...source.children]){
  const geometry=mesh.geometry, role=surface(mesh);
  inputTriangles+=(geometry.index?.count??geometry.attributes.position.count)/3;
  if(Array.isArray(mesh.material)||mesh.isSkinnedMesh||
     mesh.morphTargetInfluences?.length||geometry.drawRange.start!==0||
     geometry.drawRange.count!==Infinity){
   const copy=mesh.clone(false);
   copy.material=Array.isArray(mesh.material)?mesh.material.map(m=>getMaterial(m,role)):getMaterial(mesh.material,role);
   model.add(copy);
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
  const key=material.id+'|'+format;
  if(!buckets.has(key))buckets.set(key,{material,geometries:[]});
  buckets.get(key).geometries.push(transformed);
 }
 for(const {material,geometries} of buckets.values()){
  const batch=geometries.length===1?geometries[0]:mergeGeometries(geometries,false);
  if(batch){
   model.add(new THREE.Mesh(batch,material));
   if(geometries.length>1)geometries.forEach(geometry=>geometry.dispose());
  }else{
   for(const geometry of geometries)model.add(new THREE.Mesh(geometry,material));
  }
 }
 return {model,inputTriangles,batches:model.children.length};
}
