import * as THREE from 'three';

export function snapshotSchoolMesh(mesh) {
 const copy=mesh.clone(false);
 copy.matrix.copy(mesh.matrixWorld);
 copy.matrixAutoUpdate=false;
 return copy;
}

export function captureSchoolComparison(renderer, source, sourceSchool, gameSchool) {
 return captureSchoolViews(renderer,[['original-fbx',source],['source-school',sourceSchool],['game',gameSchool]]);
}

export function captureSchoolViews(renderer, entries, selectedViews) {
 const scene=new THREE.Scene();
 scene.background=new THREE.Color(0x273348);
 scene.add(new THREE.HemisphereLight(0xffffff,0x657182,2));
 const key=new THREE.DirectionalLight(0xffffff,2);
 key.position.set(2,4,3);
 scene.add(key);
 const camera=new THREE.OrthographicCamera();
 const target=new THREE.Vector3(0,13,-26);
 const canvas=renderer.domElement;
 const aspect=canvas.width/canvas.height;
 const results=[];
 const pixels=document.createElement('canvas');
 pixels.width=canvas.width;pixels.height=canvas.height;
 const ctx=pixels.getContext('2d',{willReadFrequently:true});
 const models=entries
  .map(([label,model])=>({label,model,bounds:new THREE.Box3().setFromObject(model,true)}));
 for(const [view,eye,height] of [
  ['front',[0,13,110],47],
  ['corner',[80,57,89],75],
  ['roof',[0,120,-25.9],82],
  ['left-side',[-120,13,-26],48],
  ['right-side',[120,13,-26],48],
 ]){
  if(selectedViews&&!selectedViews.includes(view))continue;
  Object.assign(camera,{left:-height*aspect/2,right:height*aspect/2,
   top:height/2,bottom:-height/2,near:.1,far:400});
  camera.position.fromArray(eye);
  camera.lookAt(target);
  camera.updateProjectionMatrix();
  for(const {label,model,bounds} of models){
   scene.add(model);
   renderer.render(scene,camera);
   ctx.drawImage(canvas,0,0);
   const {data}=ctx.getImageData(0,0,pixels.width,Math.floor(pixels.height/2));
   // Use the sampled background color so the assertion follows renderer color space.
   let upperPixels=0;
   for(let i=0;i<data.length;i+=4){
    if(Math.abs(data[i]-data[0])+Math.abs(data[i+1]-data[1])+Math.abs(data[i+2]-data[2])>12)upperPixels++;
   }
   results.push({name:view+'-'+label,png:canvas.toDataURL('image/png'),
    metrics:{upperPixels,min:bounds.min.toArray(),max:bounds.max.toArray(),
     drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles}});
   scene.remove(model);
  }
 }
 return results;
}
