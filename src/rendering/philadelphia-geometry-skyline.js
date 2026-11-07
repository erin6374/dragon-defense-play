// Dragon Defense 4.7 — original, geometry-based Philadelphia skyline.
// Reference-guided silhouettes. No photographic cutouts, no floating window cards.
// One mesh per architectural face plus shared low-detail roof ornament; diffuse and
// emissive maps are baked once so lighting changes don't allocate geometry/textures.
import * as THREE from 'three';

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
export function createPhiladelphiaSkyline(parent,{detail='standard'}={}){
 const group=new THREE.Group();group.name='PHILADELPHIA-ORIGINAL-3D-SKYLINE';parent.add(group);
 const towers=[],beacons=[],distantHelis=[],clockMat=new THREE.MeshBasicMaterial({color:0xd8c6a3});
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
 // Warning beacons are tiny emissive meshes (no expensive shadow-casting lights).
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
  const ruin=new THREE.Group();ruin.name='landmark-collapse-rubble';ruin.visible=false;g.add(ruin);
  const stoneRubble=new THREE.InstancedMesh(new THREE.IcosahedronGeometry(.7,0),side,32),o=new THREE.Object3D();
  for(let j=0;j<32;j++){const r=seeded(480+i*31+j)();o.position.set((r-.5)*d.w*1.6,.35+(j%4)*.4,(j%5-2)*1.3);o.scale.set(.5+(j%6)*.1,.23,.35);o.rotation.set(0,j*.37,0);o.updateMatrix();stoneRubble.setMatrixAt(j,o.matrix);}stoneRubble.instanceMatrix.needsUpdate=true;ruin.add(stoneRubble);
  towers.push({def:d,group:g,facade,side,ruin,damage:0,collapse:0});
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
  damage=Math.max(damage,Math.max(0,Math.min(1,value)));
  towers.forEach((t,i)=>{
   const threshold=.24+i*.077;
   const collapse=Math.max(0,Math.min(1,(damage-threshold)/.23));
   if(Math.abs(t.collapse-collapse)<.02)return;
   t.collapse=collapse;
   // Variable shear/pancake collapse, with persistent rubble, without per-frame geometry allocation.
   if(i%3===0){t.group.rotation.z=collapse*.10*(i%2?1:-1);t.group.position.y=-collapse*t.def.h*.26;}
   else {t.group.scale.y=1-collapse*.86;t.group.position.y=-collapse*t.def.h*.08;}
   t.ruin.visible=collapse>.18;
   // Emission is derived in update() rather than repeatedly multiplied here.
   // Damage updates must not accumulate artificial darkening each time.
  });
 }
 function update(elapsed,darkness=0){
  for(let i=0;i<beacons.length;i++){
   const b=beacons[i];b.material.opacity=(.13+.83*Math.pow(Math.max(0,Math.sin(elapsed*3.8+b.userData.phase)),9))*(.55+.45*darkness);
  }
  for(const h of distantHelis){
   const p=(h.seed+elapsed*(1.3+h.seed*.018)*h.speed);
   h.group.position.x=h.x0+((p+420)%170)-82;
   h.group.position.y=h.y0+Math.sin(elapsed*.48+h.seed)*2.1;
   h.rotor.rotation.y=elapsed*17;
   h.group.scale.x=h.speed;
   h.nav.material.opacity=.28+.67*(.5+.5*Math.sin(elapsed*4.1+h.seed));
  }
  for(let i=0;i<towers.length;i++){
   const t=towers[i];
   if(t.group.userData.lantern)t.group.userData.lantern.material.opacity=.08+darkness*.82;
   // Sustained, irregular electrical flicker signals damage across the distant
   // city without dynamic lights, added meshes, or per-frame allocations.
   const broken=Math.min(1,t.collapse*2.5);
   const pulse=Math.pow(Math.max(0,Math.sin(elapsed*(7.3+i*.31)+i*2.17)),12);
   const unstable=1-broken*(.50+.46*pulse);
   t.facade.emissiveIntensity=Math.max(0,time)*1.25*(1-t.collapse*.55)*unstable;
  }
 }
 function reset(){damage=0;time=-1;lastPhase=-1;for(const t of towers){t.group.rotation.z=0;t.group.scale.y=1;t.group.position.y=0;t.ruin.visible=false;t.collapse=0;}setTime(0,0);}
 return {group,towers,setTime,setDamage,reset,update,getStats:()=>({landmarks:towers.length,heroLandmarks:['city-hall','comcast-technology','comcast-center','one-liberty-place','two-liberty-place'],distantHelicopters:distantHelis.length,beacons:beacons.length,geometryMeshes:group.children.length+2*towers.length,photographicCutouts:0})};
}
