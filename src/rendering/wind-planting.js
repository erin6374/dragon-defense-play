import * as THREE from 'three';
import {groundWindStrength} from '../simulation/ground-wind.js';

export function createWindPlanting(trees,bushes){
 const pivot=new THREE.Object3D(),matrix=new THREE.Matrix4();
 const plants=trees.map(({root,instances})=>({root,instances,x:root.position.x,z:root.position.z,angle:0}));
 for(let i=0;i<bushes.count;i++){
  const rest=new THREE.Matrix4();
  bushes.getMatrixAt(i,rest);
  if(rest.elements[0]===0&&rest.elements[5]===0&&rest.elements[10]===0)continue;
  const x=rest.elements[12],z=rest.elements[14];
  rest.elements[12]=0;
  rest.elements[14]=0;
  plants.push({instances:[{mesh:bushes,index:i,rest}],x,z,angle:0});
 }
 for(const {instances} of plants)for(const {mesh} of instances)mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
 let moving=false;
 return function update(dt,origin,dx=0,dz=0,pulse=0){
  if(!pulse&&!moving)return 0;
  moving=false;
  let peak=0;
  for(const plant of plants){
   const {root,instances,x,z}=plant;
   const force=pulse?groundWindStrength(x+(root?0:bushes.position.x),0,z,origin.x,0,origin.z,dx,0,dz):0;
   if(force){plant.dx=dx;plant.dz=dz;}
   const target=force*pulse*(root?.85:1.15);
   const angle=THREE.MathUtils.lerp(plant.angle,target,Math.min(1,dt*(pulse?13:7)));
   const next=angle<.003?0:angle;
   peak=Math.max(peak,next);
   moving ||= next>0;
   if(next===plant.angle)continue;
   plant.angle=next;
   const pose=root||pivot;
   if(!root)pivot.position.set(x,0,z);
   pose.rotation.set(plant.dz*next,0,-plant.dx*next);
   pose.updateMatrix();
   for(const {mesh,index,rest} of instances){
    mesh.setMatrixAt(index,matrix.multiplyMatrices(pose.matrix,rest));
    mesh.instanceMatrix.needsUpdate=true;
   }
  }
  return peak;
 };
}
