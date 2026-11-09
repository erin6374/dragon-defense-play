// Paulo v5.4 original procedural dragon factory.
// Deliberately independent of DOM, canvas, renderer, camera, and gameplay
// simulation. The game owns collision, attacks, input, health and timing.
// The isolated lab may inject preview-only breath effects; gameplay omits them.
export function createPauloRig(THREE,{breathPreviewFactory=null}={}){
const mat={
 armor:new THREE.MeshStandardMaterial({color:0x343943,roughness:.83,metalness:.13,emissive:0x181d24,emissiveIntensity:.27}),
 plates:new THREE.MeshStandardMaterial({color:0x58535f,roughness:.74,metalness:.13,emissive:0x2b2331,emissiveIntensity:.29}),
 red:new THREE.MeshStandardMaterial({color:0xb43a4b,roughness:.69,side:THREE.DoubleSide,emissive:0x471520,emissiveIntensity:.26}),
 membrane:new THREE.MeshStandardMaterial({color:0xc55268,roughness:.78,side:THREE.DoubleSide,transparent:true,opacity:.95,vertexColors:true,emissive:0x4f1927,emissiveIntensity:.22}),
 bronze:new THREE.MeshStandardMaterial({color:0xc6a073,metalness:.34,roughness:.51,emissive:0x3d2916,emissiveIntensity:.13}),
 eye:new THREE.MeshStandardMaterial({color:0xffcb64,emissive:0xbd5809,emissiveIntensity:.72}),
 mouth:new THREE.MeshStandardMaterial({color:0x160e14,roughness:.92}),
 ivory:new THREE.MeshStandardMaterial({color:0xe7d8b7,roughness:.68})
};
const root=new THREE.Group();
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
const breathPreview=breathPreviewFactory?.(head) ?? {
 update(){}, snapshot(){return {active:null,poolSize:0,drawnInstances:0,visibleEmitters:0}}
};
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
 legs.push({hip,knee,foot,fore,side});
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
function membrane(parent,verts,side,region='outer'){
 const root=new THREE.Vector3(...verts[0]);
 const left=new THREE.Vector3(...verts[1]).sub(root);
 const right=new THREE.Vector3(...verts[2]).sub(root);
 const positions=[],uvs=[],colors=[],indices=[];
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
   // Prebaked radial tint gives each membrane depth at night without
   // allocating textures or adding lights/draw calls during gameplay.
   const depth=.59+.38*v*(.65+.35*Math.sin(Math.PI*u));
   colors.push(depth,depth*(.80+.17*Math.sin(Math.PI*u)),depth*.90);
   if(i<segments&&j<radial){
    const a=j*(segments+1)+i,b=a+segments+1;
    indices.push(a,b,a+1,b,b+1,a+1);
   }
  }
 }
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
 geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
 geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
 geometry.setIndex(indices);geometry.computeVertexNormals();
 // Keep the rest pose in a typed array; deformation is a bounded update
 // of existing vertex buffers, never a per-frame mesh allocation.
 geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
 const mesh=part(parent,geometry,mat.membrane);
 membranePanels.push({mesh,rest:Float32Array.from(positions),side,region});
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
 // Shoulder-to-elbow patagium fills the previously bare upper wing.
 // Its shoulder pivot is shared with the upper arm, so banks and wingbeats
 // move the leading edge with the existing articulated rig.
 membrane(shoulder,[[0,0,0],[-2.35,-.28,side*.40],[-.35,.28,side*1.8]],side,'proximal');
 const wrist=pivot(elbow,[-.85,.1,side*1.5]);marker(wrist);
 bone(elbow,[0,0,0],[-.85,.1,side*1.5],.12,mat.armor);
 const fingerEnds=[[-3.7,.03,side*3.8],[-2.2,.12,side*4.8],[-.4,.02,side*4.6],[.8,-.03,side*3.5]];
 const base=[0,0,0],rear=[-2.15,-.05,side*.45];
 for(let i=0;i<fingerEnds.length;i++){
  bone(wrist,base,fingerEnds[i],.055,mat.bronze);
  const prev=i===0?rear:fingerEnds[i-1],next=fingerEnds[i];
  membrane(wrist,[base,prev,next],side);
 }
 membrane(elbow,[[0,0,0],[-.85,.1,side*1.5],[-3.05,-.24,side*.26]],side,'middle');
 wings.push({shoulder,elbow,wrist,side});
}

