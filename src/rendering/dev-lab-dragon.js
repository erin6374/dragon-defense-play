// Dragon geometry copied directly from the production game (Preview 17).
// Update this snapshot if the main dragon's procedural mesh changes.
import {enhanceDragon} from './cinematic-assets.js';
export function createGameDragon(THREE){
const dragon=new THREE.Group();
const dragonSkin=new THREE.MeshStandardMaterial({color:0x211b25,roughness:.44,metalness:.10});
const dragonHighlights=new THREE.MeshStandardMaterial({color:0x762638,roughness:.39,metalness:.10});
const dragonBelly=new THREE.MeshStandardMaterial({color:0xd2a04a,roughness:.62,metalness:.03});
const hornMat=new THREE.MeshStandardMaterial({color:0xd7b77f,roughness:.55,metalness:.08});
const wingMembrane=new THREE.MeshStandardMaterial({color:0x9441a4,roughness:.55,metalness:.03,side:THREE.DoubleSide,transparent:true,opacity:.92});
const eyeMat=new THREE.MeshStandardMaterial({color:0xffd76c,emissive:0xf08b12,emissiveIntensity:.55,roughness:.18,metalness:.03});
function smoothPart(parent,geom,mat,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(geom,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);parent.add(m);return m;}
const orb=new THREE.SphereGeometry(1,24,16),spike=new THREE.ConeGeometry(1,1,16);
smoothPart(dragon,orb,dragonSkin,-.25,0,0,1.5,.78,.8); // torso
smoothPart(dragon,orb,dragonBelly,.05,-.23,.08,1.12,.49,.75);
const neck=smoothPart(dragon,orb,dragonHighlights,.94,.64,0,.53,.95,.52);neck.rotation.z=-.35;
smoothPart(dragon,orb,dragonSkin,1.64,1.22,0,.83,.57,.65); // skull
smoothPart(dragon,orb,dragonHighlights,2.28,.97,0,.80,.27,.45); // snout
for(const sign of [-1,1]){
 smoothPart(dragon,orb,eyeMat,2.02,1.38,sign*.52,.13,.12,.08);
 const horn=smoothPart(dragon,spike,hornMat,1.23,1.87,sign*.38,.19,.48,.17);horn.rotation.z=.45;
 for(let i=0;i<3;i++){const toe=smoothPart(dragon,spike,hornMat,-.72+i*.16,-1.06,sign*(.39+i*.12),.095,.20,.11);toe.rotation.z=Math.PI;}
 smoothPart(dragon,orb,dragonSkin,-.76,-.69,sign*.47,.33,.48,.29);
}
for(let i=0;i<8;i++){const x=-1.12+i*.38,y=.83-.08*Math.abs(i-3);const ridge=smoothPart(dragon,spike,hornMat,x,y,0,.14,.28,.25);ridge.rotation.z=.12;}
smoothPart(dragon,orb,dragonHighlights,.72,.28,0,.55,.34,.40);
for(const sign of [-1,1]){const jaw=smoothPart(dragon,orb,dragonBelly,1.98,.82,sign*.18,.30,.12,.23);jaw.rotation.z=.08*sign; const cheek=smoothPart(dragon,orb,dragonHighlights,1.56,1.05,sign*.36,.18,.15,.16); cheek.rotation.z=.18*sign;}
for(let i=0;i<7;i++){const t=i/6;const tail=smoothPart(dragon,orb,i%2?dragonHighlights:dragonSkin,-1.55-i*.45,-.1-i*.14,0,.56*(1-t)+.11,.28*(1-t)+.07,.34*(1-t)+.07);tail.rotation.z=.23;}
const wings=[];
for(const sign of [-1,1]){
 const pivot=new THREE.Group();pivot.position.set(-.3,.48,sign*.48);dragon.add(pivot);
 // Organic triangular fan with scalloped hem, thickness-free for mobile rendering.
 const pts=[[.2,0,0],[-.8,.5,sign*2.2],[-1.7,.36,sign*3.05],[-2.20,-.36,sign*2.35],[-1.6,-.13,sign*1.76],[-.85,-.48,sign*1.15]];
 const coords=[],idx=[];for(const p of pts)coords.push(...p);for(let j=1;j<pts.length-1;j++)idx.push(0,j,j+1);
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));geo.setIndex(idx);geo.computeVertexNormals();
 pivot.add(new THREE.Mesh(geo,wingMembrane));
 for(const i of [1,2,3,5]){
  const to=new THREE.Vector3(...pts[i]),from=new THREE.Vector3(...pts[0]);const vec=to.clone().sub(from),len=vec.length();
  const bone=new THREE.Mesh(new THREE.CylinderGeometry(.045,.08,len,6),dragonSkin);bone.position.copy(from).addScaledVector(vec,.5);bone.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());pivot.add(bone);
 }
 wings.push({pivot,sign});
}
dragon.scale.set(1.14,1.14,1.14);
dragon.scale.setScalar(1.20);
const dragonVisuals=enhanceDragon(THREE,dragon,wings);
dragon.position.set(0,2,15);
return {root:dragon,wings};
}
