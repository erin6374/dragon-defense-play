// Bake non-animated vehicle meshes into one draw object per material.
// Wheel positions and appearance are preserved, and the emergency beacon
// stays separate so it can blink. Expensive source assets are not disposed:
// most geometry is shared by the vehicle geometry cache.
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
export function batchVehicleVisuals(THREE,root,{exclude=[]}={}){
 const excluded=new Set(exclude.filter(Boolean));
 const source=root.children.filter(v=>v.isMesh&&!excluded.has(v)&&v.visible&&v.geometry&&v.material&&!Array.isArray(v.material));
 const materialGroups=new Map();let saved=0,generated=0,failed=0;
 for(const mesh of source){
  let g;
  try{
   mesh.updateMatrix();g=mesh.geometry.clone();g.applyMatrix4(mesh.matrix);
   if(g.index){const expanded=g.toNonIndexed();g.dispose();g=expanded;}
   if(!g.attributes.normal)g.computeVertexNormals();
   const n=g.attributes.position.count;
   if(!g.attributes.uv)g.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(n*2),2));
   for(const attr of Object.keys(g.attributes))if(!['position','normal','uv'].includes(attr))g.deleteAttribute(attr);
   g.clearGroups();g.setDrawRange(0,Infinity);
   const key=mesh.material.uuid;
   if(!materialGroups.has(key))materialGroups.set(key,{material:mesh.material,entries:[]});
   materialGroups.get(key).entries.push({mesh,geometry:g});
  }catch(err){if(g)g.dispose();failed++;console.warn('Vehicle bake skipped component',err);}
 }
 for(const {material,entries} of materialGroups.values()){
  try{
   const combined=mergeGeometries(entries.map(e=>e.geometry),false);
   if(!combined)throw new Error('Incompatible geometry attributes');
   const baked=new THREE.Mesh(combined,material);
   baked.name='batched-vehicle-material';baked.frustumCulled=false;
   baked.castShadow=false;baked.receiveShadow=false;root.add(baked);generated++;
   for(const e of entries){root.remove(e.mesh);saved++;}
  }catch(err){failed+=entries.length;console.warn('Vehicle group bake failed',err);}
  finally{for(const e of entries)e.geometry.dispose();}
 }
 return {sourceMeshes:source.length,batches:generated,drawCallsSaved:Math.max(0,saved-generated),failed};
}
