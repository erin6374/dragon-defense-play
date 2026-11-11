// Dragon Defense 4.7 — original, geometry-based Philadelphia skyline.
// Reference-guided silhouettes. No photographic cutouts, no floating window cards.
// One mesh per architectural face plus shared low-detail roof ornament; diffuse and
// emissive maps are baked once so lighting changes don't allocate geometry/textures.
import * as THREE from 'three';
import {createBuildingCombustion} from './building-combustion.js';

function seeded(n){let x=n>>>0;return ()=>((x=(Math.imul(1664525,x)+1013904223)>>>0)/4294967296);}
function makeFacade(seed,style='glass'){
 const cv=document.createElement('canvas');cv.width=256;cv.height=1024;
 const ec=document.createElement('canvas');ec.width=256;ec.height=1024;
 const c=cv.getContext('2d'),e=ec.getContext('2d');const rnd=seeded(seed);
 const palette={glass:['#4b7188','#244354','#7898a9','#afcad3'],liberty:['#526e83','#203f53','#b4c1c9','#d9e3e6'],comcast:['#648899','#2c5368','#9bc3d0','#d6e8eb'],civic:['#b2a494','#6c665e','#d8d1c4','#e9dfcc'],office:['#657c90','#2a4457','#9cabb9','#d6d8d8']}[style]||['#587384','#304456','#a0b5c1','#e1e7e9'];
 const grad=c.createLinearGradient(0,0,256,1024);grad.addColorStop(0,palette[2]);grad.addColorStop(.3,palette[0]);grad.addColorStop(.9,palette[1]);grad.addColorStop(1,'#1e303d');c.fillStyle=grad;c.fillRect(0,0,256,1024);
 e.fillStyle='#000';e.fillRect(0,0,256,1024);
 const cols=style==='civic'?7:11,rows=style==='civic'?30:56,dx=256/cols,dy=1024/rows;
 const curtain=style==='glass'||style==='comcast'||style==='liberty';
 for(let row=0;row<rows;row++){
  for(let col=0;col<cols;col++){
   const inset=curtain?.035:.18;
   const x=col*dx+dx*inset,y=row*dy+dy*(curtain?.045:.16),w=dx*(1-2*inset),h=dy*(curtain?.88:.61);
   const isLit=rnd()>.79+(row%11===0?.09:0);
   c.fillStyle='rgba(8,23,36,.52)';c.fillRect(x-1,y-1,w+2,h+2);
   c.globalAlpha=curtain?.10+rnd()*.16:.20+rnd()*.57;
   c.fillStyle=rnd()>.31?palette[0]:palette[2];c.fillRect(x,y,w,h);
   c.globalAlpha=1;
   c.fillStyle='rgba(195,232,247,.23)';c.fillRect(x+1,y+1,Math.max(1,w*.15),h*.85);
   c.fillStyle='rgba(4,15,24,.34)';c.fillRect(x+w*.52,y,1.2,h);
   if(isLit){e.fillStyle=rnd()>.45?'#ffcf8d':'#ffebbb';e.fillRect(x+.7,y+1,w-1.4,h-2);}
  }
  c.fillStyle='rgba(11,27,37,.33)';c.fillRect(0,(row+1)*dy-1.7,256,1.7);
 }
 if(curtain){
  // Broad reflected sky bands unify the glazing; narrow mullions retain scale.
  // Baked once into the existing atlas, with no extra draw calls or textures.
  const reflection=c.createLinearGradient(0,0,256,0);
  reflection.addColorStop(0,'rgba(185,211,224,.04)');
  reflection.addColorStop(.28,'rgba(185,211,224,.24)');
  reflection.addColorStop(.46,'rgba(185,211,224,.06)');
  reflection.addColorStop(.73,'rgba(18,40,57,.18)');
  reflection.addColorStop(1,'rgba(185,211,224,.11)');
  c.fillStyle=reflection;c.fillRect(0,0,256,1024);
 }
 c.fillStyle=style==='civic'?'rgba(229,220,199,.25)':'rgba(211,232,243,.17)';
 for(let x=0;x<256;x+=style==='civic'?42:23)c.fillRect(x,0,2.3,1024);
 const map=new THREE.CanvasTexture(cv),emissive=new THREE.CanvasTexture(ec);
 map.colorSpace=THREE.SRGBColorSpace;emissive.colorSpace=THREE.SRGBColorSpace;
 map.anisotropy=2;map.minFilter=THREE.LinearMipmapLinearFilter;
 emissive.minFilter=THREE.LinearMipmapLinearFilter;
 return {map,emissive};
}
function polygonMesh(points,depth,frontMat,sideMat){
 // Polygon points are local X/Y pairs; complete geometry, rather than layers of boxes.
 const shape=new THREE.Shape();shape.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)shape.lineTo(points[i][0],points[i][1]);shape.closePath();
 const geo=new THREE.ShapeGeometry(shape);const uv=geo.attributes.uv;
 let mnX=Infinity,mxX=-Infinity,mnY=Infinity,mxY=-Infinity;
 for(const [x,y] of points){mnX=Math.min(mnX,x);mxX=Math.max(mxX,x);mnY=Math.min(mnY,y);mxY=Math.max(mxY,y)}
 for(let i=0;i<uv.count;i++){const x=geo.attributes.position.getX(i),y=geo.attributes.position.getY(i);uv.setXY(i,(x-mnX)/(mxX-mnX||1),(y-mnY)/(mxY-mnY||1));}
 const front=new THREE.Mesh(geo,frontMat);front.position.z=depth*.5;
 const sideVerts=[],normals=[],sideUv=[];
 for(let i=0;i<points.length;i++){
  const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dy=b[1]-a[1],edge=Math.hypot(dx,dy)||1;
  // one-sided sidewall surface, includes roof and side faces
  const v=[[a[0],a[1],depth*.5],[a[0],a[1],-depth*.5],[b[0],b[1],depth*.5],[b[0],b[1],depth*.5],[a[0],a[1],-depth*.5],[b[0],b[1],-depth*.5]];
  const nx=dy/edge,ny=-dx/edge;
  for(let j=0;j<6;j++){sideVerts.push(...v[j]);normals.push(nx,ny,0);sideUv.push(j===0||j===1||j===4?0:1,j===1||j===4||j===5?0:1);}
 }
 const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(sideVerts,3));sg.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));sg.setAttribute('uv',new THREE.Float32BufferAttribute(sideUv,2));
 const sides=new THREE.Mesh(sg,sideMat);return {front,sides};
}
function profile(w,h,roof){
 const hw=w/2;
 switch(roof){
  case 'liberty':return [[-hw,0],[hw,0],[hw,h*.77],[hw*.84,h*.77],[hw*.84,h*.83],[hw*.62,h*.83],[hw*.62,h*.89],[hw*.35,h*.89],[0,h],[ -hw*.35,h*.89],[-hw*.62,h*.89],[-hw*.62,h*.83],[-hw*.84,h*.83],[-hw*.84,h*.77],[-hw,h*.77]];
  case 'cityhall':return [[-hw,0],[hw,0],[hw,h*.63],[hw*.55,h*.63],[hw*.55,h*.76],[hw*.34,h*.76],[hw*.34,h*.86],[hw*.23,h*.86],[0,h],[ -hw*.23,h*.86],[-hw*.34,h*.86],[-hw*.34,h*.76],[-hw*.55,h*.76],[-hw*.55,h*.63],[-hw,h*.63]];
  case 'comcastTech':return [[-hw,0],[hw,0],[hw,h*.82],[hw*.53,h*.82],[hw*.53,h*.92],[hw*.26,h*.92],[hw*.18,h],[0,h],[0,h*.98],[-hw*.18,h*.96],[-hw*.18,h*.80],[-hw,h*.80]];
  case 'comcast':return [[-hw,0],[hw,0],[hw,h*.93],[hw*.64,h*.93],[hw*.64,h],[ -hw*.64,h],[-hw*.64,h*.93],[-hw,h*.93]];
  case 'setback':return [[-hw,0],[hw,0],[hw,h*.75],[hw*.76,h*.75],[hw*.76,h*.88],[hw*.48,h*.88],[hw*.48,h],[-hw*.48,h],[-hw*.48,h*.88],[-hw*.76,h*.88],[-hw*.76,h*.75],[-hw,h*.75]];
  case 'gabled':return [[-hw,0],[hw,0],[hw,h*.80],[0,h],[-hw,h*.80]];
  default:return [[-hw,0],[hw,0],[hw,h],[-hw,h]];
 }
}
function addLine(parent,x1,y1,x2,y2,mat,r=.065,z=1.2){const a=new THREE.Vector3(x1,y1,z),b=new THREE.Vector3(x2,y2,z),v=b.clone().sub(a);
 const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v.length(),5),mat);mesh.position.copy(a).addScaledVector(v,.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());parent.add(mesh);return mesh;}
