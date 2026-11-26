// Paulo v5.4 original procedural dragon factory.
// Deliberately independent of DOM, canvas, renderer, camera, and gameplay
// simulation. The game owns collision, attacks, input, health and timing.
// The isolated lab may inject preview-only breath effects; gameplay omits them.
export function createPauloRig(THREE,{breathPreviewFactory=null}={}){
const mat={
 armor:new THREE.MeshStandardMaterial({color:0x343943,roughness:.83,metalness:.13,emissive:0x181d24,emissiveIntensity:.27}),
 plates:new THREE.MeshStandardMaterial({color:0x58535f,roughness:.74,metalness:.13,emissive:0x2b2331,emissiveIntensity:.29}),
 red:new THREE.MeshStandardMaterial({color:0xb43a4b,roughness:.69,side:THREE.DoubleSide,emissive:0x471520,emissiveIntensity:.26}),
 membrane:new THREE.MeshStandardMaterial({color:0x975360,roughness:.91,side:THREE.DoubleSide,transparent:false,vertexColors:true,emissive:0x30151c,emissiveIntensity:.09}),
 bronze:new THREE.MeshStandardMaterial({color:0xc6a073,metalness:.34,roughness:.51,emissive:0x3d2916,emissiveIntensity:.13}),
 eye:new THREE.MeshStandardMaterial({color:0xffcb64,emissive:0xbd5809,emissiveIntensity:.72}),
 mouth:new THREE.MeshStandardMaterial({color:0x160e14,roughness:.92}),
 skin:new THREE.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.8,metalness:.1,emissive:0x1b1f27,emissiveIntensity:.24}),
 belly:new THREE.MeshStandardMaterial({color:0x8a5b4c,roughness:.7,metalness:.05,emissive:0x2a130f,emissiveIntensity:.2}),
 hide:new THREE.MeshStandardMaterial({color:0x3f424e,roughness:.8,metalness:.1,emissive:0x1b1f27,emissiveIntensity:.24}),
 pupil:new THREE.MeshStandardMaterial({color:0x050304,roughness:.4}),
 ivory:new THREE.MeshStandardMaterial({color:0xe7d8b7,roughness:.68})
};
const root=new THREE.Group();
const rigMarkers=[];
// Anatomy switch. A wyvern has its wings AS its forelimbs (the classic
// film-dragon body plan); the original six-limbed layout can be restored by
// setting this false. The four leg pivots always exist so game.js and the
// pose code keep working; with WYVERN the two fore pivots simply carry no mesh.
const WYVERN=true;
const sphere=new THREE.SphereGeometry(1,16,12);
const cone=new THREE.ConeGeometry(1,1,8);
const skinSphere=sphere.clone();
{const n=skinSphere.attributes.normal,c=[],k=new THREE.Color(),d=new THREE.Color(0x3d4350),f=new THREE.Color(0x56454d),v=new THREE.Color(0xa86f58);
 for(let i=0;i<n.count;i++){const ny=n.getY(i),nz=n.getZ(i);const w=Math.min(1,Math.max(0,(-ny+.15)/.75));
  k.copy(d).lerp(f,Math.min(1,Math.abs(nz)*.6)*(1-w)).lerp(v,w);c.push(k.r,k.g,k.b);}
 skinSphere.setAttribute('color',new THREE.Float32BufferAttribute(c,3));}
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
// ---------------------------------------------------------------------------
// Lofted organic surfaces. A loft sweeps an elliptical cross-section (ry tall,
// rz wide) along a path, giving continuous muscle/neck/tail forms instead of
// stacked ellipsoids. Vertex colours carry dorsal-to-ventral counter-shading,
// soft mottling and belly banding, so no textures are allocated.
// ---------------------------------------------------------------------------
const UP=new THREE.Vector3(0,1,0),ALT=new THREE.Vector3(1,0,0);
const cDorsal=new THREE.Color(0x3d4350),cFlank=new THREE.Color(0x56454d),cVentral=new THREE.Color(0xa86f58);
function hash3(x,y,z){const s=Math.sin(x*12.9898+y*78.233+z*37.719)*43758.5453;return s-Math.floor(s);}
function loft(parent,material,secs,{radial=14,ventral=true,band=0,tint=null}={}){
 const n=secs.length,R=radial,pos=[],col=[],idx=[];
 const t=new THREE.Vector3(),side=new THREE.Vector3(),u=new THREE.Vector3(),tmp=new THREE.Vector3(),c=new THREE.Color();
 for(let i=0;i<n;i++){
  const a=secs[Math.max(0,i-1)].p,b=secs[Math.min(n-1,i+1)].p;
  t.set(b[0]-a[0],b[1]-a[1],b[2]-a[2]).normalize();
  side.crossVectors(t,UP);if(side.lengthSq()<.04)side.crossVectors(t,ALT);
  side.normalize();u.crossVectors(side,t).normalize();
  const s=secs[i],ry=s.ry,rz=s.rz??s.ry;
  for(let j=0;j<R;j++){
   const ang=j/R*Math.PI*2,cy=Math.cos(ang),sz=Math.sin(ang);
   tmp.set(s.p[0],s.p[1],s.p[2]).addScaledVector(u,ry*cy).addScaledVector(side,rz*sz);
   pos.push(tmp.x,tmp.y,tmp.z);
   if(tint){c.set(tint);const k=.9+.2*hash3(tmp.x*5,tmp.y*5,tmp.z*5);c.multiplyScalar(k);}
   else{
    const w=ventral?Math.min(1,Math.max(0,(-cy+.15)/.75)):0;
    const flank=Math.min(1,Math.abs(sz)*.6);
    c.copy(cDorsal).lerp(cFlank,flank*(1-w)).lerp(cVentral,w);
    let k=.88+.24*hash3(Math.round(tmp.x*7),Math.round(tmp.y*9),Math.round(tmp.z*7));
    if(band&&w>.35)k*=(Math.floor(i*band)%2)?1:.8; // belly scute banding
    c.multiplyScalar(k);
   }
   col.push(c.r,c.g,c.b);
  }
 }
 for(let i=0;i<n-1;i++)for(let j=0;j<R;j++){
  const a=i*R+j,b=i*R+(j+1)%R,cc=(i+1)*R+j,d=(i+1)*R+(j+1)%R;
  idx.push(a,b,cc,b,d,cc);
 }
 // end caps: one centre vertex each, wound outward from the sweep direction
 for(const [i,sgn] of [[0,-1],[n-1,1]]){
  const centre=pos.length/3;const p=secs[i].p;
  pos.push(p[0],p[1],p[2]);col.push(col[i*R*3],col[i*R*3+1],col[i*R*3+2]);
  for(let j=0;j<R;j++){const a=i*R+j,b=i*R+(j+1)%R;if(sgn>0)idx.push(centre,a,b);else idx.push(centre,b,a);}
 }
 const g=new THREE.BufferGeometry();
 g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
 g.setAttribute('color',new THREE.Float32BufferAttribute(col,3));
 g.setIndex(idx);g.computeVertexNormals();
 const m=new THREE.Mesh(g,material);parent.add(m);return m;
}
// Smooth interpolation between sections so organic forms can be sampled.
function sec(x,y,ry,rz,z=0){return {p:[x,y,z],ry,rz};}
function sampleTop(secs,x){
 for(let i=0;i<secs.length-1;i++){
  const a=secs[i],b=secs[i+1];
  if(x>=a.p[0]&&x<=b.p[0]){const k=(x-a.p[0])/(b.p[0]-a.p[0]);return a.p[1]+(b.p[1]-a.p[1])*k+(a.ry+(b.ry-a.ry)*k);}
 }
 return secs[secs.length-1].p[1]+secs[secs.length-1].ry;
}
// A curved tapering spar: quadratic path from a to b bowed by `bow`.
function spar(parent,material,a,b,r0,r1,{bow=[0,0,0],radial=8,steps=5,tint=null}={}){
 const secs=[];
 for(let i=0;i<=steps;i++){
  const k=i/steps,w=Math.sin(Math.PI*k);
  secs.push({p:[a[0]+(b[0]-a[0])*k+bow[0]*w,a[1]+(b[1]-a[1])*k+bow[1]*w,a[2]+(b[2]-a[2])*k+bow[2]*w],ry:r0+(r1-r0)*k});
 }
 return loft(parent,material,secs,{radial,ventral:false,tint});
}
// ------------------------------- body --------------------------------------
const torso=pivot(root,[0,0,0]);marker(torso);
const torsoSecs=[sec(-2.05,.06,.36,.34),sec(-1.55,.02,.52,.47),sec(-1.1,0,.62,.56),sec(-.4,-.02,.74,.64),sec(.4,.02,.8,.68),sec(1.0,.1,.84,.72),sec(1.5,.2,.78,.66),sec(1.9,.34,.6,.52)];
loft(torso,mat.skin,torsoSecs,{radial:18,band:1.5});
// Belly scutes: a lighter, banded under-plate strip.
ell(torso,mat.belly,[.35,-.56,0],[1.35,.3,.5]);
// Haunch masses where the hind legs join the body.
for(const side of [-1,1])part(torso,skinSphere,mat.skin,[-1.18,-.12,side*.42],[.62,.58,.3]);
// Dorsal crest: a graded row that rises over the shoulders and fades at the hips.
for(let i=0;i<13;i++){
 const x=-1.65+i*.29,s=.16+.17*Math.sin(Math.min(1,(i+1.5)/13)*Math.PI);
 spike(torso,x,sampleTop(torsoSecs,x)-.08,0,s);
}
// Repeated overlapping dorsal armor plates share a single instanced draw call.
const plateGeo=new THREE.ConeGeometry(.12,.34,5);
const plateBatch=new THREE.InstancedMesh(plateGeo,mat.plates,66);
const plateDummy=new THREE.Object3D();
let plateIndex=0;
for(let row=0;row<6;row++)for(let col=0;col<11;col++){
 const x=-1.58+col*.29;
 const angle=-.78+row*.31;
 plateDummy.position.set(x,.76*Math.cos(angle)+.08,.7*Math.sin(angle));
 plateDummy.rotation.set(angle,0,-.34);
 const size=.7+.25*Math.sin(col*.6+row);
 plateDummy.scale.set(size,.7+size*.4,size);
 plateDummy.updateMatrix();plateBatch.setMatrixAt(plateIndex++,plateDummy.matrix);
}
plateBatch.instanceMatrix.needsUpdate=true;
torso.add(plateBatch);
const chest=pivot(torso,[1.12,.16,0]);marker(chest);
// Deep keel chest; the sternum ridge sits lower than the belly line.
part(chest,skinSphere,mat.skin,[.1,-.04,0],[.62,.66,.56]);
ell(chest,mat.belly,[.22,-.4,0],[.55,.3,.38]);
// ------------------------------- neck & head --------------------------------
const neck=pivot(chest,[.74,.47,0]);marker(neck);
const neckSecs=[sec(-.95,-.5,.6,.52),sec(-.45,-.2,.48,.42),sec(-.05,-.02,.4,.36),sec(.25,.1,.34,.31),sec(.8,.2,.29,.27),sec(1.3,.22,.26,.25)];
loft(neck,mat.skin,neckSecs,{radial:14,band:1.2});
// Neck crest, fading toward the skull.
for(let i=0;i<7;i++){const x=-.45+i*.2;spike(neck,x,sampleTop(neckSecs,x)-.08,0,.2-i*.016);}
const head=pivot(neck,[1.27,.24,0]);marker(head);
// Elongated wedge skull with a heavy brow, long muzzle and swept-back horns.
const skull=[sec(-.38,.02,.34,.36),sec(.02,.06,.4,.42),sec(.45,.03,.31,.35),sec(.92,-.01,.2,.25),sec(1.38,-.04,.13,.17),sec(1.52,-.05,.085,.12)];
loft(head,mat.skin,skull,{radial:14,ventral:true});
ell(head,mat.plates,[.52,.06,0],[.6,.2,.2]); // nasal ridge
// Nostrils and a darker snout tip.
for(const side of [-1,1])ell(head,mat.mouth,[1.36,.02,side*.085],[.05,.035,.035]);
const jaw=pivot(head,[.55,-.22,0]);marker(jaw);
// Animated muzzle socket follows the neck, head, banking and facing.
const mouthAnchor=pivot(head,[1.39,-.11,0]);
const jawSecs=[sec(-.4,-.05,.1,.27),sec(.1,-.065,.115,.26),sec(.55,-.075,.1,.2),sec(1.0,-.07,.065,.12)];
loft(jaw,mat.skin,jawSecs,{radial:10,ventral:true});
ell(jaw,mat.mouth,[.4,.012,0],[.58,.05,.2]); // tongue / mouth floor
for(let i=0;i<4;i++)spike(jaw,.0+i*.18,-.13-i*.01,0,.1-i*.012); // chin spines
const eyes=[];
for(const side of [-1,1]){
 // Eyes: amber with a dark vertical slit pupil, under a heavy brow.
 const eyeMesh=ell(head,mat.eye,[.33,.15,side*.36],[.12,.08,.07]);
 const pupilMesh=ell(head,mat.pupil,[.35,.15,side*.415],[.03,.075,.012]);
 // Eyelid: a skin-coloured shell that scales shut for blinks.
 const lidMesh=part(head,skinSphere,mat.skin,[.33,.15,side*.372],[.14,.0006,.09]);lidMesh.visible=false;
 eyes.push({eye:eyeMesh,pupil:pupilMesh,lid:lidMesh});
 ell(head,mat.plates,[.29,.27,side*.35],[.38,.09,.15]);
 // Swept-back primary horn and a shorter cheek horn.
 spar(head,mat.bronze,[.0,.3,side*.26],[-1.05,.58,side*.5],.12,.012,{bow:[.1,.22,side*.05],radial:8,steps:6});
 spar(head,mat.bronze,[.12,.0,side*.4],[-.55,.12,side*.72],.075,.01,{bow:[.0,.1,0],radial:7,steps:5});
 spar(head,mat.bronze,[.55,.19,side*.3],[.2,.46,side*.4],.045,.01,{radial:6,steps:3});
 ell(head,mat.mouth,[1.2,-.015,side*.205],[.09,.045,.067]);
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
  toothDummy.position.set(upper?.53+i*.135:.20+i*.14,upper?-.23:.045,side*(upper?.24:.23)*(1-i*.045));
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
// ------------------------------- tail ---------------------------------------
// Seven tapering links that overlap their neighbours, so the silhouette stays
// continuous while the original seven pivots keep animating independently.
const tail=[],tailProfile=[];let previous=torso;
for(let i=0;i<7;i++){
 const seg=pivot(previous,i===0?[-1.78,.04,0]:[-.61,0,0]);marker(seg);
 const baseRadius=Math.max(.075,.34-i*.037);
 const tipRadius=Math.max(.058,baseRadius-.037);
 const length=.74;
 loft(seg,mat.skin,[sec(.16,0,baseRadius*1.03,baseRadius*.95),sec(-.3,0,(baseRadius+tipRadius)*.5,(baseRadius+tipRadius)*.46),sec(-length+.04,0,tipRadius,tipRadius*.92)],{radial:10,band:1});
 spike(seg,-.25,.24-i*.025+ (i===0?.06:0),0,Math.max(.09,.25-i*.022));
 tailProfile.push({length,baseRadius,tipRadius});
 tail.push(seg);previous=seg;
}
// Leaf-shaped barbed tail tip.
part(previous,cone,mat.bronze,[-.82,0,0],[.2,.9,.07],[0,0,Math.PI/2]);
part(previous,cone,mat.bronze,[-.55,.0,0],[.14,.4,.11],[0,0,Math.PI/2]);
// ------------------------------- legs ---------------------------------------
const legs=[];
for(const side of [-1,1])for(const fore of [false,true]){
 const hip=pivot(torso,[fore?1.05:-1.2,-.4,side*.56]);marker(hip);
 const knee=pivot(hip,[fore?.2:-.27,-.87,side*.05]);marker(knee);
 const foot=pivot(knee,[.28,-.76,0]);marker(foot);
 if(!(WYVERN&&fore)){
  const big=fore?.85:1;
  part(hip,skinSphere,mat.skin,[-.06,-.2,side*.06],[.4*big,.46*big,.28*big]); // thigh muscle
  loft(hip,mat.skin,[sec(0,-.05,.3*big,.26*big,side*.04),sec(-.13,-.45,.23*big,.2*big,side*.05),sec(-.27,-.87,.17*big,.16*big,side*.05)],{radial:10,ventral:false});
  ell(knee,mat.plates,[0,0,0],[.2,.2,.2]);
  loft(knee,mat.skin,[sec(0,0,.2*big,.19*big),sec(.14,-.38,.14*big,.14*big),sec(.28,-.76,.11*big,.12*big)],{radial:9,ventral:false});
  part(foot,skinSphere,mat.skin,[.2,-.04,0],[.46,.16,.27]);
  for(let c=-1;c<=1;c++)part(foot,cone,mat.bronze,[.58,-.07,c*.19],[.085,.36,.085],[0,0,-Math.PI/2]);
  part(foot,cone,mat.bronze,[-.18,-.04,0],[.07,.24,.07],[0,0,Math.PI/2+.35]); // dewclaw
 }
 legs.push({hip,knee,foot,fore,side});
}
function bone(parent,start,end,radius,material){
 return spar(parent,material,start,end,radius,radius*.55,{radial:8,steps:3,tint:material===mat.bronze?0xb8946a:0x3a3f4a});
}
// ------------------------------- wings --------------------------------------
// Curved, tessellated membrane fan. The leading and trailing edges are
// scalloped and the fabric billows in 3D. Geometry is generated once per wing
// panel, not during animation. Thin veins and darker margins along each finger
// are baked into vertex colours.
const MSEG=18,MRAD=8;
const membranePanels=[];
function membrane(parent,verts,side,region='outer'){
 const root=new THREE.Vector3(...verts[0]);
 const left=new THREE.Vector3(...verts[1]).sub(root);
 const right=new THREE.Vector3(...verts[2]).sub(root);
 const positions=[],uvs=[],colors=[],indices=[];
 const segments=MSEG,radial=MRAD;
 const quad=verts.length===4;
 const quadE=root,quadA=new THREE.Vector3(...verts[1]),quadB=new THREE.Vector3(...verts[2]),quadW=quad?new THREE.Vector3(...verts[3]):null;
 for(let j=0;j<=radial;j++){
  const v=j/radial;
  for(let i=0;i<=segments;i++){
   const u=i/segments;
   const scallop=Math.sin(Math.PI*u)*(region==='outer'?.17:region==='middle'?.09:.06);
   const reach=v*(1-scallop*v);
   let p;
   if(quad){ // four-corner patch: leading edge E->W, trailing edge A->B
    p=quadE.clone().lerp(quadW,u).lerp(quadA.clone().lerp(quadB,u),v*(1-.05*Math.sin(Math.PI*u)*v));
   }else p=root.clone().addScaledVector(left,reach*(1-u)).addScaledVector(right,reach*u);
   const bow=Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
   p.y+=side*bow*(region==='outer'?.3:.2);
   p.z+=side*bow*(region==='outer'?.23:.09);
   positions.push(p.x,p.y,p.z);
   uvs.push(u,v);
   // Darker at the bones (u~0,1), thin branching veins between them, and a
   // lighter, thinner membrane toward the trailing margin.
   const edge=Math.pow(Math.abs(Math.cos(Math.PI*u)),10);
   const vein=Math.exp(-Math.pow((u-.33-.08*v)*14,2))+Math.exp(-Math.pow((u-.67+.08*v)*14,2));
   const thin=.62+.5*v*(.6+.4*Math.sin(Math.PI*u));
   const shade=thin*(1-.42*edge)*(1-.22*vein*(1-v*.5));
   colors.push(shade*1.02,shade*(.78+.14*Math.sin(Math.PI*u)),shade*.8);
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
 geometry.attributes.position.setUsage(THREE.DynamicDrawUsage);
 const mesh=part(parent,geometry,mat.membrane);
 membranePanels.push({mesh,rest:Float32Array.from(positions),side,region});
 return mesh;
}
let membraneNormalTick=0;
function deformMembranes(t,intensity){
 const refreshNormals=(membraneNormalTick++%4)===0;
 for(const panel of membranePanels){
  const attr=panel.mesh.geometry.attributes.position,base=panel.rest;
  for(let j=0;j<=MRAD;j++){
   const v=j/MRAD;
   for(let i=0;i<=MSEG;i++){
    const u=i/MSEG,idx=j*(MSEG+1)+i,off=idx*3;
    const envelope=Math.sin(Math.PI*u)*Math.sin(Math.PI*v);
    const flutter=Math.sin(t*7-u*3.2-v*4.1)*.095*intensity;
    const camber=.17*intensity+flutter;
    attr.array[off+1]=base[off+1]+envelope*camber;
    attr.array[off+2]=base[off+2]+panel.side*envelope*
      (.12*intensity+.045*Math.sin(t*5.2-u*4+v*3)*intensity);
   }
  }
  attr.needsUpdate=true;
  if(refreshNormals)panel.mesh.geometry.computeVertexNormals();
 }
}
const wings=[];
// Wing size. WS enlarges the arm and finger spars; the membranes are cut with
// shallower scallops and anchored further back along the flank, so the wing
// reads as a broad, load-bearing airfoil rather than a few thin fingers.
const WS=1.2;
for(const side of [-1,1]){
 const shoulder=pivot(chest,[-.12,.55,side*.53]);marker(shoulder);
 // Pectoral mass so the wing grows out of the chest instead of attaching to it.
 part(shoulder,skinSphere,mat.skin,[-.1,-.1,side*.12],[.62,.5,.46]);
 const elbowOff=[-.35*WS,.28,side*1.8*WS];
 const wristOff=[-.85*WS,.1,side*1.5*WS];
 const elbow=pivot(shoulder,elbowOff);marker(elbow);
 bone(shoulder,[0,0,0],elbowOff,.26,mat.armor);
 // Leading-edge membrane (propatagium): fills the angle in front of the arm.
 const T0=[-2.9,-.3,side*.6];// trailing-edge anchor on the flank
 membrane(shoulder,[[0,0,0],T0,elbowOff],side,'proximal');
 const wrist=pivot(elbow,wristOff);marker(wrist);
 part(elbow,skinSphere,mat.skin,[0,0,0],[.3,.28,.3]);
 bone(elbow,[0,0,0],wristOff,.2,mat.armor);
 const fingerEnds=[[-3.7,.03,3.8],[-2.2,.12,4.8],[-.4,.02,4.6],[.8,-.03,3.5]].map(([x,y,z])=>[x*WS,y,side*z*WS]);
 const base=[0,0,0],rear=[-2.5*WS,-.15,side*.5];
 part(wrist,skinSphere,mat.skin,[0,0,0],[.26,.24,.26]);
 // Thumb claw at the wrist: the hooked leading-edge claw reads as "dragon".
 part(wrist,cone,mat.bronze,[.22,.2,side*.1],[.11,.55,.11],[0,0,-1.05]);
 for(let i=0;i<fingerEnds.length;i++){
  bone(wrist,base,fingerEnds[i],.115-i*.01,mat.bronze);
  const e=fingerEnds[i];
  part(wrist,cone,mat.bronze,[e[0]+(i>1?.1:-.04),e[1],e[2]+side*.12],[.055,.28,.055],[side*Math.PI/2,0,i>1?-Math.PI/2:Math.PI/2]);
  const prev=i===0?rear:fingerEnds[i-1],next=fingerEnds[i];
  membrane(wrist,[base,prev,next],side);
 }
 // Continuous trailing edge: flank anchor T0 -> mid-span point T1 -> first finger.
 const T1=[wristOff[0]+rear[0],wristOff[1]+rear[1],wristOff[2]+rear[2]];
 membrane(elbow,[[0,0,0],[T0[0]-elbowOff[0],T0[1]-elbowOff[1],T0[2]-elbowOff[2]],T1,wristOff],side,'middle');
 wings.push({shoulder,elbow,wrist,side});
}

let disposed=false;
// ===========================================================================
// Animation system
//  * Every state-dependent pose value is a critically/under-damped spring, so
//    switching between idle, hover, flight, bank, attacks, hit, landing and
//    takeoff blends automatically instead of snapping. Attacks use springs
//    with a little overshoot (anticipation / recoil / settle).
//  * Wing flapping uses an integrated phase, so a change of flap rate never
//    jumps the wings. Downstroke is faster and stronger than the recovery
//    stroke, and elbow/wrist lag the shoulder (successive breaking of joints).
//  * Layered "life": breathing, smooth-noise head and neck drift, glances,
//    blinks, tail waves with traveling delay and occasional flicks, wing
//    rustles, jaw working, weight shifting, head stabilisation against body
//    pitch, hit/recoil impulses. Random events use a seeded generator driven
//    by animation time, so the lab and tests are repeatable.
// The game keeps authority over position, hitboxes and attacks; this is
// visual-only and still driven through applyPose(time,state,direction,poseElapsed).
// ===========================================================================
const springs=new Map();
let lastT=null,prevState=null,flap=0,breath=0,tailPh=0,rngState=0x9e3779b9;
function rnd(){rngState=(rngState+0x6D2B79F5)|0;let x=Math.imul(rngState^(rngState>>>15),1|rngState);x=(x+Math.imul(x^(x>>>7),61|x))^x;return((x^(x>>>14))>>>0)/4294967296;}
function spring(name,target,dt,freq=3,zeta=1){
 let s=springs.get(name);
 if(!s){s={x:target,v:0};springs.set(name,s);return target;}
 if(dt<=0)return s.x;
 const w=freq*6.2831853,n=Math.min(10,Math.ceil(dt/.01)),h=dt/n;
 for(let i=0;i<n;i++){s.v+=(-2*zeta*w*s.v-w*w*(s.x-target))*h;s.x+=s.v*h;}
 return s.x;
}
function kick(name,v){const s=springs.get(name);if(s)s.v+=v;else springs.set(name,{x:0,v});}
// Smooth pseudo-random drift in [-1,1]; incommensurate frequencies avoid visible loops.
function drift(t,seed){return(Math.sin(t*.61+seed)*.5+Math.sin(t*1.37+seed*2.1)*.3+Math.sin(t*2.53+seed*3.7)*.2);}
// Fast downstroke, slower recovery stroke (positive = down).
function stroke(p){const v=Math.sin(p)+.22*Math.sin(2*p+.6);return v>0?v:v*.78;}
const ev={blink:1.4,glance:.9,flick:4.5,shrug:6,growl:9,shift:3,blinkAt:-9,flickAt:-9,shrugAt:-9,growlAt:-9,flickDir:1,shrugDir:1,
 gazeY:0,gazeP:0,gazeTilt:0,shiftTo:0};
function resetEvents(t){
 ev.blink=t+1.2+rnd()*2;ev.glance=t+.6+rnd()*1.5;ev.flick=t+3.5+rnd()*4;ev.shrug=t+5+rnd()*6;ev.growl=t+8+rnd()*8;ev.shift=t+2+rnd()*3;
 ev.blinkAt=ev.flickAt=ev.shrugAt=ev.growlAt=-99;ev.gazeY=ev.gazeP=ev.gazeTilt=ev.shiftTo=0;
}
function env(t,start,dur){const u=(t-start)/dur;return u<0||u>1?0:Math.sin(Math.PI*u);}
function applyPose(t,state,bankDirection=1,poseElapsed=t){
 if(disposed)return; // never update buffers after the fallback releases this rig
 let dt=lastT===null?0:t-lastT;
 // First call, a restart, a lab scrub backward or a large skip: re-initialise
 // (springs adopt their targets) rather than animating through the gap.
 if(lastT===null||dt<0||dt>.25){springs.clear();dt=0;flap=t*4;breath=0;tailPh=0;resetEvents(t);prevState=null;}
 lastT=t;
 const S=state,airborne=!['idle','land','ground-turn'].includes(S);
 const enteredNew=prevState!==S&&prevState!==null;
 const attack=S==='inhale'||S==='wind'||S==='fire'||S==='gas';
 const calm0=S==='idle'?1:S==='hover'||S==='glide'?.7:attack?.12:.35; // how freely he fidgets
 const dir=bankDirection<0?-1:1;
 const sp=(n,tg,f,z)=>spring(n,tg,dt,f,z);
 // ---- impulses on entering a new pose (physical reaction, then spring settle)
 if(enteredNew){
  if(S==='hit'){kick('roll',dir*5.5);kick('pitch',-3.2);kick('flare',5);}
  else if(S==='fire')kick('pitch',1.7);
  else if(S==='wind')kick('pitch',2.4);
  else if(S==='gas')kick('pitch',-1.2);
  else if(S==='inhale')kick('pitch',-.9);
  else if(S==='takeoff')kick('flare',3.5);
  else if(S==='land')kick('flare',-2.5);
  if(prevState==='land'||S==='land')kick('bob',-1.6);
 }
 prevState=S;
 // ---- slow, state-dependent targets (these are what produce the transitions)
 const powerT=S==='hover'?1:S==='takeoff'?1.25:S==='flight'?.6:S==='hit'?.85:S==='bank'?.5:S==='land'?.55:
  S==='inhale'?.3:S==='wind'?.42:S==='fire'?.38:S==='gas'?.4:S==='glide'?.07:S==='idle'?.05:.1;
 const rateT=S==='idle'?1.4:S==='hover'?5.2:S==='takeoff'?6:S==='flight'?4.4:S==='glide'?2.2:S==='bank'?4.2:
  S==='hit'?6.2:S==='land'?5:S==='ground-turn'?2:4.6;
 const power=sp('power',powerT,2.2,1);
 const rate=sp('rate',rateT,1.6,1);
 flap+=dt*rate;breath+=dt*sp('breathRate',airborne?2.4:1.65,.6,1);tailPh+=dt*(1.15+.6*power);
 const bank=sp('bank',S==='bank'?.35*dir:0,3.4,.72);
 const transition=Math.min(1,Math.max(0,poseElapsed/.6));
 const landingBrake=sp('landB',S==='land'?1-transition:0,5,.9);
 const groundTurn=sp('gturn',S==='ground-turn'?Math.sin(Math.PI*Math.min(1,Math.max(0,poseElapsed)/.8)):0,6,.9);
 // Fidgets fade out while banking/turning so left and right turns stay mirror-symmetric.
 const lifeK=Math.max(0,1-Math.abs(bank)/.35-groundTurn),calm=calm0*lifeK;
 const inhale=sp('inhale',S==='inhale'?1:0,5.5,.8),windB=sp('windB',S==='wind'?1:0,6,.55);
 const gas=sp('gas',S==='gas'?1:0,5,.8),fire=sp('fire',S==='fire'?1:0,7,.5);
 const tuck=sp('tuck',S==='flight'||S==='glide'||S==='bank'||S==='takeoff'?1:S==='land'?0:S==='hover'?.28:airborne?.55:0,2.4,.9);
 const braced=sp('braced',S==='wind'?.26:S==='inhale'?.15:0,5,.7);
 const fireFold=sp('fireF',S==='fire'?.25:0,7,.55);
 const poseGlide=sp('pGlide',S==='glide'?1:0,2.6,1),poseIdle=sp('pIdle',S==='idle'?1:0,2.4,1);
 const poseLand=sp('pLand',S==='land'?1:0,4,.9),poseGT=sp('pGT',S==='ground-turn'?1:0,5,.9);
 const roll=sp('roll',0,2.6,.2),pitchK=sp('pitch',0,2.4,.25),flare=sp('flare',0,3,.3),bobK=sp('bob',0,3.2,.35);
 const takeCrouch=S==='takeoff'?Math.sin(Math.PI*Math.min(1,poseElapsed/.35))*.16:0;
 const crouch=sp('crouch',takeCrouch+(poseLand>0?.06*poseLand:0),8,.7);
 // ---- body: breathing, wing-driven bob/pitch, bank, impacts
 const stressed=S==='hit'?1:0;
 const bAmp=(airborne?.55:1)+.25*attack;
 const bs=Math.sin(breath-.5*Math.sin(breath))*.5+.5; // quick inhale, slower exhale
 const beatBob=stroke(flap-.35);
 const lift=sp('lift',airborne?.3:0,2.2,.85);
 root.position.y=lift+Math.sin(t*1.5)*.035*(1-Math.min(1,lift/.3))+beatBob*.11*power+groundTurn*.18+bobK*.12-crouch+(bs-.5)*.025*bAmp;
 root.rotation.x=bank*(.78+.22*Math.cos(t*.9))+roll+calm*drift(t,1.3)*.02;
 root.rotation.y=bank*.48+groundTurn*dir*.36+calm*drift(t,4.1)*.025;
 const bodyPitch=pitchK+stroke(flap-.9)*-.035*power+(S==='gas'?.04:0);
 root.rotation.z=bodyPitch+(S==='bank'?-.09*Math.abs(bank)/.35:0)+groundTurn*.28;
 torso.scale.set(1,1+inhale*.16+(bs*.028+drift(t,2)*.006)*bAmp,1+bs*.04*bAmp);
 torso.rotation.y=calm*drift(t,7.7)*.04;
 chest.scale.set(1+bs*.02*bAmp,1+inhale*.19+windB*.10+bs*.05*bAmp,1+bs*.055*bAmp+inhale*.06);
 // ---- neck/head: attack poses, gaze, stabilisation against body pitch
 if(t>=ev.glance){
  const reach=.2+.8*calm;ev.gazeY=(rnd()*2-1)*.55*reach;ev.gazeP=(rnd()*2-1)*.2*reach;ev.gazeTilt=(rnd()*2-1)*.1*reach;
  ev.glance=t+(S==='idle'?1.4+rnd()*3.2:.9+rnd()*2.6);
 }
 const gazeN=sp('gazeN',ev.gazeY*lifeK,1.6,.85),gazeH=sp('gazeH',ev.gazeY*lifeK,3.2,.62);
 const gazeP=sp('gazeP',ev.gazeP*lifeK,2.6,.7),tilt=sp('tilt',ev.gazeTilt*lifeK,2.2,.8);
 const neckZ=sp('neckZ',inhale>.01||S==='inhale'?.24*inhale:0,5.5,.7)+sp('neckZ2',(S==='wind'||S==='fire')?-.12:0,6.5,.5);
 const headZ=sp('headZ',(S==='wind'||S==='fire')?-.16:S==='gas'?.23:0,6.5,.5);
 const stab=bodyPitch*.55; // head holds level while the body pitches
 neck.rotation.z=neckZ+drift(t,3.3)*.035*(.4+calm*.6)-bs*.03*bAmp-stab*.5+gazeP*.35;
 neck.rotation.y=gazeN*.5+bank*.3;
 neck.rotation.x=drift(t,5.9)*.02*calm;
 head.rotation.z=headZ+drift(t,6.1)*.03*(.4+calm*.6)-stab*.5+gazeP*.65;
 head.rotation.y=gazeH*.55+(S==='bank'?bank*.35:0)+groundTurn*dir*.25;
 head.rotation.x=tilt+gazeN*-.08;
 // jaw: open for attacks (with overshoot), slack when idle, occasional working/growl
 if(t>=ev.growl&&S==='idle'){ev.growlAt=t;ev.growl=t+9+rnd()*10;}
 if(t>=ev.growl)ev.growl=t+9+rnd()*10;
 const jawT=(S==='wind'||S==='fire'||S==='gas')?-.37:S==='inhale'?-.11:0;
 jaw.rotation.z=sp('jaw',jawT,9,.45)-env(t,ev.growlAt,.9)*.14-poseIdle*.02-bs*.012*bAmp-calm*Math.max(0,drift(t,8.8))*.015;
 // eyes: blink on a random timer (sometimes double), squint when hit or firing
 if(t>=ev.blink){ev.blinkAt=t;ev.blink=t+(rnd()<.22?.32:2.2+rnd()*3.8);}
 const lidV=Math.min(1,env(t,ev.blinkAt,.17)*1.25);
 const squint=sp('squint',(S==='hit'?.6:S==='fire'?.4:S==='wind'?.3:0),8,.9);
 for(const e of eyes){
  e.lid.scale.y=.0006+lidV*.1;e.lid.visible=lidV>.04;
  e.eye.scale.y=.08*(1-.5*squint);e.pupil.scale.y=.075*(1-.35*squint);
 }
 // ---- wings: asymmetric beat + lagging joints + secondary motion
 if(t>=ev.shrug&&(S==='idle'||S==='hover'||S==='glide')){ev.shrugAt=t;ev.shrugDir=rnd()<.5?-1:1;ev.shrug=t+6+rnd()*9;}
 else if(t>=ev.shrug)ev.shrug=t+5+rnd()*6;
 const shrugE=env(t,ev.shrugAt,1.1)*(1-power*.6);
 wings.forEach(({shoulder,elbow,wrist,side})=>{
  const turnFold=sp('tf'+side,S==='bank'?(side===dir?.34:.045):0,4,.8);
  const shBeat=stroke(flap)*power,elBeat=stroke(flap-.58)*power,wrBeat=stroke(flap-1.1)*power;
  const sh=sp('shY'+side,poseGT>.5?.45+groundTurn*.13:poseLand>.5?-.15-landingBrake*.26:poseGlide>.5?-.10:poseIdle>.5?-.5:.04+fireFold+turnFold,3.4,.85);
  const wy=sp('wrY'+side,poseLand>.5?-.06-landingBrake*.28:poseGlide>.5?.02:poseIdle>.5?-.75:.11+fireFold*.5+turnFold*.72,3.4,.85);
  const rustle=shrugE*lifeK*(side===ev.shrugDir?1:.45);
  const micro=calm*drift(t,9.1+side)*.035;
  shoulder.position.y=.55+bs*.012*bAmp;
  shoulder.rotation.x=side*(.11+shBeat*.48+bank*side*.25+braced+landingBrake*.12+flare*.07+rustle*.06+micro*.5+bs*.015*bAmp);
  shoulder.rotation.y=side*sh;
  elbow.rotation.x=side*(.11+elBeat*.34+braced*.58+landingBrake*.22+rustle*.1+micro);
  elbow.rotation.y=side*(.05+turnFold*.42-.07*elBeat);
  wrist.rotation.x=side*(.06+wrBeat*.27+landingBrake*.14+rustle*.14+micro*1.4+flare*.04);
  wrist.rotation.y=side*wy;
  wrist.rotation.z=side*(.04-.18*wrBeat+turnFold*.26+rustle*.08);
 });
 // ---- tail: traveling wave, inertia against bank, vertical follow-through, flicks
 if(t>=ev.flick&&calm>.3){ev.flickAt=t;ev.flickDir=rnd()<.5?-1:1;ev.flick=t+4+rnd()*6;}
 else if(t>=ev.flick)ev.flick=t+3+rnd()*4;
 const fl=Math.exp(-Math.max(0,t-ev.flickAt)*2.4)*(t-ev.flickAt<2.2&&t>=ev.flickAt?1:0);
 tail.forEach((seg,i)=>{
  const lag=(t-ev.flickAt)*8.5-i*.75;
  seg.rotation.y=Math.sin(tailPh*1.5-i*.5)*(.07+.012*i)*(.6+.4*calm)+bank*(.22-i*.025)+groundTurn*dir*.13
   +ev.flickDir*fl*Math.sin(lag)*(.05+i*.022)*(lag>0?1:0);
  seg.rotation.z=Math.sin(tailPh-i*.35)*.04+stroke(flap-1.2-i*.3)*-.03*power*(1+i*.12)+(bs-.5)*.01*(i<2?1:0)
   +bodyPitch*-.08*(i+1)*.3;
 });
 // ---- legs: tuck envelope, idle weight shifting, landing/takeoff compression
 if(t>=ev.shift){ev.shiftTo=(rnd()*2-1);ev.shift=t+3+rnd()*5;}
 const shiftV=sp('shift',ev.shiftTo,1.3,.9)*(poseIdle>.5?1:0)*.5;
 legs.forEach(({hip,knee,foot,fore,side})=>{
  const flightFold=Math.max(0,(tuck-.28)/.72);
  const sq=crouch*(fore?.5:1.1);
  hip.rotation.z=-(fore?1.30:1.19)*tuck-(fore?.34:.27)*flightFold+(fore?.55:-.22)*groundTurn-sq*.9+side*shiftV*.05;
  knee.rotation.z=-(fore?.69:.61)*tuck-(fore?.45:.67)*flightFold+
    (poseLand>.5?.2*(1-tuck):0)-(fore?.25:0)*groundTurn+sq*1.4;
  foot.rotation.z=(fore?.64:.55)*tuck-(fore?.61:.54)*flightFold+(fore?.2:0)*groundTurn-sq*.5;
 });
 deformMembranes(t,sp('mem',S==='glide'?.35:S==='idle'?.12:powerT,2.2,1));
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
  upperTeeth,lowerTeeth,breathPreview,head,jaw,mouthAnchor,neck,chest,
  applyPose,dispose,
  membraneDeformation(){
   const p=membranePanels[0],off=((MRAD>>1)*(MSEG+1)+(MSEG>>1))*3+1;
   return {rest:p.rest[off],current:p.mesh.geometry.attributes.position.array[off]};
  }
 };
}
