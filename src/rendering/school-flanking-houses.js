// Visual skins for the two existing unlabeled white FBX neighboring massing volumes.
// These are independent 3–4 story townhouses, not additional school floors.
import * as THREE from 'three';
import {createFacadeAtlas} from './facade-atlas.js';
export function installSchoolFlankingHouses(scene,bounds){
 const group=new THREE.Group();group.name='INDIVIDUAL-ADJACENT-TOWNHOUSES';scene.add(group);
 const width=bounds.max.x-bounds.min.x,center=(bounds.max.x+bounds.min.x)*.5;
 const frontage=bounds.max.z+.25;
 const defs=[
  {x:bounds.min.x-5.8,w:7.2,h:12.7,base:0xcac0b0,kind:'stone',seed:41},
  {x:bounds.max.x+6.4,w:8.3,h:12.4,base:0x734735,kind:'brick',seed:63}
 ];
 const box=new THREE.BoxGeometry(1,1,1);
 const mk=(x,y,z,w,h,d,mat)=>{const m=new THREE.Mesh(box,mat);m.position.set(x,y,z);m.scale.set(w,h,d);m.receiveShadow=true;group.add(m);return m;};
 for(const house of defs){
  const hex='#'+house.base.toString(16).padStart(6,'0');
  const texture=createFacadeAtlas(THREE,{seed:house.seed,stories:3,bays:2,kind:house.kind,color:hex,store:false});
  const main=new THREE.MeshStandardMaterial({color:house.base,roughness:.93});
  const facade=new THREE.MeshStandardMaterial({map:texture,roughness:.83,side:THREE.DoubleSide});
  const roof=new THREE.MeshStandardMaterial({color:0x484747,roughness:.92});
  // Narrow frontage receives the same deep-glazing artwork as the neighborhood,
  // but retains an independently bounded masonry shell for lighting and roof depth.
  mk(house.x,house.h*.5,frontage-2.1,house.w,house.h,4.2,main);
  const p=new THREE.Mesh(new THREE.PlaneGeometry(house.w,house.h),facade);
  p.position.set(house.x,house.h*.5,frontage+.035);group.add(p);
  mk(house.x,house.h+.16,frontage-2.1,house.w+.16,.26,4.4,roof);
  mk(house.x,house.h-.13,frontage+.18,house.w+.33,.21,.42,main);
  // Sills are tied to the townhouse facade (not free-standing window cards).
  const trim=new THREE.MeshStandardMaterial({color:house.kind==='stone'?0xd9ccbc:0xb58b77,roughness:.83});
  for(let row=0;row<3;row++){
   const y=(row+.25)*(house.h/3);
   mk(house.x,y,frontage+.11,house.w*.89,.08,.27,trim);
  }
  // Roof drain and parapet crest.
  const metal=new THREE.MeshStandardMaterial({color:0x55585a,roughness:.65,metalness:.48});
  mk(house.x+house.w*.43,house.h*.5,frontage+.14,.075,house.h*.94,.09,metal);
 }
 return group;
}
