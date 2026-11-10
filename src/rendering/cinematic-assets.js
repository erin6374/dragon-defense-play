import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
// Dragon Defense 4.4 — coherent visual asset library, browser-native WebGL/PBR.

// Shared, animated, deterministic fluid-fire atlases. Fire moves through its
// *texture* instead of stretching fixed triangular polygons. All game systems
// (dragon, vehicles, school, rowhouses and landmark towers) reuse these maps.
// Fixed 128x192/96x128 RGBA buffers upload at 12/7 Hz, independent of fires.
function createFluidCombustionAtlases(THREE){
 const FW=128,FH=192,SW=96,SH=128;
 const fireCanvas=document.createElement('canvas');fireCanvas.width=FW;fireCanvas.height=FH;
 const smokeCanvas=document.createElement('canvas');smokeCanvas.width=SW;smokeCanvas.height=SH;
 const fc=fireCanvas.getContext('2d',{willReadFrequently:false}),sc=smokeCanvas.getContext('2d',{willReadFrequently:false});
 const fi=fc.createImageData(FW,FH),si=sc.createImageData(SW,SH);
 const flame=new THREE.CanvasTexture(fireCanvas),smoke=new THREE.CanvasTexture(smokeCanvas);
 for(const tex of [flame,smoke]){
  tex.colorSpace=THREE.SRGBColorSpace;
  tex.wrapS=tex.wrapT=THREE.ClampToEdgeWrapping;
  tex.minFilter=THREE.LinearFilter;tex.magFilter=THREE.LinearFilter;
  tex.generateMipmaps=false;
 }
 const values=new Float32Array(4096);let seed=0x1f20a911;
 for(let i=0;i<values.length;i++){
  seed=(Math.imul(seed,1664525)+1013904223)>>>0;
  values[i]=(seed>>>8)/16777216;
 }
 const clamp=x=>Math.max(0,Math.min(1,x));
 function noise(x,y){
  const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
  const tx=fx*fx*(3-2*fx),ty=fy*fy*(3-2*fy);
  const a=((iy&63)<<6)|(ix&63),b=((iy&63)<<6)|((ix+1)&63);
  const c=(((iy+1)&63)<<6)|(ix&63),d=(((iy+1)&63)<<6)|((ix+1)&63);
  return (values[a]+(values[b]-values[a])*tx)*(1-ty)+
         (values[c]+(values[d]-values[c])*tx)*ty;
 }
 function drawFlame(t){
  const p=fi.data,flow=t*1.6;
  for(let y=0;y<FH;y++){
   const h=1-(y+.5)/FH,baseFall=Math.pow(Math.max(.0001,1-h),.42);
   for(let x=0;x<FW;x++){
    const u=(x+.5)/FW-.5,i=(y*FW+x)*4;
    // Advected noise domains cause twisting, detaching tongues; the edge is
    // turbulent rather than cut out as clean geometric spikes.
    const coarse=noise(u*7.7+3.1,h*6.4-flow);
    const mids=noise(u*22+coarse*2.4,h*19-flow*2.1);
    const detail=noise(u*48+mids*3.2,h*42-flow*3.9);
    const lean=.060*Math.sin(h*7.2-t*.9)+.12*(coarse-.5)+.065*(mids-.5)*h;
    const breadth=(.45*Math.pow(Math.max(0,1-h),.86)+.012)*(.86+.31*coarse);
    const r=Math.abs(u-lean)/breadth;
    const fracture=(mids-.5)*.65+(detail-.5)*.26;
    const ragged=clamp((1.13-r+fracture)*2.45);
    const breakUp=clamp(.50+.78*coarse+.50*mids+.33*detail);
    const alpha=clamp(ragged*breakUp*baseFall*1.40);
    // Blackbody-inspired gradient: opaque bright white-yellow hot core,
    // amber transition and thin dark-red fringes toward flame tips.
    const temp=clamp((1-h*.80)*(1-r*.36)*(.75+.38*mids)*1.35);
    const white=clamp((temp-.79)*4.7);
    p[i]=Math.round(214+41*clamp(temp*1.2));
    p[i+1]=Math.round(47+189*temp+19*white);
    p[i+2]=Math.round(12+34*temp+178*white);
    p[i+3]=Math.round(255*alpha);
   }
  }
  fc.putImageData(fi,0,0);flame.needsUpdate=true;
 }
 function drawSmoke(t){
  const p=si.data,flow=t*.50;
  for(let y=0;y<SH;y++){
   const h=1-(y+.5)/SH;
   for(let x=0;x<SW;x++){
    const u=(x+.5)/SW-.5,i=(y*SW+x)*4;
    const low=noise(u*5.6+2.3,h*7.2-flow),mid=noise(u*16+low*2.7,h*16-flow*1.9);
    const high=noise(u*35+mid*2,h*31-flow*3.1);
    const center=Math.sin(t*.28+h*5.2)*.065+(low-.5)*.16;
    const spread=.20+.23*h+.11*low;
    const rad=Math.abs(u-center)/spread;
    const wisps=clamp((1.14-rad+(mid-.5)*.68+(high-.5)*.24)*1.95);
    const density=clamp((.14+.54*low+.32*mid)*wisps);
    // White atlas, colored by existing grayscale/soot sprite materials.
    const v=Math.round(177+55*high);
    p[i]=v;p[i+1]=v;p[i+2]=v;p[i+3]=Math.round(255*density*.72);
   }
  }
  sc.putImageData(si,0,0);smoke.needsUpdate=true;
 }
 let fireFrame=0,smokeFrame=0,lastFire=-Infinity,lastSmoke=-Infinity;
 function update(time){
  const t=Math.max(0,Number(time)||0);
  if(t<lastFire||t-lastFire>=1/12){drawFlame(t);lastFire=t;fireFrame++;}
  if(t<lastSmoke||t-lastSmoke>=1/7){drawSmoke(t);lastSmoke=t;smokeFrame++;}
 }
 update(0);
 return {flame,smoke,update,stats:()=>({fireFrame,smokeFrame,fireSize:[FW,FH],
  smokeSize:[SW,SH],flameUploadHz:12,smokeUploadHz:7,textures:2}),
  // Read-back is only for QA; no pixel transfer from GPU is required.
  checksum:()=>{let sum=0;for(let i=0;i<fi.data.length;i+=31)sum=(sum+fi.data[i]*17+fi.data[i+3])>>>0;return sum;}};
}
// Original generated artwork, no third-party imagery, compatible with Unity texture export.
export function createVisualMaterials(THREE){
 const loader=new THREE.TextureLoader();
 const cache=new Map();
 function tex(path,repeat=[1,1],srgb=false){
  const key=path+repeat.join(',');if(cache.has(key))return cache.get(key);
  const t=loader.load('./assets/visuals/'+path,()=>{t.needsUpdate=true;},undefined,e=>console.warn('Missing visual map',path,e));
  t.wrapS=t.wrapT=THREE.RepeatWrapping;t.repeat.set(repeat[0],repeat[1]);
  t.colorSpace=srgb?THREE.SRGBColorSpace:THREE.NoColorSpace;t.anisotropy=4;
  cache.set(key,t);return t;
 }
 function pbr(name,repeat=[2,2],options={}){
  const material=new THREE.MeshStandardMaterial({
   map:tex(name+'-albedo.jpg',repeat,true),
   normalMap:tex(name+'-normal.png',repeat),normalScale:new THREE.Vector2(.45,.45),
   roughnessMap:tex(name+'-rough.png',repeat),roughness:.96,metalness:options.metalness??0,
   color:options.tint??0xffffff,side:THREE.FrontSide,
  });
  material.userData.pbrType=name;return material;
 }
 const bank={
  brick:pbr('brick',[2.5,2.5]),limestone:pbr('limestone',[1.6,1.6]),
  concrete:pbr('concrete',[1.8,1.8]),roof:pbr('roof',[3,3]),
  metal:pbr('metal',[2,2],{metalness:.55}),
  asphalt:pbr('asphalt',[9,3]),asphaltCross:pbr('asphalt',[3,3]),
  meteor:pbr('meteor',[1.5,1.5]),
  sidewalk:pbr('limestone',[10,3],{tint:0xd4d1ca}),
  window:new THREE.MeshPhysicalMaterial({color:0x66899a,roughness:.10,metalness:.12,transparent:true,opacity:.78,depthWrite:false,side:THREE.DoubleSide}),
  blackMetal:new THREE.MeshStandardMaterial({color:0x29323b,roughness:.4,metalness:.70}),
  copper:new THREE.MeshStandardMaterial({color:0x88725b,roughness:.41,metalness:.57}),
  luminous:new THREE.MeshBasicMaterial({color:0xf0deb1}),
  roadStripe:new THREE.MeshBasicMaterial({color:0xe6e2d1,transparent:true,opacity:.86,depthWrite:false}),
  yellowStripe:new THREE.MeshBasicMaterial({color:0xd5aa51,transparent:true,opacity:.9,depthWrite:false})
 };
 const fluidFire=createFluidCombustionAtlases(THREE);
 bank.images={flame:fluidFire.flame,smoke:fluidFire.smoke,dust:tex('dust.png',[1,1],true),flash:tex('flash.png',[1,1],true),cracks:tex('cracks.png',[1,1],true)};
 bank.advanceFireVisuals=fluidFire.update;
 bank.fireVisualStats=fluidFire.stats;
 bank.fireVisualChecksum=fluidFire.checksum;
 const wallVariants=new Map();
 bank.getBuilding=(kind,hex=null)=>{
  const base=kind==='brick'?bank.brick:(kind==='modern'||kind==='concrete')?bank.concrete:bank.limestone;
  if(hex===null)return base;
  const key=kind+':'+hex;if(wallVariants.has(key))return wallVariants.get(key);
  const mat=base.clone();
  // Preserve the brick/limestone texture while varying its apparent masonry hue.
  const target=new THREE.Color(hex),hsl={h:0,s:0,l:0};target.getHSL(hsl);
  const mix=kind==='brick'?.24:.36;
  mat.color.setHSL(hsl.h,Math.max(.08,hsl.s*.55),.88+mix*(hsl.l-.5));
  mat.userData.pbrType=base.userData.pbrType;
  wallVariants.set(key,mat);return mat;
 };
 return bank;
}

