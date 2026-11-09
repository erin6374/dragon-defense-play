import * as THREE from 'three';
import { createBreathPreview } from './breath-effects.js';
import { createPauloRig } from '../src/dragon/paulo-rig.js';
const host=document.querySelector('#viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color('#101a27');
scene.fog=new THREE.Fog('#101a27',28,65);
const perspectiveCamera=new THREE.PerspectiveCamera(40,1,.1,120);
perspectiveCamera.position.set(13,9,18);perspectiveCamera.lookAt(0,1,0);
// Alignment views use a true orthographic camera, not merely a named
// perspective preset; compare anatomy and wing symmetry without foreshortening.
const referenceCamera=new THREE.OrthographicCamera(-10,10,10,-10,.1,200);
let camera=perspectiveCamera,currentView='perspective';
const renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
host.prepend(renderer.domElement);
scene.add(new THREE.HemisphereLight(0xaed4ff,0x41201a,2.2));
const key=new THREE.DirectionalLight(0xffe0b8,3.1);key.position.set(8,13,9);scene.add(key);
const rim=new THREE.DirectionalLight(0xa44b55,2);rim.position.set(-8,7,-10);scene.add(rim);
const ground=new THREE.Mesh(new THREE.CircleGeometry(12,80),new THREE.MeshStandardMaterial({color:0x263342,roughness:1}));
ground.rotation.x=-Math.PI/2;ground.position.y=-2.45;scene.add(ground);
const grid=new THREE.GridHelper(22,22,0x47566b,0x273546);grid.position.y=-2.44;scene.add(grid);
const {
 root,rigMarkers,wings,tailProfile,membranePanels,plateIndex,
 upperTeeth,lowerTeeth,breathPreview,head,jaw,neck,chest,
 applyPose,membraneDeformation
}=createPauloRig(THREE,{breathPreviewFactory:createBreathPreview});
scene.add(root);
const descriptions={
 idle:'Slow breathing, head scans and a low-energy tail sway. Wings are partially folded.',
 hover:'Deep, synchronized strokes; chest and torso rise on the downstroke. Legs remain extended.',
 flight:'Moderate wingbeats with a stretched torso, streamlined legs and tail.',
 glide:'Broad stable wings, minimal flapping, small wrist corrections and tail stabilization.',
 bank:'Asymmetric wing angles and a delayed head turn communicate a directional change.',
 'ground-turn':'Rear up on the hind legs, lift the forefeet and pivot toward the opposite direction before settling.',
 inhale:'Chest expands, head draws back, wings brace; anticipation before the gust.',
 wind:'Neck extends, jaws open, wings brace and the body recoils slightly during exhale.',
 fire:'Head thrusts forward, jaws open wider and the torso braces for sustained fire.',
 gas:'Lower head and torso; a distinct abdominal compression differentiates gas from fire.',
 hit:'Rapid recoil and wing correction, then a damped return to stable flight.',
 land:'Hind legs lower, wings open as air brakes, and the body settles toward the ground.',
 takeoff:'Crouch, extend hind legs, then perform a large first downstroke.'
};
const poses=document.querySelector('#poses'),description=document.querySelector('#description');
let state='hover',speed=1,time=0,paused=false,bankDirection=1;
const playbackButton=document.querySelector('#play-toggle');
const frameButton=document.querySelector('#step-frame');
const timeSlider=document.querySelector('#timeline');
const timeLabel=document.querySelector('#timeline-label');
function syncPlaybackUI(){
  playbackButton.textContent=paused?'Play':'Pause';
  playbackButton.setAttribute('aria-pressed',String(paused));
  timeSlider.value=String(time%8);
  timeLabel.textContent=(time%8).toFixed(2)+'s';
}
function renderAtTime(){
  applyPose(time,state,bankDirection);
  renderer.render(scene,camera);
  syncPlaybackUI();
}
playbackButton.addEventListener('click',()=>{paused=!paused;syncPlaybackUI();});
frameButton.addEventListener('click',()=>{paused=true;time+=1/60;renderAtTime();});
timeSlider.addEventListener('input',e=>{paused=true;time=Number(e.target.value);renderAtTime();});
// The same deterministic timeline drives live animation, pause, scrubbing,
// frame stepping, and QA. Browser tests can inspect exact poses.
for(const name of Object.keys(descriptions)){
 const button=document.createElement('button');button.textContent=name.toUpperCase();button.setAttribute('aria-pressed',name===state);
 button.addEventListener('click',()=>{state=name;time=0;description.textContent=descriptions[name];for(const b of poses.children)b.setAttribute('aria-pressed',b===button);renderAtTime();});
 poses.append(button);
}
description.textContent=descriptions[state];
document.querySelector('#speed').addEventListener('input',e=>speed=+e.target.value);
document.querySelector('#wire').addEventListener('change',e=>{for(const m of rigMarkers)m.visible=e.target.checked;renderAtTime();});
// Positive and negative bank are exact mirrored studies at the same pose time.
document.querySelector('#bank-direction').addEventListener('change',e=>{
 bankDirection=e.target.value==='left'?-1:1;
 renderAtTime();
});
const views={perspective:[13,9,18],front:[14,2,0],side:[0,3,19],top:[0,22,.01],rear:[-14,2,0]};
// Model bounds are recalculated on view selection (not on every frame).
// Include a 30% silhouette margin so wingtips remain inside reference shots.
function setView(name){
  currentView=name in views?name:'perspective';
  if(currentView==='perspective'){
    camera=perspectiveCamera;
    camera.up.set(0,1,0);
    camera.position.set(...views.perspective);
    camera.lookAt(0,1,0);
  } else {
    camera=referenceCamera;
    const bounds=new THREE.Box3().setFromObject(root);
    const center=bounds.getCenter(new THREE.Vector3());
    const extent=bounds.getSize(new THREE.Vector3());
    camera.up.set(0,currentView==='top'?0:1,currentView==='top'?-1:0);
    camera.position.set(...views[currentView]).add(center);
    camera.lookAt(center);
    const aspect=Math.max(.1,host.clientWidth/Math.max(1,host.clientHeight));
    let halfW=(currentView==='front'||currentView==='rear'?extent.z:extent.x)*.65;
    let halfH=(currentView==='top'?extent.z:extent.y)*.65;
    halfW=Math.max(1.5,halfW);halfH=Math.max(1.5,halfH);
    halfH=Math.max(halfH,halfW/aspect);
    halfW=halfH*aspect;
    camera.left=-halfW;camera.right=halfW;
    camera.top=halfH;camera.bottom=-halfH;
    camera.zoom=1;
  }
  camera.updateProjectionMatrix();
}
document.querySelector('#view').addEventListener('change',e=>{setView(e.target.value);renderer.render(scene,camera);});
let drag=false,prevX=0,prevY=0;
renderer.domElement.addEventListener('pointerdown',e=>{if(camera.isOrthographicCamera)return;drag=true;prevX=e.clientX;prevY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointerup',()=>drag=false);
renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-prevX,dy=e.clientY-prevY;prevX=e.clientX;prevY=e.clientY;
 const spherical=new THREE.Spherical().setFromVector3(camera.position);
 spherical.theta-=dx*.008;spherical.phi=THREE.MathUtils.clamp(spherical.phi+dy*.008,.1,Math.PI-.1);
 camera.position.setFromSpherical(spherical);camera.lookAt(0,0,0);if(paused)renderer.render(scene,camera);
});
renderer.domElement.addEventListener('wheel',e=>{
 e.preventDefault();
 if(camera.isOrthographicCamera){
  camera.zoom=THREE.MathUtils.clamp(camera.zoom*(e.deltaY>0?.92:1.08),.4,4);
  camera.updateProjectionMatrix();
 }else{
  camera.position.multiplyScalar(e.deltaY>0?1.09:.91);
  camera.position.clampLength(6,55);
 }
 if(paused)renderer.render(scene,camera);
},{passive:false});
const clock=new THREE.Clock();
function animate(){
 requestAnimationFrame(animate);
 const dt=Math.min(clock.getDelta(),.05);
 if(paused)return; // Freeze the pose and avoid unnecessary WebGL draw calls.
 time+=dt*speed;
 renderAtTime();
}
function resize(){
 const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);
 perspectiveCamera.aspect=w/h;
 perspectiveCamera.updateProjectionMatrix();
 renderer.setSize(w,h,false);
 if(currentView!=='perspective')setView(currentView);
 if(paused)renderer.render(scene,camera);
}
new ResizeObserver(resize).observe(host);resize();animate();
function referenceFrameMetrics(){
 if(!camera.isOrthographicCamera)return null;
 camera.updateMatrixWorld();
 const bounds=new THREE.Box3().setFromObject(root);
 const point=new THREE.Vector3();
 let maxX=0,maxY=0;
 for(const x of [bounds.min.x,bounds.max.x])
  for(const y of [bounds.min.y,bounds.max.y])
   for(const z of [bounds.min.z,bounds.max.z]){
    point.set(x,y,z).project(camera);
    maxX=Math.max(maxX,Math.abs(point.x));
    maxY=Math.max(maxY,Math.abs(point.y));
   }
 return {maxX,maxY};
}
window.__PAULO_LAB_QA={states:Object.keys(descriptions),jointCount:rigMarkers.length,wingCount:wings.length,
 armorPlateCount:plateIndex,fangCounts:[upperTeeth.count,lowerTeeth.count],
 tailProfile,
 membranePanels:membranePanels.length,
 membraneRegions:membranePanels.reduce((acc,p)=>{acc[p.region]=(acc[p.region]??0)+1;return acc;},{}),
 membraneVertices:membranePanels.reduce((n,p)=>n+p.mesh.geometry.attributes.position.count,0),
 membraneDeformation,
 setState(name){const i=Object.keys(descriptions).indexOf(name);if(i<0)return false;poses.children[i].click();return true;},
 snapshot(){return {state,paused,time,bankDirection,rootRoll:root.rotation.x,rootPitch:root.rotation.z,
 cameraType:camera.isOrthographicCamera?'orthographic':'perspective',referenceFrame:referenceFrameMetrics(),
 cameraFrustum:camera.isOrthographicCamera?{left:camera.left,right:camera.right,top:camera.top,bottom:camera.bottom}:null,
 modelBounds:new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).toArray(),
 wingAngles:wings.map(w=>w.shoulder.rotation.x),
 wingFold:wings.map(w=>w.shoulder.rotation.y),jawAngle:jaw.rotation.z,
 headAngle:head.rotation.z,chestHeight:chest.scale.y,
 breath:breathPreview.snapshot(),
 visible:renderer.domElement.width>0&&renderer.domElement.height>0,
 drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}};
