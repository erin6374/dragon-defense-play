// Crowd members keep their existing pose hierarchy and gameplay state. Submit
// visible body parts in shared geometry batches instead of one draw per limb.
export function createCrowdRenderer(THREE,scene){
 const batches=new Map(),partsByPerson=new WeakMap();
 const material=new THREE.MeshStandardMaterial({color:0xffffff,metalness:.15,roughness:.55});
 const frustum=new THREE.Frustum(),viewProjection=new THREE.Matrix4();
 const bounds=new THREE.Sphere();
 const center=new THREE.Vector3();

 function register(person){
  const parts=[];
  person.traverse(part=>{
   if(!part.isMesh)return;
   parts.push(part);
   part.visible=false;
  });
  partsByPerson.set(person,parts);
 }

 function getBatch(geometry){
  let batch=batches.get(geometry);
  if(!batch){
   batch={parts:[],mesh:null};
   batches.set(geometry,batch);
  }
  return batch;
 }

 function update(people,camera,enabled){
  for(const batch of batches.values())batch.parts.length=0;
  if(enabled){
   camera.updateWorldMatrix(true,false);
   frustum.setFromProjectionMatrix(viewProjection.multiplyMatrices(camera.projectionMatrix,camera.matrixWorldInverse));
   for(const {g:person} of people){
    if(!person.visible)continue;
    person.updateWorldMatrix(false,true);
    bounds.center.copy(center.set(0,.75,0).applyMatrix4(person.matrixWorld));
    bounds.radius=1.2*person.matrixWorld.getMaxScaleOnAxis();
    if(!frustum.intersectsSphere(bounds))continue;
    for(const part of partsByPerson.get(person)??[])getBatch(part.geometry).parts.push(part);
   }
  }
  for(const [geometry,batch] of batches){
   const count=batch.parts.length;
   if(count>(batch.mesh?.instanceMatrix.count??0)){
    const capacity=Math.max(64,2**Math.ceil(Math.log2(count)));
    if(batch.mesh){scene.remove(batch.mesh);batch.mesh.dispose();}
    batch.mesh=new THREE.InstancedMesh(geometry,material,capacity);
    batch.mesh.name='animated-crowd-batch';
    batch.mesh.frustumCulled=false;
    batch.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(batch.mesh);
   }
   if(!batch.mesh)continue;
   batch.mesh.count=count;
   if(!count)continue;
   for(let i=0;i<count;i++){
    const part=batch.parts[i];
    batch.mesh.setMatrixAt(i,part.matrixWorld);
    batch.mesh.setColorAt(i,part.material.color);
   }
   batch.mesh.instanceMatrix.clearUpdateRanges();
   batch.mesh.instanceMatrix.addUpdateRange(0,count*16);
   batch.mesh.instanceMatrix.needsUpdate=true;
   batch.mesh.instanceColor.clearUpdateRanges();
   batch.mesh.instanceColor.addUpdateRange(0,count*3);
   batch.mesh.instanceColor.needsUpdate=true;
  }
 }
 return {register,update};
}