const boxMaterial=(THREE,c,rough=.65,metal=.1)=>new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal});
// Enhance the original procedural creature rather than substitute an incompatible imported rig.
export function enhanceDragon(THREE,dragon,wings){
 const scaleGeo=new THREE.ConeGeometry(.13,.27,5);
 const scaleMat=boxMaterial(THREE,0x8557b4,.40,.17);
 const inst=new THREE.InstancedMesh(scaleGeo,scaleMat,120);
 const o=new THREE.Object3D();let n=0;
 for(let row=0;row<6;row++)for(let col=0;col<14;col++){
  const theta=(col/14)*Math.PI*2;
  const px=-1.15+row*.36;
  const taper=1-.18*Math.abs(px+.2);
  o.position.set(px,Math.sin(theta)*(.74*taper),Math.cos(theta)*(.72*taper));
  o.rotation.set(Math.sin(theta)*.4,0,-Math.PI/2+Math.cos(theta)*.12);
  o.scale.set(.65,.7,.65);o.updateMatrix();inst.setMatrixAt(n++,o.matrix);
 }
 inst.count=n;inst.instanceMatrix.needsUpdate=true;dragon.add(inst);
 const wingVeinMat=boxMaterial(THREE,0x4d2e6b,.64,.08);
 const finMat=new THREE.MeshStandardMaterial({color:0xbd7cce,transparent:true,opacity:.56,side:THREE.DoubleSide,roughness:.57});
 const curve=(parent,a,b,r,mat)=>{const vec=b.clone().sub(a),mesh=new THREE.Mesh(new THREE.CylinderGeometry(r*.70,r,vec.length(),6),mat);
  mesh.position.copy(a).addScaledVector(vec,.5);mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),vec.normalize());parent.add(mesh);return mesh;};
 for(const {pivot,sign} of wings){
  // Three layered wing struts make the membrane read as a real anatomical surface.
  const origin=new THREE.Vector3(.2,0,0);
  for(let j=0;j<3;j++){
   const target=new THREE.Vector3(-1.05-j*.36,.22-j*.18,sign*(2.1+j*.28));
   curve(pivot,origin,target,.052,wingVeinMat);
  }
  const fin=new THREE.Mesh(new THREE.ConeGeometry(.5,.9,5),finMat);fin.position.set(-1.43,-.28,sign*2.4);fin.rotation.z=.8;pivot.add(fin);
 }
 const lowerJawMat=boxMaterial(THREE,0xbda0cb,.73,.01);
 const eye=new THREE.Mesh(new THREE.SphereGeometry(.105,12,8),new THREE.MeshBasicMaterial({color:0xffda76}));
 for(const s of [-1,1]){
  const pupil=eye.clone();pupil.position.set(2.115,1.40,s*.592);pupil.scale.set(.48,.63,.34);dragon.add(pupil);
  const cheek=new THREE.Mesh(new THREE.SphereGeometry(1,10,8),lowerJawMat);cheek.position.set(1.65,.9,s*.33);cheek.scale.set(.33,.19,.18);dragon.add(cheek);
 }
 const nostrilMat=boxMaterial(THREE,0x2a2036,.94,.01);
 for(const s of [-1,1]){const nostril=new THREE.Mesh(new THREE.SphereGeometry(.055,7,6),nostrilMat);nostril.position.set(2.80,1.03,s*.25);dragon.add(nostril);}
 return {scaleCount:n};
}

