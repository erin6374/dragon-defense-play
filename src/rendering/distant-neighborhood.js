import {CROSS_STREETS, occupiesCrossStreet} from '../simulation/road-corridors.js';
import * as THREE from 'three';

// Eight-block eastward vista based on the supplied Google satellite view.
// Block widths / lot positions are stylized estimates; no parcel GIS is implied.
// Farther rows use instancing and facade silhouettes, not structural interiors.
const STREET_AXIS=[
 {name:'N Park Ave',z:-88},{name:'N 13th St',z:-112},
 {name:'N Camac St',z:-143},{name:'N 12th St',z:-174},
 {name:'N 11th St',z:-204},{name:'N 10th St',z:-234},
 {name:'N 9th St',z:-265},{name:'N 8th St',z:-296}
];
const facades=[0x9a5c4a,0x6d423b,0xb7afa1,0xcac1b1,0x8a9192,0x8a674e,0xc0a38c,0x7d5350,0xbabcc0];
function seeded(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
const rand=seeded(1221237);
export function createDistantNeighborhood({root}){
 const tiers=[
  {name:'outside-playable-block',min:-87,max:0},
  {name:'park-camac',min:-135,max:-87},
  {name:'camac-11th',min:-199,max:-135},
  {name:'11th-9th',min:-261,max:-199},
  {name:'9th-8th',min:-326,max:-261}
 ];
 const cube=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();
 const materials={
  main:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.89}),
  roof:new THREE.MeshStandardMaterial({color:0x4a4441,roughness:.95}),
  cornice:new THREE.MeshStandardMaterial({color:0x9a8b7c,roughness:.85}),
  window:new THREE.MeshStandardMaterial({color:0x567383,roughness:.45,metalness:.06}),
  road:new THREE.MeshLambertMaterial({color:0x484b4d}),
  walk:new THREE.MeshLambertMaterial({color:0xaaa49a}),
  green:new THREE.MeshLambertMaterial({color:0x67785b}),
 };
 const base=new THREE.Mesh(new THREE.BoxGeometry(540,.2,353),materials.walk);
 base.position.set(0,-.63,-176.5);root.add(base);
 const buildingDefs=[];
 const groups=tiers.map(t=>{const g=new THREE.Group();g.name='DISTANT_NEIGHBORHOOD_'+t.name;root.add(g);t.group=g;return g;});
 // The underlying street mesh and its buildings share the same fixed world coordinates.
 const instances=tiers.map(t=>({main:[],roof:[],cornice:[],window:[],road:[],walk:[],green:[]}));
 function add(tier,type,x,y,z,w,h,d,color=null){instances[tier][type].push({x,y,z,w,h,d,color});}
 function slot(z){return tiers.findIndex(t=>z>=t.min&&z<t.max);}
 function street(x,z,w,d,tier){add(tier,'road',x,-.44,z,w,.12,d);}
 // Residential grid has open lots, rear yards, crossing streets and the railway/civic gap.
 const cross=CROSS_STREETS.map(s=>s.x);
 for(let k=0;k<STREET_AXIS.length;k++){
  const s=STREET_AXIS[k],tier=Math.max(0,slot(s.z));
  if(k>0)street(0,s.z,325,8.5,tier);
  for(const side of [-1,1])add(tier,'walk',0,-.31,s.z+side*5.1,325,.15,1.45);
  // Intersections and crossings are an inexpensive white instanced pattern.
  for(const xx of cross)for(let q=0;q<4;q++)add(tier,'walk',xx+(q-1.5)*1.35,-.25,s.z,0.52,.02,6.4);
 }
 // Continue the two cross streets through the deeper residential grid.
 for(const x of cross){
   for(let tier=1;tier<tiers.length;tier++){
    const t=tiers[tier],depth=t.max-t.min,mid=(t.min+t.max)/2;
    street(x,mid,12,depth,tier);
    for(const side of [-1,1])add(tier,'walk',x+side*7.35,-.31,mid,1.35,.15,depth);
   }
 }
 // The rail approach near N 11th and mixed civic/parking parcels are left open.
 const rowCenters=[-100,-127,-158,-189,-219,-249,-280,-311];
 for(let row=0;row<rowCenters.length;row++){
  const z=rowCenters[row],tier=slot(z);if(tier<0)continue;
  for(let ix=0;ix<44;ix++){
   const x=-161+ix*7.5+(row%2?2:0);
   const railGap=(row>=4&&Math.abs(x-12)<17); // diagonal railway corridor east of 11th, approximate
   const vacant=(ix+row*7)%11===0 || (row===5&&ix>15&&ix<19);
   if(railGap||vacant){if((ix+row)%3===0)add(tier,'green',x,-.42,z,7.1,.05,11.5);continue;}
   const modern=(ix*5+row*3)%13===0;
   const commercial=(ix*7+row)%17===0;
   const stories=modern?3:((ix+row)%4===0?3:2);
   const h=(stories===2?7.3:10.7)+(ix%3)*.32;
   const w=6.15+((ix+row)%3)*.28,d=10.1+((ix*2+row)%3)*.9;
   if(occupiesCrossStreet(x,w))continue; // no buildings on the two continuous cross streets
   const color=facades[(ix*3+row*5)%facades.length];
   const home={x,y:h/2,z,w,h,d,stories,tier,damage:0,row,ix};buildingDefs.push(home);
   add(tier,'main',x,h/2,z,w,h,d,color);
   add(tier,'roof',x,h+.12,z,w+.18,.24,d+.18);
   if(!modern)add(tier,'cornice',x,h+.36,z+d/2+.02,w+.23,.20,.3);
   else add(tier,'cornice',x,h*.47,z+d/2+.03,w*.98,.12,.25);
   for(let floor=0;floor<stories;floor++){
    for(const bay of [-1,1]){
     const yy=(floor+.55)*h/stories;const wx=x+bay*w*.24;
     add(tier,'window',wx,yy,z+d/2+.085,w*.24,Math.min(1.43,h/stories*.57),.07);
    }
   }
   // Door and occasional stoop, no separate draw call per home.
   if((ix+row)%3===0)add(tier,'cornice',x-w*.24,.18,z+d/2+.62,w*.35,.24,1.12);
   if(commercial)add(tier,'window',x,1.4,z+d/2+.10,w*.78,2.15,.07);
  }
 }
 // The east-side blocks beyond the playable frontage are visible at the pan limits.
 // Use simple fixed masses here, with the low civic lot beside Susquehanna kept open.
 for(const side of [-1,1]){
  for(const z of [-10,-31,-53,-75]){
   for(let i=0;i<8;i++){
    if(z===-10&&i<2)continue; // existing frontage and the lower civic building
    const x=side*(70+i*9.4);
    const h=7.6+(i*13+Math.abs(z))%7;
    const color=facades[(i+Math.abs(z))%facades.length];
    add(0,'main',x,h/2,z,8.2,h,14,color);
    add(0,'roof',x,h+.14,z,8.5,.28,14.2);
    for(const floor of [1,2,3]){
     for(const dx of [-1.75,1.75])add(0,'window',x+dx,h*floor/4,z+7.05,1.32,1.62,.12);
    }
   }
  }
 }
 add(0,'main',72,2.7,-12,20,5.4,19,0x85847a);
 add(0,'roof',72,5.5,-12,20.4,.2,19.2);
 add(0,'green',68,-.40,-.8,13,.08,4.6);
 let drawCalls=0;
 for(let ti=0;ti<tiers.length;ti++){
  const g=groups[ti],entries=instances[ti];
  for(const key of Object.keys(entries)){
   const arr=entries[key];if(!arr.length)continue;
   const mesh=new THREE.InstancedMesh(cube,materials[key],arr.length);
   mesh.name='distance-'+tiers[ti].name+'-'+key;
   for(let i=0;i<arr.length;i++){
    const a=arr[i];dummy.position.set(a.x,a.y,a.z);dummy.scale.set(a.w,a.h,a.d);dummy.rotation.set(0,0,0);dummy.updateMatrix();
    mesh.setMatrixAt(i,dummy.matrix);if(a.color!==null)mesh.setColorAt(i,new THREE.Color(a.color));
   }
   mesh.instanceMatrix.needsUpdate=true;
   if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
   g.add(mesh);drawCalls++;
  }
 }
 const damageMarkers=[];
 const smokeGeo=new THREE.ConeGeometry(.5,2,6);const smokeMat=new THREE.MeshBasicMaterial({color:0x302e30,transparent:true,opacity:.30,depthWrite:false});
 function setHealth(health){
  const damage=Math.max(0,Math.min(1,1-health/100));
  const targetCount=Math.min(28,Math.floor(damage*28));
  while(damageMarkers.length<targetCount){
   const b=buildingDefs[(damageMarkers.length*41+23)%buildingDefs.length];
   const puff=new THREE.Mesh(smokeGeo,smokeMat);puff.position.set(b.x,b.h+1.9,b.z);puff.scale.setScalar(1+rand()*1.9);
   groups[b.tier].add(puff);damageMarkers.push(puff);
  }
  while(damageMarkers.length>targetCount)damageMarkers.pop().removeFromParent();
 }
 return {
  root,tiers,buildingCount:buildingDefs.length,drawCalls,streetNames:STREET_AXIS.map(s=>s.name),
  setHealth,setVisible(on){base.visible=on;for(const t of tiers)t.group.visible=on},
  stats(){return {rows:rowCenters.length,buildings:buildingDefs.length,drawCalls,tiers:tiers.map(t=>t.name),smoke:damageMarkers.length,crossStreetNames:CROSS_STREETS.map(s=>s.name),crossStreetOverlaps:buildingDefs.filter(b=>occupiesCrossStreet(b.x,b.w)).length}}
 };
}
