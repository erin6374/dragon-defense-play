import * as T from 'three';
import {renderBereanRose} from './landmark-fidelity-21.mjs';
import {buildMcDonaldsSharedPreview} from './mcdonalds-shared-preview.mjs';
export function buildLandmark(id){
 const group=new T.Group(),materials=new Map();
 function mesh(geometry,color,x,y,z){
  if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.78}));
  const m=new T.Mesh(geometry,materials.get(color));m.position.set(x,y,z);group.add(m);return m;
 }
 function box(x,y,z,w,h,d,color){return mesh(new T.BoxGeometry(w,h,d),color,x,y,z)}
 function prism(points,depth,color,x,y,z){
  const shape=new T.Shape();points.forEach(([a,b],i)=>i?shape.lineTo(a,b):shape.moveTo(a,b));shape.closePath();
  return mesh(new T.ExtrudeGeometry(shape,{depth,bevelEnabled:false}),color,x,y,z);
 }
 function storefront(w,z){
  box(0,2,z,w,3,.18,0x477078);
  for(let x=-w/2;x<=w/2;x+=2)box(x,2,z+.12,.09,3,.12,0xc4c2bb);
 }
 if(id==='E-032'){
  const stone=0x8a8176;
  box(0,4,0,13,8,16,stone);
  prism([[-6.5,0],[0,6],[6.5,0]],16,0x45474b,0,8,-8);
  prism([[-6.5,0],[0,6],[6.5,0]],.3,stone,0,8,7.9);
  for(const x of [-5.8,5.8]){
   mesh(new T.CylinderGeometry(1.45,1.6,10,8),stone,x,5,7.2);
   mesh(new T.ConeGeometry(1.65,4,8),0x505053,x,12,7.2);
  }
  const face=8.25;
  // Match the round stained-glass window on the designated Berean church,
  // rather than an indistinct gray disk with four crossing bars.
  renderBereanRose(T,group,{x:0,y:9,z:face+.22,radius:2.1});
  prism([[-1.65,0],[1.65,0],[1.65,2.8],[0,4.5],[-1.65,2.8]],.25,0x782e27,0,.6,face);
  for(let i=0;i<3;i++)box(0,.1+i*.1,10-i*.45,4.8,.2+i*.2,.65,0xa7a298);
  for(const x of [-6.56,6.56])for(const z of [-5,-1,3])box(x,4,z,.25,5,1.4,0x4b5867);
 }else if(id==='E-031'){
  // Reuse exact municipal-source facade, sign and roof. No obsolete red
  // sloped roof, duplicate arches or alternate five-bay storefront.
  return buildMcDonaldsSharedPreview();
 }else if(id==='E-023'){
  box(0,.07,0,28,.14,29,0x505253);box(0,.18,-4,21,.22,14,0xb4afa5);
  box(0,2.55,-4,19,4.7,12,0xbfc4c0);box(0,5,-4,19.5,.40,12.5,0x939b99);
  box(0,4.72,2.25,18.8,.92,.50,0xd9ddda); // low light-gray parapet
  storefront(12,2.12);box(0,3.85,2.5,15,.46,1.3,0xc3cac8);
  box(2.9,1.40,2.39,1.8,2.65,.16,0x3c5158); // storefront entry bay
  box(2.9,1.42,2.51,1.43,2.33,.09,0x8ba8ad);
  // Three small distinctive diamond openings on the long pharmacy side.
  for(const z of [-1.6,-4.8,-8.0]){
   const d=box(9.58,2.84,z,.71,.71,.10,0x7e8a8a);d.rotation.z=Math.PI/4;
  }
  for(let i=0;i<=8;i++)box(-12+i*3,.16,10,.09,.04,5,0xdcd9cb);
  const paint=[0x8f3331,0xc6c8c1,0x3d586c,0x33383d,0x8b9996];
  [0,2,3,5,7].forEach((stall,i)=>{
   const x=-10.5+3*stall;box(x,.67,10,1.8,.74,3.9,paint[i]);box(x,1.2,9.9,1.53,.56,2,0x485965);
   for(const side of [-1,1])for(const dz of [-1.18,1.18])mesh(new T.CylinderGeometry(.34,.34,.2,12),0x27292a,x+.87*side,.49,10+dz).rotation.z=Math.PI/2;
  });
 }else return null;
 return group;
}