let disposed=false;
function applyPose(t,state,bankDirection=1,poseElapsed=t){
 if(disposed)return; // never update buffers after the fallback releases this rig
 const cycle=Math.sin(t*5),soft=Math.sin(t*2);
 const airborne=!['idle','land'].includes(state);
 const power=state==='hover'?1:state==='takeoff'?1.25:state==='flight'?.6:state==='hit'?.85:state==='bank'?.48:.07;
 const bank=state==='bank'?.35*bankDirection:0;
 root.position.y=airborne?.3+cycle*.11*power:Math.sin(t*1.5)*.035;
 // Paulo faces +X, so banking rolls about his longitudinal X axis, not Z (pitch).
 root.rotation.x=bank*(.78+.22*Math.cos(t*.9));
 // Impact recoil decays from time IN THIS pose, not session time. Otherwise
 // a late-level hit would vanish because the global wingbeat clock is large.
 root.rotation.z=state==='hit'?Math.sin(poseElapsed*12)*Math.exp(-poseElapsed*2)*.18:0;
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
 tail.forEach((seg,i)=>{
  // The tail trails into the turn, rather than waving independently of yaw.
  seg.rotation.y=Math.sin(t*1.7-i*.5)*.09+bank*(.22-i*.025);
  seg.rotation.z=Math.sin(t*1.15-i*.35)*.045;
 });
 // Eagles draw their legs back into the body after takeoff. Paulo has four
 // articulated legs, so both pairs fold rearward beneath the belly in forward
 // flight; hovering keeps a softer partial tuck. The takeoff and landing
 // envelopes avoid snapping straight between the planted and flight poses.
 const transition=Math.min(1,Math.max(0,poseElapsed/.6));
 const tuck=state==='flight'||state==='glide'||state==='bank'?1:
  state==='takeoff'?transition:state==='land'?1-transition:
  state==='hover'?.28:airborne?.55:0;
 legs.forEach(({hip,knee,foot,fore})=>{
  hip.rotation.z=-(fore?1.14:1.02)*tuck;
  knee.rotation.z=-(fore?.56:.48)*tuck+(state==='land'?.2*(1-tuck):0);
  foot.rotation.z=(fore?.64:.55)*tuck;
 });
 deformMembranes(t,state==='glide'?.35:state==='idle'?.12:power);
 breathPreview.update(state,t);
}

 // The final game can switch to the legacy dragon without retaining
 // duplicate rig buffers. Geometry and material sets prevent double-disposal
 // of the shared sphere, cone and armor assets within this factory instance.
 function dispose(){
  if(disposed)return {geometries:0,materials:0};
  disposed=true;
  root.removeFromParent();
  const geometries=new Set(),materials=new Set();
  root.traverse(object=>{
   if(!object.isMesh)return;
   if(object.geometry)geometries.add(object.geometry);
   const current=Array.isArray(object.material)?object.material:[object.material];
   for(const material of current)if(material)materials.add(material);
  });
  for(const geometry of geometries)geometry.dispose();
  for(const material of materials)material.dispose();
  return {geometries:geometries.size,materials:materials.size};
 }
 return {
  root,rigMarkers,wings,legs,tailProfile,membranePanels,plateIndex,
  upperTeeth,lowerTeeth,breathPreview,head,jaw,neck,chest,
  applyPose,dispose,
  membraneDeformation(){
   const p=membranePanels[0],off=3*3*13+3*6+1;
   return {rest:p.rest[off],current:p.mesh.geometry.attributes.position.array[off]};
  }
 };
}