const vehicleCache=new WeakMap();
function vehicleKit(THREE){
 if(vehicleCache.has(THREE))return vehicleCache.get(THREE);
 const kit={G:new THREE.BoxGeometry(1,1,1),trim:boxMaterial(THREE,0x1e252c,.45,.42),
  glass:new THREE.MeshPhysicalMaterial({color:0x4a778e,roughness:.13,metalness:.15,transparent:true,opacity:.8,depthWrite:false}),
  chrome:boxMaterial(THREE,0xa2a8ab,.32,.78),lamp:new THREE.MeshBasicMaterial({color:0xfff0c4}),
  brake:new THREE.MeshBasicMaterial({color:0xe34234}),blue:new THREE.MeshBasicMaterial({color:0x324d72}),
  red:new THREE.MeshBasicMaterial({color:0xc72c37}),yellow:new THREE.MeshBasicMaterial({color:0xe2b650}),
  tireGeo:new THREE.CylinderGeometry(.33,.33,.20,12),hubGeo:new THREE.CylinderGeometry(.13,.13,.06,10),
  heliBody:new THREE.SphereGeometry(1,16,10),heliGlass:new THREE.SphereGeometry(1,12,8),
  heliTail:new THREE.ConeGeometry(1,1.5,9),heliGun:new THREE.CylinderGeometry(.055,.055,2,6),
  heliChassis:boxMaterial(THREE,0x9a9fa8,.44,.56),
  windscreen:new THREE.MeshPhysicalMaterial({color:0x3b6682,roughness:.16,metalness:.18,transparent:true,opacity:.83})
 };vehicleCache.set(THREE,kit);return kit;
}
export function enhanceCar(THREE,root,{length,bus,truck,van,police,ambulance,emergency,dir}){
 const kit=vehicleKit(THREE);
 const {G,trim,glass,chrome,lamp,brake}=kit;
 if(!bus&&!truck&&!ambulance){
  // Beveled continuous car shell replaces the former two primitive boxes.
  // The body is cached across traffic spawns; temporary vehicles do not allocate geometry.
  const type=van?'van':'sedan',key=type+length;
  if(!kit.bodyGeos)kit.bodyGeos=new Map();
  let geometry=kit.bodyGeos.get(key);
  if(!geometry){
   const sh=new THREE.Shape();const L=length/2;
   sh.moveTo(-L,.45);sh.lineTo(L,.45);sh.lineTo(L,.89);
   sh.lineTo(L*.65,1.0);sh.lineTo(L*.30,van?1.87:1.42);
   sh.lineTo(-L*.44,van?1.87:1.42);sh.lineTo(-L*.68,1.0);sh.lineTo(-L,.84);sh.closePath();
   geometry=new THREE.ExtrudeGeometry(sh,{depth:1.55,bevelEnabled:true,bevelSegments:2,steps:1,bevelThickness:.075,bevelSize:.10,curveSegments:6});
   geometry.translate(0,0,-.775);kit.bodyGeos.set(key,geometry);
  }
  const originalBody=root.children[0];const originalCab=root.children[1];
  const paint=originalBody?.material?.color?.clone?.()||new THREE.Color(0x627b8b);
  if(!kit.paintMats)kit.paintMats=new Map();const paintKey=paint.getHex();
  if(!kit.paintMats.has(paintKey))kit.paintMats.set(paintKey,new THREE.MeshStandardMaterial({color:paint,metalness:.35,roughness:.35}));
  const body=new THREE.Mesh(geometry,kit.paintMats.get(paintKey));
  root.add(body);if(originalBody)originalBody.visible=false;if(originalCab)originalCab.visible=false;
 }
 function part(x,y,z,w,h,d,mat,geom=G){const m=new THREE.Mesh(geom,mat);m.position.set(x,y,z);m.scale.set(w,h,d);root.add(m);return m;}
 const tall=bus||ambulance||truck;
 // Slim bumpers, grille and side skirting.
 for(const sign of [-1,1]){
  part(sign*(length/2+.06),.51,0,.15,.20,1.74,chrome);
  part(0,.46,sign*.92,length*.76,.18,.055,trim);
  part(sign*(length/2+.10),.69,0,.045,.28,.76,sign>0?lamp:brake);
  part(length*.20,.82,sign*.92,length*.27,.11,.04,chrome);
 }
 const cabY=tall?1.45:1.24;
 const sideWidth=tall?length*.55:length*.43;
 for(const s of [-1,1]){
  part(.0,cabY,s*.788,sideWidth,.42,.035,glass);
  part(-sideWidth*.22,cabY,s*.82,.06,.45,.05,trim);
  part(sideWidth*.26,cabY,s*.82,.065,.45,.05,trim);
  part(0,cabY-.23,s*.85,sideWidth+.15,.045,.045,trim);
 }
 for(const x of [-length*.36,length*.36])for(const s of [-1,1]){
  const tire=new THREE.Mesh(kit.tireGeo,trim);
  tire.rotation.x=Math.PI/2;tire.position.set(x,.26,s*.95);root.add(tire);
  const hub=new THREE.Mesh(kit.hubGeo,chrome);hub.rotation.x=Math.PI/2;hub.position.set(x,.26,s*1.065);root.add(hub);
 }
 if(bus){const stripe=kit.yellow;for(const s of [-1,1])part(0,1.10,s*.96,length*.87,.15,.045,stripe);}
 if(police){const stripe=kit.blue;for(const s of [-1,1])part(-.2,.78,s*.97,length*.72,.22,.04,stripe);}
 if(ambulance){const red=kit.red;for(const s of [-1,1]){part(.18,1.12,s*1.03,.15,.66,.05,red);part(.18,1.12,s*1.08,.72,.15,.05,red);}}
 return root;
}

