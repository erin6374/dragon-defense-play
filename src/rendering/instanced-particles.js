// Engine-facing GPU batching. Keeps data/physics separate from Three.js draw calls.
export class InstancedParticlePool {
 constructor({THREE,parent,geometry,material,capacity=128}){
  this.THREE=THREE;this.capacity=capacity;this.count=0;this.temp=new THREE.Object3D();
  this.mesh=new THREE.InstancedMesh(geometry,material,capacity);
  this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  this.mesh.frustumCulled=false;this.mesh.count=0;parent.add(this.mesh);
 }
 begin(){this.count=0;}
 add(position,scale,rotation=0){if(this.count>=this.capacity)return false;
  const t=this.temp;t.position.copy(position);t.rotation.set(0,rotation,0);t.scale.setScalar(scale);t.updateMatrix();
  this.mesh.setMatrixAt(this.count++,t.matrix);return true;
 }
 end(){this.mesh.count=this.count;if(this.count)this.mesh.instanceMatrix.needsUpdate=true;}
 clear(){this.count=0;this.mesh.count=0;}
}
