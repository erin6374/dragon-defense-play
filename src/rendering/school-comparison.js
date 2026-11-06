import * as THREE from 'three';

export function snapshotSchoolMesh(mesh) {
 const copy=mesh.clone(false);
 copy.matrix.copy(mesh.matrixWorld);
 copy.matrixAutoUpdate=false;
 return copy;
}

export function captureSchoolComparison(renderer, source, sourceSchool, gameSchool) {
 const scene=new THREE.Scene();
 scene.background=new THREE.Color(0x273348);
 scene.add(new THREE.HemisphereLight(0xffffff,0x657182,2));
 const key=new THREE.DirectionalLight(0xffffff,2);
 key.position.set(2,4,3);
 scene.add(key);
 const camera=new THREE.OrthographicCamera();
 const target=new THREE.Vector3(0,11,-24);
 const canvas=renderer.domElement;
 const aspect=canvas.width/canvas.height;
 const results=[];
 for(const [view,eye,height] of [
  ['front',[0,11,110],39],
  ['corner',[80,57,89],75],
  ['roof',[0,120,-23.9],72],
 ]){
  Object.assign(camera,{left:-height*aspect/2,right:height*aspect/2,
   top:height/2,bottom:-height/2,near:.1,far:400});
  camera.position.fromArray(eye);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  for(const [label,model] of [['original-fbx',source],['source-school',sourceSchool],['game',gameSchool]]){
   scene.add(model);
   const bounds=new THREE.Box3().setFromObject(model);
   renderer.render(scene,camera);
   results.push({name:view+'-'+label,png:canvas.toDataURL('image/png'),
    metrics:{min:bounds.min.toArray(),max:bounds.max.toArray(),
     drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}});
   scene.remove(model);
  }
 }
 return results;
}
