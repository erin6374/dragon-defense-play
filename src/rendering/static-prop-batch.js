// Draw-call reduction for *non-destructible* street props only.
// Never batch neighborhood panels, FBX geometry, cars, cranes or damageable meshes.
import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export function batchStaticStreetProps(root){
 const supported=['urban-set-dressing','cinematic-street-dressing','v411-backstreet-gasstation-street-furniture','power-grid-infrastructure','police-intersections-blockade','Philadelphia skyline','BROAD-STREET-REFERENCE-2026'];
 let input=0,output=0,batches=0,skipped=0;
 for(const name of supported){
  const parent=root.getObjectByName(name);if(!parent)continue;
  parent.updateWorldMatrix(true,true);
  const candidates=new Map();
  const allMeshes = [];
  parent.traverse(o => {
   if (o !== parent && o.isMesh && !o.name?.startsWith('static-batched-')) {
    allMeshes.push(o);
   }
  });
  for(const mesh of allMeshes){
   if(!mesh.geometry?.attributes?.position||Array.isArray(mesh.material)||mesh.material.transparent||mesh.material.opacity<1){skipped++;continue;}
   if(mesh.geometry.attributes.position.count>10000){skipped++;continue;}
   const key=mesh.material.uuid;
   if(!candidates.has(key))candidates.set(key,[]);
   candidates.get(key).push(mesh);
  }
  for(const meshes of candidates.values()){
   if(meshes.length<3)continue;
   const mat=meshes[0].material;
   let geometries=[],source=[],vertexCount=0;
   const flush=()=>{
    if(geometries.length<3){for(const g of geometries)g.dispose();geometries=[];source=[];vertexCount=0;return;}
    try{
     const merged=mergeGeometries(geometries,false);if(!merged)throw new Error('incompatible vertex attributes');
     const m=new THREE.Mesh(merged,mat);m.name='static-batched-'+name+'-'+batches;m.frustumCulled=false;parent.add(m);
     for(const src of source){if(src.parent)src.parent.remove(src);}input+=source.length;output++;batches++;
    }catch(e){skipped+=source.length;console.warn('Decor batch skipped',e);}finally{for(const g of geometries)g.dispose();geometries=[];source=[];vertexCount=0;}
   };
   const invParent = new THREE.Matrix4().copy(parent.matrixWorld).invert();
   for(const mesh of meshes){
    mesh.updateWorldMatrix(true, false);
    const relMatrix = new THREE.Matrix4().multiplyMatrices(invParent, mesh.matrixWorld);
    const g=mesh.geometry.clone();g.applyMatrix4(relMatrix);if(g.index){const expanded=g.toNonIndexed();g.dispose();geometries.push(expanded);}else geometries.push(g);
    source.push(mesh);vertexCount+=geometries[geometries.length-1].attributes.position.count;
    if(vertexCount>70000)flush();
   }
   flush();
  }
 }
 return {input,output,batches,skipped};
}
