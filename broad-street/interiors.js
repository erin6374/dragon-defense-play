import {roofMaterial,setAerialNight} from './aerial.js';
import * as T from 'three';
const cube=new T.BoxGeometry(),glass=new T.MeshPhysicalMaterial({color:0xb8d4da,roughness:.09,metalness:0,transparent:true,opacity:.32,depthWrite:false,side:T.DoubleSide});
const plaster=new T.MeshStandardMaterial({color:0xcbbfa9,emissive:0xffbc73}),floor=new T.MeshStandardMaterial({color:0x9b8874}),trim=new T.MeshStandardMaterial({color:0x645e56});
const walls=[],skins=[];
let brickMap;
function masonry(){
 if(brickMap)return brickMap;
 const c=document.createElement('canvas');c.width=128;c.height=64;const g=c.getContext('2d');g.fillStyle='#b6afa6';g.fillRect(0,0,128,64);
 for(let j=0;j<8;j++)for(let i=-1;i<5;i++){const shade=215+(13*i+7*j+40)%24;g.fillStyle='rgb('+[shade,shade,shade].join(',')+')';g.fillRect(i*32+(j%2)*16,j*8,31,7)}
 brickMap=new T.CanvasTexture(c);brickMap.wrapS=brickMap.wrapT=T.RepeatWrapping;brickMap.repeat.set(.9,1.8);brickMap.colorSpace=T.SRGBColorSpace;return brickMap;
}
export function buildInterior(b,scene,profile,levels,use=null){
 const home=new T.Group();home.name=b.address;scene.add(home);
 const brick=new T.MeshStandardMaterial({color:profile[0],map:masonry()});walls.push(brick);
 for(const poly of b.polys){
  const shape=new T.Shape(poly[0].map(([x,z])=>new T.Vector2(x,-z)));
  shape.holes=poly.slice(1).map(r=>new T.Path(r.map(([x,z])=>new T.Vector2(x,-z))));
  const slab=new T.ExtrudeGeometry(shape,{depth:.2,bevelEnabled:false});slab.rotateX(-Math.PI/2);
  const pitch=b.h/levels;
  if(use){
   const add=(name,x,y,z,w,h,d,material)=>{
    const part=new T.Mesh(cube,material);part.name=name;part.position.set(x,y,z);part.scale.set(w,h,d);home.add(part);
   };
   if(use==='restaurant'){
    // Seat and counter bases overlap the existing 0.20 m floor slab by 0.03 m.
    add('Counter',b.x,.9725,b.z,6,1.605,.95,trim);
    for(const x of [-3.4,3.4])for(const dz of [4,8]){
     add('Dining table',b.x+x,1,b.z+dz,1.4,.12,.8,floor);
     add('Table pedestal',b.x+x,.565,b.z+dz,.26,.79,.32,trim);
     for(const side of [-1,1])add('Bench',b.x+x,.4675,b.z+dz+side*.85,1.5,.595,.48,plaster);
    }
   }else if(use==='retail'){
    for(const x of [-6,-2,2,6])for(const dz of [-4,3]){
     add('Aisle divider',b.x+x,1.1,b.z+dz,.19,1.8,5.5,trim);
     for(const y of [.4,.9,1.45])add('Shelf',b.x+x,y,b.z+dz,.95,.12,5.5,floor);
    }
   }else{
    for(const level of [0,1])for(const dx of [-4,4])
     add('Front room partition',b.x+dx,pitch*level+pitch*.5,b.front-4,.16,pitch-.22,5,plaster);
   }
  }
  for(let k=0;k<=levels;k++){const deck=new T.Mesh(slab,floor);deck.position.y=k*pitch;deck.name=k===levels?'Roof':'Floor '+k;home.add(deck);if(k===levels){skins.push(deck);if(use){deck.geometry=slab.clone();deck.material=roofMaterial(deck.geometry,floor)}}}
  for(const ring of poly)for(let i=1;i<ring.length;i++){
   const [x,z]=ring[i-1],[u,v]=ring[i],dx=u-x,dz=v-z,len=Math.hypot(dx,dz);if(len<.04)continue;
   const facade=Math.min(z,v)>b.front-1.65&&Math.abs(dx)>2*Math.abs(dz)&&len>1.2;
   // The bespoke McDonald's frontage provides actual glass glazing in the
   // Broad-facing and long drive-thru-facing walls. Do not build a second
   // opaque masonry/window generator directly behind those exterior panes.
   // Keep the opposite service wall and rear enclosure intact.
   const driveThruSide=use==='restaurant'&&Math.abs(dx)<.6&&len>4&&
     (x+u)/2>b.x+b.w*.30;
   if(use==='restaurant'&&(facade||driveThruSide))continue;
   const angle=-Math.atan2(dz,dx);
   const groups=new Map();
   function part(t,y,width,height,depth,mat,inset=0,section=false){
    const key=section?'inside':mat.uuid;
    if(!groups.has(key))groups.set(key,{mat,items:[],inside:section});
    const pose=new T.Object3D();pose.position.set(x+t*dx,y,z+t*dz-inset);pose.rotation.y=angle;pose.scale.set(width,height,depth);pose.updateMatrix();groups.get(key).items.push(pose.matrix);
   }
   if(!facade)part(.5,b.h/2,len,b.h,.19,brick);
   else{
    const bays=Math.max(1,Math.round(len/(b.w/profile[2])));
    for(let k=0;k<levels;k++)for(let j=0;j<bays;j++){
     const bw=len/bays,t=(j+.5)/bays,ww=bw*(k?.53:.76),wh=pitch*(k?.51:.69),bottom=k*pitch+(k?.26:.13)*pitch,top=bottom+wh;
     part(t,(k*pitch+bottom)/2,bw,bottom-k*pitch,.23,brick);
     part(t,(top+(k+1)*pitch)/2,bw,(k+1)*pitch-top,.23,brick);
     for(const sign of [-1,1])part(t+sign*(bw+ww)/(4*len),bottom+wh/2,(bw-ww)/2,wh,.23,brick);
     part(t,bottom+wh/2,ww,wh,.035,glass);
     part(t,bottom-.04,ww+.15,.1,.36,trim);
     part(t,bottom+wh*.55,ww,.07,.12,trim);
     const px=x+t*dx,pz=z+t*dz;
     const hits=ring.slice(1).flatMap(([xx,zz],n)=>{const [ax,az]=ring[n];return (ax>px)!==(xx>px)?[az+(zz-az)*(px-ax)/(xx-ax)]:[]}).filter(a=>a<pz-.4);
     if(hits.length && !use){const depth=Math.min(5,pz-Math.max(...hits)-.18);if(depth>.5)part(t,k*pitch+pitch*.5,bw*.9,pitch-.2,.13,plaster,depth,true)}
    }
   }
   for(const {mat,items,inside} of groups.values()){const batch=new T.InstancedMesh(cube,mat,items.length);items.forEach((m,k)=>batch.setMatrixAt(k,m));home.add(batch);if(facade&&!inside)skins.push(batch)}
  }
 }
}
export function applyGraphics(scene,night,rooms,texture,open){
 setAerialNight(night);
 const sky=night?0x172435:0xafc5cc;scene.background.setHex(sky);
 for(const light of scene.children){if(light.isHemisphereLight)light.intensity=night?.33:2;if(light.isDirectionalLight)light.intensity=night?.45:2.4}
 plaster.emissiveIntensity=rooms?(night?.85:.22):0;
 glass.envMapIntensity=night?.12:.9;glass.opacity=night?(rooms?.14:.29):.33;
 for(const wall of walls){wall.map=texture?brickMap:null;wall.needsUpdate=true}
 for(const part of skins)part.visible=!open;
}
export function reflectionSky(renderer){
 const env=new T.Scene();env.background=new T.Color(0x8ba9b5);
 const horizon=new T.Mesh(new T.BoxGeometry(25,4,2),new T.MeshBasicMaterial({color:0x555956}));horizon.position.set(0,-2,8);env.add(horizon);
 const ground=new T.Mesh(new T.BoxGeometry(40,.5,40),new T.MeshBasicMaterial({color:0x66655e}));ground.position.y=-3;env.add(ground);
 const generator=new T.PMREMGenerator(renderer);glass.envMap=generator.fromScene(env).texture;glass.envMapIntensity=.9;generator.dispose();
}