export function enhanceHelicopter(THREE,root){
 const kit=vehicleKit(THREE),gun=kit.trim,chassis=kit.heliChassis;
 const mesh=(geo,mat,x,y,z,sx,sy,sz)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.scale.set(sx,sy,sz);root.add(m);return m;};
 const body=mesh(kit.heliBody,chassis,.2,.1,0,1.2,.63,.60);
 const windscreen=kit.windscreen;
 mesh(kit.heliGlass,windscreen,1.08,.17,0,.75,.48,.51);
 mesh(kit.heliTail,chassis,-2.8,.18,0,.18,.50,.18).rotation.z=-Math.PI/2;
 for(const s of [-1,1]){
  mesh(kit.heliGun,gun,.15,-.55,s*.73,.15,1,.15).rotation.z=Math.PI/2;
  mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:s>0?0x48f19b:0xf94444}),0,.22,s*.88,1,1,1);
 }
 return body;
}

export function enhanceEnvironment(THREE,scene,root,neighborhood,bank){
 const box=new THREE.BoxGeometry(1,1,1),plane=new THREE.PlaneGeometry(1,1);
 const street=new THREE.Group();street.name='cinematic-street-dressing';root.add(street);
 const metal=bank.blackMetal,concrete=bank.limestone,copper=bank.copper;
 const lineWhite=bank.roadStripe,lineYellow=bank.yellowStripe;
 const addBox=(x,y,z,w,h,d,mat)=>{const m=new THREE.Mesh(box,mat);m.position.set(x,y,z);m.scale.set(w,h,d);street.add(m);return m;};
 const decal=(x,y,z,w,d,mat)=>{const m=new THREE.Mesh(plane,mat);m.rotation.x=-Math.PI/2;m.position.set(x,y,z);m.scale.set(w,d,1);street.add(m);return m;};
 // True four-lane layout: two lanes per direction, yellow center separation.
 for(let x=-88;x<=88;x+=6.6){
  if(Math.abs(Math.abs(x)-53)<9)continue;
  decal(x,-.284,18.55,3.8,.095,lineWhite);decal(x,-.283,28.5,3.8,.095,lineWhite);
 }
 for(const z of [23.35,24.35])decal(0,-.283,z,190,.11,lineYellow);
 // Curb caps: dashed curb at the sidewalk edge.
 for(const z of [12.5,35.7])addBox(0,-.18,z,171,.18,.16,concrete);
 // Storm drains, pavement repairs, tire tracks and manholes.
 const drain=bank.metal,paint=new THREE.MeshBasicMaterial({color:0x53575b,transparent:true,opacity:.63,depthWrite:false});
 for(const x of [-64,-43,-14,15,37,65]){
  decal(x,-.276,16.1,1.0,.46,drain);
  for(let i=0;i<4;i++)addBox(x-.31+i*.20,-.264,16.1,.085,.015,.31,metal);
 }
 const circle=new THREE.CircleGeometry(.61,24);
 for(const [x,z] of [[-39,22],[32,26],[5,19],[-12,29]]){
  const m=new THREE.Mesh(circle,metal);m.rotation.x=-Math.PI/2;m.position.set(x,-.27,z);street.add(m);
  const inner=new THREE.Mesh(new THREE.RingGeometry(.36,.52,24),concrete);inner.rotation.x=-Math.PI/2;inner.position.set(x,-.259,z);street.add(inner);
 }
 for(const [x,z] of [[-27,27],[-7,20],[43,30]])decal(x,-.280,z,7,1.8,paint);
 // Warm street lamps with height-appropriate arms, light bulbs, but only two dynamic lights.
 const lampMetal=bank.blackMetal;const led=new THREE.MeshBasicMaterial({color:0xffddb0,transparent:true,opacity:.94});
 for(const x of [-75,-45,-22,19,43,73]){
  addBox(x,3.50,10.5,.14,7.0,.14,lampMetal);addBox(x+1.0,6.97,10.5,2.0,.095,.095,lampMetal);
  addBox(x+1.9,6.86,10.5,.58,.09,.34,led);
 }
 // Bus stop shelters, railings, benches, utility boxes, street trees with organic canopies.
 const bench=boxMaterial(THREE,0x765f4c,.88,.02);
 for(const x of [-31,34]){
  addBox(x,.48,9.9,2.15,.18,.6,bench);
  for(const s of [-1,1])addBox(x+s*.87,.26,9.9,.12,.43,.12,metal);
  addBox(x,1.26,10.35,2.2,1.1,.045,bank.window);
  addBox(x,1.87,10.4,2.5,.09,1.2,metal);
 }
 const leafGeometry=new THREE.SphereGeometry(1,12,8),trunkMaterial=boxMaterial(THREE,0x65503b,.94,.01);
 const foliageMaterials=[0x354d33,0x496039,0x61764a].map(color=>boxMaterial(THREE,color,1,0));
 const leaves=foliageMaterials.map(m=>{const mesh=new THREE.InstancedMesh(leafGeometry,m,200);mesh.frustumCulled=false;scene.add(mesh);return mesh});const matrix=new THREE.Object3D(),windTrees=[];const leafIndex=[0,0,0];
 for(const x of [-47,-27,28,46]){
  const root=new THREE.Group();root.position.set(x,-.05,8.95);street.add(root);
  const instances=[],wood=[];
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.09,.19,3.5,14),trunkMaterial);trunk.position.y=1.75;wood.push(trunk);
  for(let branch=0;branch<7;branch++){const angle=branch*2.4,end=new THREE.Vector3(Math.cos(angle)*1.1,3.15+branch*.15,Math.sin(angle)*.9),start=new THREE.Vector3(0,2.25,0),v=end.clone().sub(start);
   const twig=new THREE.Mesh(new THREE.CylinderGeometry(.025,.065,v.length(),10),trunkMaterial);twig.position.copy(start.add(end).multiplyScalar(.5));twig.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v.normalize());wood.push(twig);
   for(let j=0;j<18;j++){const a=j*2.399+branch,r=.3+Math.sqrt(j/18)*.75;matrix.position.set(end.x+Math.cos(a)*r,end.y+Math.sin(j*1.7)*.55,end.z+Math.sin(a)*r);matrix.scale.set(.26+(j%3)*.06,.18+(j%4)*.045,.27);matrix.rotation.set(j,branch,0);matrix.updateMatrix();const kind=(j+branch)%3;instances.push({mesh:leaves[kind],index:leafIndex[kind]++,rest:matrix.matrix.clone()})}
  }
  const woodParts=wood.map(mesh=>{mesh.updateMatrix();return mesh.geometry.applyMatrix4(mesh.matrix);});
  root.add(new THREE.Mesh(mergeGeometries(woodParts),trunkMaterial));
  for(const part of woodParts)part.dispose();
  root.updateMatrix();
  for(const leaf of instances)leaf.mesh.setMatrixAt(leaf.index,new THREE.Matrix4().multiplyMatrices(root.matrix,leaf.rest));
  windTrees.push({root,instances});
 }
 for(let i=0;i<3;i++){leaves[i].count=leafIndex[i];leaves[i].instanceMatrix.needsUpdate=true}
 // Sidewall materials without modifying facade panel IDs or destruction dependencies.
 let updated=0;
 for(const building of neighborhood.targetBuildings){
  if(!building.shell||!building.shell.material||building.background)continue;
  const kind=building.name.includes('modern')?'concrete':building.name.includes('stone')||building.name.includes('cream')?'limestone':'brick';
  building.shell.material=bank.getBuilding(kind);
  if(building.cap)building.cap.material=bank.roof;
  updated++;
 }
 // Road and sidewalks use normal/roughness mapped textures rather than featureless Lambert slabs.
 root.traverse(o=>{
  if(!o.isMesh||!o.geometry?.isBoxGeometry)return;
  const y=o.position.y,s=o.scale;
  if(y<-.27&&y>-.72&&s.x>9&&s.y<.32&&s.z>3){
   if([0x34373b,0x414249,0x35383f].includes(o.material.color?.getHex())||o.material.userData?.pbrType==='asphalt')o.material=bank.asphalt;
   else if([0xa9a8a0,0xb0a99d,0xb8b1a6].includes(o.material.color?.getHex())||o.material.userData?.pbrType==='limestone')o.material=bank.sidewalk;
  }
 });
 return {street,updated,windTrees};
}

