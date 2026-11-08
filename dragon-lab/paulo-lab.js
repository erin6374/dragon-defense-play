import * as THREE from 'three';
import { createBreathPreview } from './breath-effects.js';
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
const mat={
 armor:new THREE.MeshStandardMaterial({color:0x24272d,roughness:.83,metalness:.16}),
 plates:new THREE.MeshStandardMaterial({color:0x45434a,roughness:.74,metalness:.18}),
 red:new THREE.MeshStandardMaterial({color:0x9b2430,roughness:.69,side:THREE.DoubleSide}),
 membrane:new THREE.MeshStandardMaterial({color:0x7e1d2b,roughness:.78,side:THREE.DoubleSide,transparent:true,opacity:.93}),
 bronze:new THREE.MeshStandardMaterial({color:0xa67b4e,metalness:.47,roughness:.45}),
 eye:new THREE.MeshStandardMaterial({color:0xffc04c,emissive:0xa74404,emissiveIntensity:.5}),
 mouth:new THREE.MeshStandardMaterial({color:0x160e14,roughness:.92}),
 ivory:new THREE.MeshStandardMaterial({color:0xe7d8b7,roughness:.68})
};
const root=new THREE.Group();scene.add(root);
const rigMarkers=[];
const sphere=new THREE.SphereGeometry(1,12,9);
const cone=new THREE.ConeGeometry(1,1,7);
function part(parent,geometry,material,pos=[0,0,0],scale=[1,1,1],rot=[0,0,0]){
 const m=new THREE.Mesh(geometry,material);
 m.position.set(...pos);m.scale.set(...scale);m.rotation.set(...rot);parent.add(m);return m;
}
function ell(parent,material,pos,scale){return part(parent,sphere,material,pos,scale);}
function pivot(parent,pos){const g=new THREE.Group();g.position.set(...pos);parent.add(g);return g;}
function marker(p){const m=ell(p,mat.eye,[0,0,0],[.07,.07,.07]);m.visible=false;rigMarkers.push(m);}
function spike(parent,x,y,z,size=.3){
 part(parent,cone,mat.bronze,[x,y+size*.42,z],[size*.3,size,size*.3],[0,0,-.25]);
}
const torso=pivot(root,[0,0,0]);marker(torso);
ell(torso,mat.armor,[0,0,0],[2.1,.85,.78]);
ell(torso,mat.red,[.45,-.52,0],[1.25,.38,.57]);
ell(torso,mat.plates,[.65,.42,0],[1.05,.54,.7]);
for(let i=0;i<12;i++)spike(torso,-1.7+i*.32,.65+Math.sin(i/12*Math.PI)*.25,0,.21+i*.008);
// Repeated overlapping dorsal armor plates share a single instanced draw call.
// Their silhouettes and varied sizes are readable from the game camera.
const plateGeo=new THREE.ConeGeometry(.12,.34,5);
const plateBatch=new THREE.InstancedMesh(plateGeo,mat.plates,66);
const plateDummy=new THREE.Object3D();
let plateIndex=0;
for(let row=0;row<6;row++)for(let col=0;col<11;col++){
 const x=-1.58+col*.29;
 const angle=-.78+row*.31;
 plateDummy.position.set(x,.72*Math.cos(angle)+.08,.72*Math.sin(angle));
 plateDummy.rotation.set(angle,0,-.34);
 const size=.7+.25*Math.sin(col*.6+row);
 plateDummy.scale.set(size,.7+size*.4,size);
 plateDummy.updateMatrix();plateBatch.setMatrixAt(plateIndex++,plateDummy.matrix);
}
plateBatch.instanceMatrix.needsUpdate=true;
torso.add(plateBatch);
const chest=pivot(torso,[1.12,.16,0]);marker(chest);
ell(chest,mat.armor,[.25,.06,0],[.8,.82,.69]);
const neck=pivot(chest,[.74,.47,0]);marker(neck);
ell(neck,mat.armor,[.56,.21,0],[.9,.33,.32]);
ell(neck,mat.red,[.6,-.06,0],[.66,.17,.24]);
const head=pivot(neck,[1.27,.24,0]);marker(head);
ell(head,mat.armor,[.33,0,0],[.73,.35,.43]);
ell(head,mat.plates,[.82,-.08,0],[.57,.22,.31]);
// Distinct reptilian muzzle: pronounced nasal bridge, protective brows and jaw.
ell(head,mat.plates,[1.04,.075,0],[.37,.15,.28]);
const jaw=pivot(head,[.55,-.22,0]);marker(jaw);
ell(jaw,mat.mouth,[.38,-.035,0],[.56,.105,.29]);
ell(jaw,mat.armor,[.38,-.12,0],[.59,.14,.31]);
for(const side of [-1,1]){
 ell(head,mat.eye,[.38,.13,side*.35],[.14,.09,.07]);
 ell(head,mat.plates,[.29,.27,side*.345],[.36,.11,.17]);
 part(head,cone,mat.bronze,[-.1,.38,side*.27],[.12,.7,.12],[0,0,-.6]);
 part(head,cone,mat.bronze,[.2,.34,side*.39],[.08,.38,.08],[0,0,-.35]);
 ell(head,mat.mouth,[1.20,-.015,side*.205],[.09,.045,.067]);
}
// Two instanced tooth rows stay attached to their respective jaw bones,
// so the original jaw-opening pose reveals interlocking teeth without adding
// individual draw calls for every small fang.
const toothGeometry=new THREE.ConeGeometry(.052,.21,5);
const toothDummy=new THREE.Object3D();
function teeth(parent,upper){
 const batch=new THREE.InstancedMesh(toothGeometry,mat.ivory,12);
 let index=0;
 for(const side of [-1,1])for(let i=0;i<6;i++){
  toothDummy.position.set(upper?.53+i*.135:.20+i*.14,upper?-.23:.045,side*(upper?.24:.23));
  toothDummy.rotation.set(0,0,upper?Math.PI:0);
  const size=.78+.16*Math.sin((i+1)*2.1);
  toothDummy.scale.set(size,size,size);
  toothDummy.updateMatrix();
  batch.setMatrixAt(index++,toothDummy.matrix);
 }
 batch.instanceMatrix.needsUpdate=true;
 parent.add(batch);
 return batch;
}
const upperTeeth=teeth(head,true);
const lowerTeeth=teeth(jaw,false);
const breathPreview=createBreathPreview(head);
const tail=[],tailProfile=[];let previous=torso;
// Tapered overlapping tail links replace isolated bead-like ellipsoids.
// Each link reaches past the next joint, preserving a continuous silhouette
// while the seven original pivots continue to animate independently.
for(let i=0;i<7;i++){
 const seg=pivot(previous,i===0?[-1.78,.04,0]:[-.61,0,0]);marker(seg);
 const baseRadius=Math.max(.07,.31-i*.035);
 const tipRadius=Math.max(.055,baseRadius-.035);
 const length=.74;
 const taperedLink=new THREE.CylinderGeometry(tipRadius,baseRadius,length,9);
 part(seg,taperedLink,i%2?mat.armor:mat.plates,[-.32,0,0],[1,1,1],[0,0,Math.PI/2]);
 spike(seg,-.25,.24-i*.025,0,Math.max(.09,.25-i*.022));
 tailProfile.push({length,baseRadius,tipRadius});
 tail.push(seg);previous=seg;
}
part(previous,cone,mat.bronze,[-.75,0,0],[.15,.75,.15],[0,0,Math.PI/2]);
const legs=[];
for(const side of [-1,1])for(const fore of [false,true]){
 const hip=pivot(torso,[fore?1.05:-1.2,-.4,side*.56]);marker(hip);
 ell(hip,mat.armor,[0,-.32,side*.06],[.38,.66,.32]);
 const knee=pivot(hip,[fore?.2:-.27,-.87,side*.05]);marker(knee);
 ell(knee,mat.plates,[0,-.37,0],[.23,.5,.23]);
 const foot=pivot(knee,[.28,-.76,0]);marker(foot);
 ell(foot,mat.armor,[.18,-.04,0],[.44,.17,.27]);
 for(let c=-1;c<=1;c++)part(foot,cone,mat.bronze,[.53,-.07,c*.18],[.09,.31,.09],[0,0,-Math.PI/2]);
 legs.push({hip,knee,fore,side});
}
function bone(parent,start,end,radius,material){
 const a=new THREE.Vector3(...start),b=new THREE.Vector3(...end);
 const diff=b.clone().sub(a),mesh=part(parent,new THREE.CylinderGeometry(radius*.8,radius,diff.length(),7),material,a.clone().add(b).multiplyScalar(.5).toArray());
 mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),diff.normalize());return mesh;
}
// Curved, tessellated membrane fan. Unlike the original three-vertex wedge,
// the leading and trailing edges are scalloped and the fabric billows in 3D.
// Geometry is generated once per wing panel, not during animation.
const membranePanels=[];
function membrane(parent,verts,side){
 const root=new THREE.Vector3(...verts[0]);
 const left=new THREE.Vector3(...verts[1]).sub(root);
 const right=new THREE.Vector3(...verts[2]).sub(root);
 const positions=[],uvs=[],indices=[];
 const segments=12,radial=6;
 for(let j=0;j<=radial;j++){
  const v=j/radial;
  for(let i=0;i<=segments;i++){
   const u=i/segments;
   // Curved outer margin dips between the finger tips, with a taut root.
   const scallop=Math.sin(Math.PI*u)*.17;
   const reach=v*(1-scallop*v);
   const p=root.clone().addScaledVector(left,reach*(1-u))
    .addScaledVector(right,reach*u);
   p.y+=side*Math.sin(Math.PI*u)*Math.sin(Math.PI*v)*.17;
   positions.push(p.x,p.y,p.z);
   uvs.push(u,v);
   if(i<segments&&j<radial){
    const a=j*(segments+1)+i,b=a+segments+1;
    indices.push(a,b,a+1,b,b+1,a+1);
   }
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 // Keep the rest pose in a typed array; deformation is a bounded update
 // of existing vertex buffers, never a per-frame mesh allocation.
 geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
 const mesh=part(parent,geometry,mat.membrane);
 membranePanels.push({mesh,rest:Float32Array.from(positions),side});
 return mesh;
}
// Lightweight procedural skinning preview: billow the membrane interior,
 // while pinning the leading root and the outer finger boundaries.
 // The final GLB will use bone weights and blend shapes instead.
let membraneNormalTick=0;
function deformMembranes(t,intensity){
 const refreshNormals=(membraneNormalTick++%4)===0;
 for(const panel of membranePanels){
  const attr=panel.mesh.geometry.attributes.position,base=panel.rest;
  for(let j=0;j<7;j++){
   const v=j/6;
   for(let i=0;i<13;i++){
    const u=i/12,idx=j*13+i,off=idx*3;
    const envelope=Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
    const flutter=Math.sin(t*7-u*3.2-v*4.1)*.095*intensity;
    attr.array[off+1]=base[off+1]+envelope*(.13*intensity+flutter);
   }
  }
  attr.needsUpdate=true;
  if(refreshNormals)panel.mesh.geometry.computeVertexNormals();
 }
}
const wings=[];
for(const side of [-1,1]){
 const shoulder=pivot(chest,[-.12,.55,side*.53]);marker(shoulder);
 const elbow=pivot(shoulder,[-.35,.28,side*1.8]);marker(elbow);
 bone(shoulder,[0,0,0],[-.35,.28,side*1.8],.16,mat.armor);
 const wrist=pivot(elbow,[-.85,.1,side*1.5]);marker(wrist);
 bone(elbow,[0,0,0],[-.85,.1,side*1.5],.12,mat.armor);
 const fingerEnds=[[-3.7,.03,side*3.8],[-2.2,.12,side*4.8],[-.4,.02,side*4.6],[.8,-.03,side*3.5]];
 const base=[0,0,0],rear=[-2.15,-.05,side*.45];
 for(let i=0;i<fingerEnds.length;i++){
  bone(wrist,base,fingerEnds[i],.055,mat.bronze);
  const prev=i===0?rear:fingerEnds[i-1],next=fingerEnds[i];
  membrane(wrist,[base,prev,next],side);
 }
 membrane(elbow,[[0,0,0],[-.85,.1,side*1.5],[-2.6,-.12,side*.35]],side);
 wings.push({shoulder,elbow,wrist,side});
}
const descriptions={
 idle:'Slow breathing, head scans and a low-energy tail sway. Wings are partially folded.',
 hover:'Deep, synchronized strokes; chest and torso rise on the downstroke. Legs remain extended.',
 flight:'Moderate wingbeats with a stretched torso, streamlined legs and tail.',
 glide:'Broad stable wings, minimal flapping, small wrist corrections and tail stabilization.',
 bank:'Asymmetric wing angles and a delayed head turn communicate a directional change.',
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
  applyPose(time);
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
function applyPose(t){
 const cycle=Math.sin(t*5),soft=Math.sin(t*2);
 const airborne=!['idle','land'].includes(state);
 const power=state==='hover'?1:state==='takeoff'?1.25:state==='flight'?.6:state==='hit'?.85:state==='bank'?.48:.07;
 const bank=state==='bank'?.35*bankDirection:0;
 root.position.y=airborne?.3+cycle*.11*power:Math.sin(t*1.5)*.035;
 root.rotation.z=bank*Math.sin(t*1.2)+(state==='hit'?Math.sin(t*12)*Math.exp(-t*2)*.18:0);
 torso.scale.set(1,1+(state==='inhale'?.16:0)+soft*.015,1);
 chest.scale.set(1,1+(state==='inhale'?.19:state==='wind'?.10:0),1);
 neck.rotation.z=state==='inhale'?.24:state==='wind'||state==='fire'?-.12:Math.sin(t*.8)*.04;
 head.rotation.z=state==='wind'||state==='fire'?-.16:state==='gas'?.23:Math.sin(t*.9)*.035;
 jaw.rotation.z=['wind','fire','gas'].includes(state)?-.37:state==='inhale'?-.11:0;
 wings.forEach(({shoulder,elbow,wrist,side})=>{
  const phase=cycle*power;
  // Brace the wings during exhale; fire keeps a narrower, more aerodynamic
  // profile. Bank favors the outside wing and partially folds the inside.
  const braced=state==='wind'?.26:state==='inhale'?.15:0;
  const fireFold=state==='fire'?.25:0;
  shoulder.rotation.x=side*(.12+phase*.47+bank*side*.24+braced);
  shoulder.rotation.y=side*(state==='glide'?-.15:state==='idle'?.45:.08+fireFold);
  elbow.rotation.x=side*(.12+phase*.22+braced*.65);
  wrist.rotation.y=side*(state==='glide'?.05:state==='idle'?.35:.16+fireFold*.5);
 });
 tail.forEach((seg,i)=>{seg.rotation.y=Math.sin(t*1.7-i*.5)*.09;seg.rotation.z=Math.sin(t*1.15-i*.35)*.045;});
 legs.forEach(({hip,knee,fore,side})=>{
  hip.rotation.z=airborne?(fore?-.22:.35):0;
  knee.rotation.z=state==='land'?.28:airborne?-.25:0;
 });
 deformMembranes(t,state==='glide'?.35:state==='idle'?.12:power);
 breathPreview.update(state,t);
}
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
 membraneVertices:membranePanels.reduce((n,p)=>n+p.mesh.geometry.attributes.position.count,0),
 membraneDeformation(){const p=membranePanels[0];return {rest:p.rest[3*3*13+3*6+1],
 current:p.mesh.geometry.attributes.position.array[3*3*13+3*6+1]};},
 setState(name){const i=Object.keys(descriptions).indexOf(name);if(i<0)return false;poses.children[i].click();return true;},
 snapshot(){return {state,paused,time,bankDirection,rootRoll:root.rotation.z,
 cameraType:camera.isOrthographicCamera?'orthographic':'perspective',referenceFrame:referenceFrameMetrics(),
 cameraFrustum:camera.isOrthographicCamera?{left:camera.left,right:camera.right,top:camera.top,bottom:camera.bottom}:null,
 modelBounds:new THREE.Box3().setFromObject(root).getSize(new THREE.Vector3()).toArray(),
 wingAngles:wings.map(w=>w.shoulder.rotation.x),
 wingFold:wings.map(w=>w.shoulder.rotation.y),jawAngle:jaw.rotation.z,
 headAngle:head.rotation.z,chestHeight:chest.scale.y,
 breath:breathPreview.snapshot(),
 visible:renderer.domElement.width>0&&renderer.domElement.height>0,
 drawCalls:renderer.info.render.calls,triangles:renderer.info.render.triangles};}};
