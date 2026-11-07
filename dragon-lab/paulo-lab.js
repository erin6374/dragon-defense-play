import * as THREE from 'three';
const host=document.querySelector('#viewport');
const scene=new THREE.Scene();scene.background=new THREE.Color('#101a27');
scene.fog=new THREE.Fog('#101a27',28,65);
const camera=new THREE.PerspectiveCamera(40,1,.1,120);
camera.position.set(13,9,18);camera.lookAt(0,1,0);
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
 mouth:new THREE.MeshStandardMaterial({color:0x160e14,roughness:.92})
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
const chest=pivot(torso,[1.12,.16,0]);marker(chest);
ell(chest,mat.armor,[.25,.06,0],[.8,.82,.69]);
const neck=pivot(chest,[.74,.47,0]);marker(neck);
ell(neck,mat.armor,[.56,.21,0],[.9,.33,.32]);
ell(neck,mat.red,[.6,-.06,0],[.66,.17,.24]);
const head=pivot(neck,[1.27,.24,0]);marker(head);
ell(head,mat.armor,[.33,0,0],[.73,.35,.43]);
ell(head,mat.plates,[.82,-.08,0],[.57,.22,.31]);
const jaw=pivot(head,[.55,-.22,0]);marker(jaw);
ell(jaw,mat.mouth,[.38,-.035,0],[.56,.105,.29]);
for(const side of [-1,1]){
 ell(head,mat.eye,[.38,.13,side*.35],[.14,.09,.07]);
 part(head,cone,mat.bronze,[-.1,.38,side*.27],[.12,.7,.12],[0,0,-.6]);
 part(head,cone,mat.bronze,[.2,.34,side*.39],[.08,.38,.08],[0,0,-.35]);
 ell(head,mat.mouth,[1.05,-.06,side*.23],[.085,.045,.07]);
}
const tail=[];let previous=torso;
for(let i=0;i<7;i++){
 const seg=pivot(previous,i===0?[-1.78,.04,0]:[-.61,0,0]);marker(seg);
 ell(seg,i%2?mat.armor:mat.plates,[-.34,0,0],[.48-i*.047,.31-i*.033,.31-i*.033]);
 spike(seg,-.25,.24-i*.02,0,.25-i*.017);
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
function membrane(parent,verts){
 const geometry=new THREE.BufferGeometry(),flat=[];
 for(const v of verts)flat.push(...v);
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(flat,3));
 geometry.computeVertexNormals();return part(parent,geometry,mat.membrane);
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
  membrane(wrist,[base,prev,next]);
 }
 membrane(elbow,[[0,0,0],[-.85,.1,side*1.5],[-2.6,-.12,side*.35]]);
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
let state='hover',speed=1,time=0;
// Pose evaluation is deterministic and can be called immediately when the
// viewer switches states; animation frames then advance the same timeline.
for(const name of Object.keys(descriptions)){
 const button=document.createElement('button');button.textContent=name.toUpperCase();button.setAttribute('aria-pressed',name===state);
 button.addEventListener('click',()=>{state=name;time=0;description.textContent=descriptions[name];for(const b of poses.children)b.setAttribute('aria-pressed',b===button);applyPose(0);renderer.render(scene,camera);});
 poses.append(button);
}
description.textContent=descriptions[state];
document.querySelector('#speed').addEventListener('input',e=>speed=+e.target.value);
document.querySelector('#wire').addEventListener('change',e=>{for(const m of rigMarkers)m.visible=e.target.checked;});
const views={perspective:[13,9,18],front:[14,2,0],side:[0,3,19],top:[0,22,.01],rear:[-14,2,0]};
document.querySelector('#view').addEventListener('change',e=>{camera.position.set(...views[e.target.value]);camera.lookAt(0,0,0);});
let drag=false,prevX=0,prevY=0;
renderer.domElement.addEventListener('pointerdown',e=>{drag=true;prevX=e.clientX;prevY=e.clientY;renderer.domElement.setPointerCapture(e.pointerId);});
renderer.domElement.addEventListener('pointerup',()=>drag=false);
renderer.domElement.addEventListener('pointermove',e=>{if(!drag)return;const dx=e.clientX-prevX,dy=e.clientY-prevY;prevX=e.clientX;prevY=e.clientY;
 const spherical=new THREE.Spherical().setFromVector3(camera.position);
 spherical.theta-=dx*.008;spherical.phi=THREE.MathUtils.clamp(spherical.phi+dy*.008,.1,Math.PI-.1);
 camera.position.setFromSpherical(spherical);camera.lookAt(0,0,0);
});
renderer.domElement.addEventListener('wheel',e=>{e.preventDefault();camera.position.multiplyScalar(e.deltaY>0?1.09:.91);camera.position.clampLength(6,55);},{passive:false});
const clock=new THREE.Clock();
function applyPose(t){
 const cycle=Math.sin(t*5),soft=Math.sin(t*2);
 const airborne=!['idle','land'].includes(state);
 const power=state==='hover'?1:state==='takeoff'?1.25:state==='flight'?.6:state==='hit'?.85:state==='bank'?.48:.07;
 const bank=state==='bank'?.35:0;
 root.position.y=airborne?.3+cycle*.11*power:Math.sin(t*1.5)*.035;
 root.rotation.z=bank*Math.sin(t*1.2)+(state==='hit'?Math.sin(t*12)*Math.exp(-t*2)*.18:0);
 torso.scale.set(1,1+(state==='inhale'?.16:0)+soft*.015,1);
 chest.scale.set(1,1+(state==='inhale'?.19:state==='wind'?.10:0),1);
 neck.rotation.z=state==='inhale'?.24:state==='wind'||state==='fire'?-.12:Math.sin(t*.8)*.04;
 head.rotation.z=state==='wind'||state==='fire'?-.16:state==='gas'?.23:Math.sin(t*.9)*.035;
 jaw.rotation.z=['wind','fire','gas'].includes(state)?-.37:state==='inhale'?-.11:0;
 wings.forEach(({shoulder,elbow,wrist,side})=>{
  const phase=cycle*power;
  shoulder.rotation.x=side*(.12+phase*.47+bank*side*.24);
  shoulder.rotation.y=side*(state==='glide'?-.15:state==='idle'?.45:.08);
  elbow.rotation.x=side*(.12+phase*.22);
  wrist.rotation.y=side*(state==='glide'?.05:state==='idle'?.35:.16);
 });
 tail.forEach((seg,i)=>{seg.rotation.y=Math.sin(t*1.7-i*.5)*.09;seg.rotation.z=Math.sin(t*1.15-i*.35)*.045;});
 legs.forEach(({hip,knee,fore,side})=>{
  hip.rotation.z=airborne?(fore?-.22:.35):0;
  knee.rotation.z=state==='land'?.28:airborne?-.25:0;
 });
}
function animate(){
 requestAnimationFrame(animate);
 time+=Math.min(clock.getDelta(),.05)*speed;
 applyPose(time);
 renderer.render(scene,camera);
}
function resize(){const w=host.clientWidth,h=host.clientHeight;camera.aspect=w/Math.max(1,h);camera.updateProjectionMatrix();renderer.setSize(w,h,false);}
new ResizeObserver(resize).observe(host);resize();animate();
window.__PAULO_LAB_QA={states:Object.keys(descriptions),jointCount:rigMarkers.length,wingCount:wings.length,
 setState(name){const i=Object.keys(descriptions).indexOf(name);if(i<0)return false;poses.children[i].click();return true;},
 snapshot(){return {state,wingAngles:wings.map(w=>w.shoulder.rotation.x),jawAngle:jaw.rotation.z,headAngle:head.rotation.z,
 visible:renderer.domElement.width>0&&renderer.domElement.height>0};}};