// Weather layer: particle strip in the camera-visible street, with low fixed draw cost.
export function createCinematicWeather(THREE,scene,{mobile=false}={}){
 const count=mobile?105:340;
 const positions=new Float32Array(count*3);
 const speed=new Float32Array(count);let seed=751;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<count;i++){
  positions[i*3]=-94+random()*188;positions[i*3+1]=4+random()*66;
  positions[i*3+2]=17+random()*33;speed[i]=22+random()*18;
 }
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
 const material=new THREE.PointsMaterial({color:0xaed5ef,size:mobile?.17:.20,transparent:true,opacity:.34,depthWrite:false,sizeAttenuation:true});
 const rain=new THREE.Points(geometry,material);rain.frustumCulled=false;rain.visible=false;scene.add(rain);
 let clock=0;
 return {rain,update(dt,wave,darkness){
  const storm=wave%10>=4&&wave%10<=7;
  rain.visible=storm;
  if(!storm)return;
  clock+=dt;
  material.opacity=.16+.14*darkness;
  for(let i=0;i<count;i++){
   const j=i*3;positions[j+1]-=speed[i]*dt;positions[j]+=dt*1.1;
   if(positions[j+1]<-.4){positions[j+1]=42+(i*37%25);positions[j]=-91+(i*61%184);}
  }
  geometry.attributes.position.needsUpdate=true;
 }};
}