export function createPhiladelphiaSkyline(parent,{detail='standard',flameTexture=null,smokeAtlas=null}={}){
 const group=new THREE.Group();group.name='PHILADELPHIA-ORIGINAL-3D-SKYLINE';parent.add(group);
 const towers=[],beacons=[],distantHelis=[],clockMat=new THREE.MeshBasicMaterial({color:0xd8c6a3});
 // A shared atlas and one dormant sprite per landmark. Impact effects never
 // allocate new GPU resources while meteor waves are running.
 const impactCanvas=document.createElement('canvas');
 impactCanvas.width=64;impactCanvas.height=64;
 const impactContext=impactCanvas.getContext('2d');
 const impactGlow=impactContext.createRadialGradient(32,32,1,32,32,31);
 impactGlow.addColorStop(0,'rgba(255,251,216,1)');
 impactGlow.addColorStop(.21,'rgba(255,181,74,.94)');
 impactGlow.addColorStop(.55,'rgba(249,81,28,.45)');
 impactGlow.addColorStop(1,'rgba(244,50,12,0)');
 impactContext.fillStyle=impactGlow;impactContext.fillRect(0,0,64,64);
 // One shared scorch/debris atlas, placed as a local damage decal on each tower.
 // Drawn at initialization rather than creating marks every time a meteor lands.
 const scorchCanvas=document.createElement('canvas');
 scorchCanvas.width=128;scorchCanvas.height=128;
 const scorchContext=scorchCanvas.getContext('2d');
 const scorchGlow=scorchContext.createRadialGradient(64,64,5,64,64,60);
 scorchGlow.addColorStop(0,'rgba(12,13,17,.90)');
 scorchGlow.addColorStop(.33,'rgba(29,30,34,.74)');
 scorchGlow.addColorStop(.65,'rgba(55,55,57,.35)');
 scorchGlow.addColorStop(1,'rgba(80,78,73,0)');
 scorchContext.fillStyle=scorchGlow;scorchContext.fillRect(0,0,128,128);
 scorchContext.lineWidth=2.2;scorchContext.strokeStyle='rgba(23,23,26,.78)';
 // Asymmetric glass fractures are static in the atlas; no live randomization.
 for(let i=0;i<10;i++){
  const angle=i*Math.PI*.2+.23*Math.sin(i*3);
  const radius=24+(i%3)*11;
  scorchContext.beginPath();scorchContext.moveTo(64,64);
  scorchContext.lineTo(64+Math.cos(angle)*radius*.48,64+Math.sin(angle)*radius*.48);
  scorchContext.lineTo(64+Math.cos(angle+.15)*radius,64+Math.sin(angle+.15)*radius);
  scorchContext.stroke();
 }
 const scorchTexture=new THREE.CanvasTexture(scorchCanvas);
 scorchTexture.colorSpace=THREE.SRGBColorSpace;
 const scorchMaterial=new THREE.SpriteMaterial({map:scorchTexture,transparent:true,opacity:0,depthWrite:false,depthTest:true});
 const impactTexture=new THREE.CanvasTexture(impactCanvas);
 impactTexture.colorSpace=THREE.SRGBColorSpace;
 const impactMaterial=new THREE.SpriteMaterial({map:impactTexture,transparent:true,opacity:0,depthWrite:false,depthTest:true,blending:THREE.AdditiveBlending});
 const trimMat=new THREE.MeshStandardMaterial({color:0x9eb8c6,metalness:.28,roughness:.6});
 const stoneMat=new THREE.MeshStandardMaterial({color:0xb7a690,roughness:.94});
 const gold=new THREE.MeshBasicMaterial({color:0xb29a68});
 const ambientBuildings=[
  [-99,28,10],[-90,39,7],[-78,33,12],[-65,43,10],[-51,31,11],[-37,36,8],[-21,34,10],[-3,40,12],[17,33,9],[33,36,12],[53,29,9],[68,40,11],[83,31,13],[97,34,9]
 ];
 // Distant intermediate city is part of the geometry, not a photo pasted behind a cutout.
 const farTex=makeFacade(9291,'office');
 const farMat=new THREE.MeshStandardMaterial({map:farTex.map,emissiveMap:farTex.emissive,emissive:0xffd8a1,emissiveIntensity:0,color:0x91a6b5,roughness:.86,metalness:.03,side:THREE.DoubleSide});
 const farSide=new THREE.MeshStandardMaterial({color:0x607789,roughness:.89,metalness:.02,side:THREE.DoubleSide});
 for(let i=0;i<ambientBuildings.length;i++){
  const [x,h,w]=ambientBuildings[i];const g=new THREE.Group();g.position.set(x,0,-9-i%3*2);group.add(g);
  const roof=i%5===0?'setback':i%7===0?'gabled':'flat';const poly=polygonMesh(profile(w,h,roof),2.5,farMat,farSide);
  g.add(poly.front,poly.sides);
 }
 const defs=[
  // Positions are artistically scaled for the view from North Broad, not a surveyed panorama.
  {id:'city-hall',x:66,w:11,h:70,roof:'cityhall',style:'civic',depth:3.2},
  {id:'comcast-technology',x:19,w:13,h:103,roof:'comcastTech',style:'comcast',depth:4.8},
  {id:'comcast-center',x:38,w:15,h:89,roof:'comcast',style:'comcast',depth:4.0},
  {id:'one-liberty-place',x:-38,w:13,h:90,roof:'liberty',style:'liberty',depth:4.7},
  {id:'two-liberty-place',x:-23,w:12,h:80,roof:'liberty',style:'liberty',depth:4.1},
  {id:'bny-mellon',x:51,w:12,h:69,roof:'setback',style:'office',depth:4.1},
  {id:'center-city-office',x:83,w:11,h:63,roof:'flat',style:'office',depth:4.0},
  {id:'other-center-city',x:-62,w:12,h:58,roof:'setback',style:'glass',depth:4.5},
  {id:'city-east',x:-8,w:11,h:54,roof:'setback',style:'office',depth:3.5}
 ];
 const SECONDARY_BURN_SITES_PER_TOWER=9; // Three staggered damaged floors, three openings each.
 const combustion=createBuildingCombustion(group,defs.length*SECONDARY_BURN_SITES_PER_TOWER,'skyline-combustion');
 // Warning beacons are tiny emissive meshes (no expensive shadow-casting lights).
 // One geometry shared by all fallen facade panels. A stock BoxGeometry has
 // six material groups (one draw for every face). The only distinct finish is
 // the camera-facing +Z facade. Reorder its indexed triangles into five side
 // faces then one front face, reducing six groups/draws to two per panel.
 const collapsedSlabGeo=new THREE.BoxGeometry(1,1,1);
 const slabIndices=collapsedSlabGeo.index.array;
 const groupedIndices=new Uint16Array(slabIndices.length);
 const faceOrder=[0,1,2,3,5,4];
 for(let face=0;face<faceOrder.length;face++){
  const at=faceOrder[face]*6;
  groupedIndices.set(slabIndices.slice(at,at+6),face*6);
 }
 collapsedSlabGeo.setIndex(new THREE.BufferAttribute(groupedIndices,1));
 collapsedSlabGeo.clearGroups();
 collapsedSlabGeo.addGroup(0,30,0); // shared opaque side finish
 collapsedSlabGeo.addGroup(30,6,1); // original textured front facade
 const beaconGeo=new THREE.SphereGeometry(.23,6,4);
 const beaconMat=new THREE.MeshBasicMaterial({color:0xff3a2c,transparent:true,opacity:.85,depthWrite:false});
 const crownMat=new THREE.MeshBasicMaterial({color:0xc6e9ff,transparent:true,opacity:.10,depthWrite:false});
 function beacon(parent,x,y,z,seed=0){const m=new THREE.Mesh(beaconGeo,beaconMat.clone());m.position.set(x,y,z);m.userData.phase=seed;parent.add(m);beacons.push(m);return m;}
 defs.forEach((d,i)=>{
  const g=new THREE.Group();g.name='landmark-'+d.id;g.position.set(d.x,0,-2-(i%3)*5);group.add(g);
  const tex=makeFacade(i*171+381,d.style);const facade=new THREE.MeshStandardMaterial({map:tex.map,emissiveMap:tex.emissive,emissive:0xffd29b,emissiveIntensity:0,color:0xffffff,roughness:.67,metalness:d.style==='civic'?.05:.24,side:THREE.DoubleSide});
  const side=new THREE.MeshStandardMaterial({color:d.style==='civic'?0x8f8476:0x38576a,roughness:.72,metalness:.14,side:THREE.DoubleSide});
  const poly=polygonMesh(profile(d.w,d.h,d.roof),d.depth,facade,side);g.add(poly.front,poly.sides);
  if(d.id.includes('liberty')){
   // Silver zigzag gable ribs are an important recognizable Liberty Place silhouette.
   const h=d.h,w=d.w;
   for(let k=0;k<3;k++){
    const y=h*(.78+k*.064),width=w*(.43-k*.12),top=h*(.83+(k+1)*.052);
    addLine(g,-width,y,0,top,trimMat,.085,d.depth/2+.13);
    addLine(g,0,top,width,y,trimMat,.085,d.depth/2+.13);
   }
   addLine(g,0,d.h,0,d.h+4,trimMat,.065,d.depth/2);
  }
  if(d.id==='comcast-center'){
   // Square, glass curtain-wall tower with a clipped/stepped flat parapet.
   const cap=new THREE.Mesh(new THREE.BoxGeometry(d.w*.83,1.2,.38),trimMat);
   cap.position.set(0,d.h*.981,d.depth/2+.20);g.add(cap);
   for(const x of [-d.w*.42,0,d.w*.42])addLine(g,x,d.h*.15,x,d.h*.94,trimMat,.045,d.depth/2+.17);
  }
  if(d.id==='comcast-technology'){
   const h=d.h,w=d.w;for(let j=0;j<4;j++)addLine(g,-w*.28+j*.16,h*.83,-w*.18+j*.10,h*.97,trimMat,.055,d.depth/2+.16);
   addLine(g,0,h,0,h+6,trimMat,.12,d.depth/2+.05);
  }
  if(d.id==='comcast-technology'){
   // Illuminated ventilating lantern and projecting top edge characteristic of CTC.
   const lantern=new THREE.Mesh(new THREE.BoxGeometry(d.w*.43,d.h*.083,.28),crownMat.clone());
   lantern.position.set(d.w*.15,d.h*.919,d.depth/2+.23);g.add(lantern);
   g.userData.lantern=lantern;
   for(const x of [-d.w*.47,d.w*.47])addLine(g,x,d.h*.23,x,d.h*.86,trimMat,.05,d.depth/2+.18);
  }
  if(d.id==='city-hall'){
   const clock=new THREE.Mesh(new THREE.CircleGeometry(1.7,24),clockMat);clock.position.set(0,d.h*.75,d.depth/2+.27);g.add(clock);
   const handMat=new THREE.MeshBasicMaterial({color:0x3f3d38});addLine(g,0,d.h*.75,.68,d.h*.75+.6,handMat,.064,d.depth/2+.33);addLine(g,0,d.h*.75,-.48,d.h*.75,handMat,.064,d.depth/2+.33);
   const statueHead=new THREE.Mesh(new THREE.SphereGeometry(.39,8,6),gold);statueHead.position.set(0,d.h+1.7,d.depth/2);g.add(statueHead);
   addLine(g,0,d.h,0,d.h+1.4,gold,.21,d.depth/2);
  }
  // Red aircraft warning beacons, away from the player and non-shadow-casting.
  beacon(g,0,d.h+(d.id==='comcast-technology'?6:d.id.includes('liberty')?4:1.7),d.depth/2+.32,i*1.37);
  if(d.id.includes('liberty')){
   const crown=new THREE.Group();g.add(crown);
   for(let level=0;level<3;level++){
    const y=d.h*(.80+level*.055),w=d.w*(.42-level*.13);
    addLine(crown,-w,y,0,y+3.5,trimMat,.10,d.depth/2+.25);
    addLine(crown,0,y+3.5,w,y,trimMat,.10,d.depth/2+.25);
   }
  }
  // Rubble is a sibling of the tower, not its child. Collapse animation scales
  // and moves the tower group; debris must remain fixed at street elevation.
  const ruin=new THREE.Group();
  ruin.name='landmark-collapse-rubble-'+d.id;
  ruin.position.set(g.position.x,0,g.position.z);
  ruin.visible=false;
  group.add(ruin);
  const stoneRubble=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.7,0),side,32),o=new THREE.Object3D();
  for(let j=0;j<32;j++){const r=seeded(480+i*31+j)();o.position.set((r-.5)*d.w*1.6,.35+(j%4)*.4,(j%5-2)*1.3);o.scale.set(.5+(j%6)*.1,.23,.35);o.rotation.set(0,j*.37,0);o.updateMatrix();stoneRubble.setMatrixAt(j,o.matrix);}stoneRubble.instanceMatrix.needsUpdate=true;ruin.add(stoneRubble);
  // Three larger fallen facade sections suggest recognizable structural
  // fragments without simulating individual glass panes or allocating debris
  // on every impact. Their transforms are derived from collapse severity.
  const slabs=[];
  for(let j=0;j<3;j++){
   const slab=new THREE.Mesh(collapsedSlabGeo,[side,facade]);
   slab.name='fallen-facade-'+d.id+'-'+j;
   slab.scale.set(d.w*(.23+j*.045),d.h*(.09+j*.015),.24+j*.08);
   slab.position.set((j-1)*d.w*.28,.3+j*.18,((j%2)*2-1)*d.depth*.18);
   slab.rotation.set(.11*j,.17*j,.09*(j-1));
   // Each slab has a fixed fall start height and a staggered release time.
   // Reuse these meshes throughout the collapse and reset their poses on restart.
   slab.userData.fallStartY=d.h*(.39+j*.15);
   slab.userData.fallDelay=j*.21;
   slab.userData.groundY=slab.scale.y*.5+.02;
   // The rubble group is hidden until collapse; position slabs at the actual
   // fracture release height before their first visible frame. Otherwise they
   // teleport from the ground to the sky when update() runs.
   slab.position.y=slab.userData.fallStartY;
   ruin.add(slab);slabs.push(slab);
  }
  const impactSprite=new THREE.Sprite(impactMaterial.clone());
  impactSprite.name='landmark-meteor-impact-'+d.id;
  impactSprite.visible=false;
  impactSprite.position.set(g.position.x,d.h*.68,g.position.z+d.depth/2+.5);
  impactSprite.scale.set(7,7,1);
  // The meteor flash is a short-lived world-space explosion, not an element
  // of the facade that should shrink or tilt during structural collapse.
  group.add(impactSprite);
  const scorchSprite=new THREE.Sprite(scorchMaterial.clone());
  scorchSprite.name='landmark-facade-scorch-'+d.id;
  scorchSprite.visible=false;
  scorchSprite.position.set(0,d.h*.68,d.depth/2+.60);
  scorchSprite.scale.set(5,5,1);
  g.add(scorchSprite);
  const smokeOrigin=new THREE.Vector3(g.position.x,d.h*.73,g.position.z+d.depth/2+.65);
  const burnSites=Array.from({length:SECONDARY_BURN_SITES_PER_TOWER},(_,j)=>({index:i*SECONDARY_BURN_SITES_PER_TOWER+j,
   active:false,origin:new THREE.Vector3(),width:0,height:0,renderWidth:0,
   renderHeight:0,ignitedAt:0,seed:i*1.71+j*2.43}));
  towers.push({def:d,group:g,facade,side,ruin,slabs,fallActive:false,fallSettled:false,fallElapsed:0,
   impactSprite,impactLocal:new THREE.Vector3(),smokeOrigin,scorchSprite,
   burnSites,siteCursor:0,
   impactAge:0,impactEnergy:0,strikeDamage:0,damage:0,collapse:0});
 });
 // Three low-poly helicopters travel only within the distant skyline plane.
 // They are purely atmospheric, cannot block or collide with gameplay projectiles.
 const heliBodyGeo=new THREE.CapsuleGeometry(.34,.90,3,5);
 const heliTailGeo=new THREE.BoxGeometry(1.36,.07,.07);
 const heliRotorGeo=new THREE.BoxGeometry(2.6,.045,.14);
 const heliDark=new THREE.MeshBasicMaterial({color:0x314452});
 const heliNav=new THREE.MeshBasicMaterial({color:0x9dd8ec});
 for(let i=0;i<3;i++){
  const h=new THREE.Group();h.name='distant-helicopter-'+i;
  const body=new THREE.Mesh(heliBodyGeo,heliDark);body.rotation.z=Math.PI/2;h.add(body);
  const tail=new THREE.Mesh(heliTailGeo,heliDark);tail.position.x=-1.05;h.add(tail);
  const mast=new THREE.Mesh(new THREE.BoxGeometry(.07,.25,.08),heliDark);mast.position.y=.48;h.add(mast);
  const rotor=new THREE.Mesh(heliRotorGeo,heliNav);rotor.position.y=.65;h.add(rotor);
  const nav=new THREE.Mesh(new THREE.SphereGeometry(.13,6,4),new THREE.MeshBasicMaterial({color:i===1?0xff4942:0xa8e2fc,transparent:true,opacity:.86}));nav.position.set(.54,.04,.18);h.add(nav);
  h.position.set(-82+i*55,45+(i%2)*18,-1.8-i*2);group.add(h);
  distantHelis.push({group:h,rotor,nav,seed:i*13.1,x0:-82+i*55,y0:45+(i%2)*18,speed:i===1?-1:1});
 }
 let time=-1,lastPhase=-1,damage=0;
 let renderClock=0,lastCombustionRefresh=-Infinity;
 // Fixed nine-sites-per-tower pool: update growing window fires only at ~6Hz,
 // preventing hit-time meshes/textures and unnecessary per-frame buffer uploads.
 // Retain stable, vertically separated facade contact points between strikes.
 // Coordinates are skyline-local and do not inherit any tower damage transform.
 function placeBurnSite(tower,site,offsetX,offsetY,width){
  const d=tower.def;
  // Snap to the same UV window grid used by makeFacade; stay below setbacks.
  const cols=d.style==='civic'?7:11,rows=d.style==='civic'?30:56;
  const col=Math.max(1,Math.min(cols-2,Math.round((offsetX/d.w+.5)*cols-.5)));
  const row=Math.max(3,Math.min(Math.floor(rows*.60),Math.round((tower.impactLocal.y+offsetY)/d.h*rows)));
  const w=Math.min(1.92,d.w/cols*1.07),h=d.h/rows*.88;
  site.origin.set(tower.group.position.x+((col+.5)/cols-.5)*d.w,
   (row+.08)/rows*d.h,tower.group.position.z+d.depth/2+.025);
  site.width=w;site.height=h;site.active=true;
  // Accurate broken-pane center, but the simulated blaze reaches adjacent
  // glazing bays instead of looking like four isolated miniature candles.
  site.renderWidth=w*(2.1+.25*Math.abs(Math.sin(site.seed*.47)));
  site.renderHeight=h*(3.05+.36*Math.abs(Math.sin(site.seed*.81)));
  site.ignitedAt=renderClock;
  combustion.set(site.index,site.origin.x,site.origin.y,site.origin.z,
   site.renderWidth*.66,site.renderHeight*.67,site.seed,.30,1);

 }
 function strikeNearest(localX,intensity=0){
  intensity=Math.max(0,Math.min(1,intensity));
  // The skyline's towers share this group's local coordinates. Snap a distant
  // streak to the nearest tower facade rather than exploding in empty sky.
  let selected=towers[0],distance=Infinity;
  for(const tower of towers){
   const delta=Math.abs(tower.group.position.x-localX);
   if(delta<distance){selected=tower;distance=delta;}
  }
  if(!selected)return null;
  const tower=selected,impact=tower.impactSprite;
  const heightFraction=.46+((Math.floor(Math.abs(localX)*7)%5)*.09);
  tower.impactLocal.set(Math.max(-tower.def.w*.35,Math.min(tower.def.w*.35,localX-tower.group.position.x)),
   tower.def.h*heightFraction,tower.def.depth/2+.55);
  // Resolve the contact before the new strike can shrink/tilt the facade.
  // The explosion sprite stays in skyline space at this exact contact point.
  const impactWorld=tower.group.localToWorld(tower.impactLocal.clone());
  impact.position.copy(group.worldToLocal(impactWorld.clone()));
  // Resolve the strike into stable skyline-local coordinates once. Persistent
  // smoke must not move or scale with later structural collapse.
  tower.smokeOrigin.set(tower.impactLocal.x,Math.min(tower.def.h*.91,tower.impactLocal.y+3),tower.def.depth/2+.65);
  tower.group.localToWorld(tower.smokeOrigin);
  group.worldToLocal(tower.smokeOrigin);

  tower.scorchSprite.position.set(tower.impactLocal.x,tower.impactLocal.y,tower.def.depth/2+.62);
  // A new meteor burst must begin at its initial radius, even if the
  // previous burst was partway through fading or had fully expanded.
  impact.scale.setScalar(5);
  tower.impactAge=1.15;
  tower.impactEnergy=1;
  // This is deliberately a small distant damage contribution: foreground
  // school and neighborhood health continue to use their existing simulation.
  // Repeated strikes scar and burn towers without deforming or collapsing them.
  tower.strikeDamage=Math.min(.90,tower.strikeDamage+.07+intensity*.04);
  // Repeated strikes refresh one window, preserving the others' continuity.
  // A contiguous multi-floor fire rather than four isolated stationary
  // torches. Each cell maps to a different real window-grid contact. No
  // hit-time objects: all nine sites exist in the fixed instance buffer.
  const ignite=(j)=>{
   const row=Math.floor(j/3),col=j%3;
   const offsetX=(col-1)*tower.def.w*.175+(row%2?.047:-.047)*tower.def.w;
   const offsetY=(row-1)*tower.def.h*.037+(col===1?.004:0)*tower.def.h;
   const site=tower.burnSites[j];
   placeBurnSite(tower,site,offsetX,offsetY,2.55+col*.14);
   // Seeded sequential ignition unfolds across a few seconds. Instant hit
   // still lights the central cell; no synchronized ignition of nine flames.
   const delay=j===4?0:(Math.floor(j/3)*.47+Math.abs(j%3-1)*.23+.20);
   site.ignitedAt=renderClock+delay;
   if(delay>0)combustion.set(site.index,site.origin.x,site.origin.y,site.origin.z,
     site.renderWidth*.66,site.renderHeight*.67,site.seed,0,1);
  };
  if(!tower.burnSites[0].active){
   for(let j=0;j<SECONDARY_BURN_SITES_PER_TOWER;j++)ignite(j);
  }else{
   const j=tower.siteCursor;
   ignite(j);
   tower.siteCursor=(j+1)%SECONDARY_BURN_SITES_PER_TOWER;
  }
  setDamage(damage); // Atmospheric damage only: landmark geometry remains intact.
  tower.scorchSprite.visible=true;
  const scorchSize=4+Math.min(1,tower.strikeDamage/.18)*4;
  tower.scorchSprite.scale.set(scorchSize,scorchSize,1);
  tower.scorchSprite.material.opacity=Math.min(.87,.40+tower.strikeDamage*2.3);
  impact.visible=true;
  impact.material.opacity=.93;
  return impactWorld;
 }
 function setTime(phase,darkness){
  const desired=Math.max(0,Math.min(1,darkness));
  if(Math.abs(desired-time)<.01&&Math.abs(phase-lastPhase)<.01)return;
  time=desired;lastPhase=phase;
  const twilight=Math.min(1,Math.exp(-Math.pow((phase-.33)*9,2))+Math.exp(-Math.pow((phase-.84)*11,2)));
  for(const t of towers){
   t.facade.emissiveIntensity=desired*1.25*(1-t.collapse*.84);
   t.facade.color.setRGB(1-desired*.60,
    Math.min(1,1-desired*.56-twilight*.035),Math.min(1,1-desired*.47-twilight*.10));
   const civic=t.def.style==='civic';
   t.side.color.setRGB(Math.min(1,(civic?.63:.36)*(1-desired*.38)+twilight*.12),
    (civic?.58:.49)*(1-desired*.35),Math.max(0,(civic?.51:.56)*(1-desired*.31)-twilight*.065));
  }
  farMat.opacity=.86-desired*.24;farMat.emissiveIntensity=desired*.65;farSide.opacity=.88-desired*.27;
  farMat.color.setRGB(.91+twilight*.09,.95-twilight*.035,1-twilight*.12);
 }
 function setDamage(value){
  // Artistic rule: Philadelphia's distant skyscrapers never collapse.
  // Neighborhood health still changes explosion frequency, flames and smoke,
  // but landmark height, transform and silhouette are always preserved.
  damage=Math.max(damage,Math.max(0,Math.min(1,value)));
  for(const t of towers){
   t.collapse=0;
   t.group.scale.y=1;
   t.group.rotation.z=0;
   t.group.position.y=0;
   t.ruin.visible=false;
   t.fallActive=false;
  }
 }
 function update(elapsed,darkness=0,dt=1/60){
  renderClock=elapsed;
  if(elapsed<lastCombustionRefresh||elapsed-lastCombustionRefresh>=.16){
   lastCombustionRefresh=elapsed;
   for(const tower of towers)for(const site of tower.burnSites){
    if(!site.active)continue;
    const signedAge=elapsed-site.ignitedAt;
    const age=Math.max(0,signedAge);
    const spread=Math.min(1,age/(1.8+.65*Math.abs(Math.sin(site.seed))));
    const pulse=.85+.13*Math.sin(elapsed*1.73+site.seed*2.4)+
     .07*Math.sin(elapsed*3.97+site.seed*.84);
    combustion.set(site.index,site.origin.x,site.origin.y,site.origin.z,
     site.renderWidth*(.66+.34*spread),
     site.renderHeight*(.67+.33*spread),site.seed,
     (signedAge<0?0:(.12+.78*spread)*pulse),1);
   }
  }
  for(let i=0;i<beacons.length;i++){
   const b=beacons[i];b.material.opacity=(.13+.83*Math.pow(Math.max(0,Math.sin(elapsed*3.8+b.userData.phase)),9))*(.55+.45*darkness);
  }
  for(const h of distantHelis){
   const p=(h.seed+elapsed*(1.3+h.seed*.018)*h.speed);
   // JS remainder keeps the dividend's sign: a left-moving helicopter
   // otherwise escapes the 170-unit patrol after several minutes of play.
   const orbit=(p+420)%170;
   h.group.position.x=h.x0+(orbit<0?orbit+170:orbit)-82;
   h.group.position.y=h.y0+Math.sin(elapsed*.48+h.seed)*2.1;
   h.rotor.rotation.y=elapsed*17;
   h.group.scale.x=h.speed;
   h.nav.material.opacity=.28+.67*(.5+.5*Math.sin(elapsed*4.1+h.seed));
  }
  combustion.update(elapsed);
  for(let i=0;i<towers.length;i++){
   const t=towers[i];
   if(t.group.userData.lantern)t.group.userData.lantern.material.opacity=.08+darkness*.82;
   if(t.fallActive&&!t.fallSettled){
    t.fallElapsed+=Math.max(0,Math.min(.1,dt));
    // Once every facade slab has landed and finished rotating, its pose is
    // static until reset. Avoid repeated matrix updates for settled rubble.
    let allGrounded=true;
    for(let j=0;j<t.slabs.length;j++){
     const slab=t.slabs[j],fallTime=Math.max(0,t.fallElapsed-slab.userData.fallDelay);
     // Gravity-like descent with a hard ground clamp keeps all facade sections
     // supported, even if simulation frames arrive irregularly.
     const turn=Math.min(1,fallTime/1.8);
     slab.rotation.z=(j-1)*.09+turn*(j%2?-.36:.28);
     slab.rotation.x=.11*j+turn*(Math.PI/2-.11*j);
     slab.updateMatrix();
     // Box support height includes the rotated panel, not only its thickness.
     // Matrix columns already include scale, so this keeps every corner above ground.
     const e=slab.matrix.elements;
     slab.userData.groundY=(Math.abs(e[1])+Math.abs(e[5])+Math.abs(e[9]))*.5+.02;
     slab.position.y=Math.max(slab.userData.groundY,slab.userData.fallStartY-14*fallTime*fallTime);
     if(turn<1||slab.position.y>slab.userData.groundY+.001)allGrounded=false;
    }
    if(allGrounded)t.fallSettled=true;
   }
   if(t.impactAge>0){
    t.impactAge=Math.max(0,t.impactAge-Math.max(0,Math.min(.1,dt)));
    const fade=t.impactAge/1.15;
    t.impactSprite.material.opacity=.93*fade*fade;
    t.impactSprite.scale.setScalar(5+(1-fade)*7);
    t.impactSprite.visible=t.impactAge>0;
   }
   // Sustained, irregular electrical flicker signals damage across the distant
   // city without dynamic lights, added meshes, or per-frame allocations.
   const broken=Math.min(1,t.strikeDamage*2.5);
   // Intact towers cannot flicker: skip the expensive sine/power pulse
   // until collapse begins. Damaged towers retain the exact prior formula.
   let unstable=1;
   if(broken>0){
    const pulse=Math.pow(Math.max(0,Math.sin(elapsed*(7.3+i*.31)+i*2.17)),12);
    unstable=1-broken*(.50+.46*pulse);
   }
   t.facade.emissiveIntensity=Math.max(0,time)*1.25*(1-t.strikeDamage*.30)*unstable;
  }
 }

 function reset(){
  combustion.reset();damage=0;time=-1;lastPhase=-1;
  renderClock=0;lastCombustionRefresh=-Infinity;
  for(const t of towers){
   t.strikeDamage=0;t.impactAge=0;t.impactEnergy=0;t.impactSprite.visible=false;
   t.scorchSprite.visible=false;t.scorchSprite.material.opacity=0;t.siteCursor=0;
   for(const site of t.burnSites){site.active=false;site.width=0;
    site.height=0;site.renderWidth=0;site.renderHeight=0;site.ignitedAt=0;}
  }
  setTime(0,0);
 }
 function fireState(t){
  const sites=t.burnSites.filter(s=>s.active),s=sites[0];
  return {active:sites.length>0,position:s?s.origin.clone():t.smokeOrigin.clone(),
   parentStable:combustion.group.parent===group,width:s?.width??0,height:s?.height??0,clock:combustion.stats().clock};
 }
 return {group,towers,setTime,setDamage,strikeNearest,reset,update,fireState,getStats:()=>({
  landmarks:towers.length,heroLandmarks:['city-hall','comcast-technology','comcast-center','one-liberty-place','two-liberty-place'],
  distantHelicopters:distantHelis.length,beacons:beacons.length,combustion:combustion.stats(),
  activeBurnSites:combustion.stats().active,geometryMeshes:group.children.length+2*towers.length,photographicCutouts:0})};
}
