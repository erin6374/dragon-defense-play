import {CROSS_STREETS, occupiesCrossStreet} from '../simulation/road-corridors.js';
import * as THREE from 'three';

// Eight-block eastward vista based on the supplied Google satellite view.
// Block widths / lot positions are stylized estimates; no parcel GIS is implied.
// Farther rows use instancing and facade silhouettes, not structural interiors.
const STREET_AXIS=[
 {name:'N Park Ave',z:-37},{name:'N 13th St',z:-72},
 {name:'N Camac St',z:-107},{name:'N 12th St',z:-142},
 {name:'N 11th St',z:-177},{name:'N 10th St',z:-212},
 {name:'N 9th St',z:-247},{name:'N 8th St',z:-282}
];
const facades=[0x9a5c4a,0x6d423b,0xb7afa1,0xcac1b1,0x8a9192,0x8a674e,0xc0a38c,0x7d5350,0xbabcc0];
function seeded(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
const rand=seeded(1221237);
export function createDistantNeighborhood({THREE:THREEArg=THREE,scene,root}){
 const tiers=[
  {name:'park-camac',min:-68,max:-34,offset:.30},
  {name:'camac-11th',min:-170,max:-68,offset:.49},
  {name:'11th-9th',min:-240,max:-170,offset:.68},
  {name:'9th-8th',min:-316,max:-240,offset:.80}
 ];
 const cube=new THREE.BoxGeometry(1,1,1),dummy=new THREE.Object3D();
 const materials={
  building:new THREE.MeshStandardMaterial({color:0xffffff,roughness:.89}),
  roof:new THREE.MeshStandardMaterial({color:0x4a4441,roughness:.95}),
  cornice:new THREE.MeshStandardMaterial({color:0x9a8b7c,roughness:.85}),
  window:new THREE.MeshStandardMaterial({color:0x567383,roughness:.45,metalness:.06}),
  road:new THREE.MeshLambertMaterial({color:0x484b4d}),
  walk:new THREE.MeshLambertMaterial({color:0xaaa49a}),
  green:new THREE.MeshLambertMaterial({color:0x67785b}),
 };
 const buildingDefs=[];
 const groups=tiers.map((t,i)=>{const g=new THREE.Group();g.name='DISTANT_NEIGHBORHOOD_'+t.name;root.add(g);t.group=g;return g;});
 // The underlying street mesh and its buildings share each parallax tier.
 const instances=tiers.map(t=>({main:[],roof:[],cornice:[],window:[],road:[],walk:[],green:[]}));
 function add(tier,type,x,y,z,w,h,d,color=null){instances[tier][type].push({x,y,z,w,h,d,color});}
 function slot(x,z){return tiers.findIndex(t=>z>=t.min&&z<t.max);}
 function street(x,z,w,d,tier){add(tier,'road',x,-.44,z,w,.12,d);}
 // Residential grid has open lots, rear yards, crossing streets and the railway/civic gap.
 const cross=CROSS_STREETS.map(s=>s.x);
 for(let k=0;k<STREET_AXIS.length;k++){
  const s=STREET_AXIS[k],tier=Math.max(0,slot(0,s.z));
  street(0,s.z,172,8.5,tier);
  for(const side of [-1,1])add(tier,'walk',0,-.31,s.z+side*5.1,172,.15,1.45);
  // Intersections and crossings are an inexpensive white instanced pattern.
  for(const xx of cross)for(let q=0;q<4;q++)add(tier,'walk',xx+(q-1.5)*1.35,-.25,s.z,0.52,.02,6.4);
 }
 // Broad's continuation through the long perspective is an intentional simplified
 // orthographic vista. Street lines follow satellite-inspired names, not surveyed coordinates.
 for(const x of [...cross,-24,13,39]){
   for(let tier=0;tier<tiers.length;tier++){
    const t=tiers[tier],depth=t.max-t.min,mid=(t.min+t.max)/2;
    const isCross=cross.includes(x);
    street(x,mid,isCross?12:8.3,depth,tier);
    for(const side of [-1,1])add(tier,'walk',x+side*(isCross?7.35:5),-.31,mid,1.35,.15,depth);
   }
 }
 // The rail approach near N 11th and mixed civic/parking parcels are left open.
 const rowCenters=[-49,-83,-119,-153,-191,-226,-261,-297];
 for(let row=0;row<rowCenters.length;row++){
  const z=rowCenters[row],tier=slot(0,z);if(tier<0)continue;
  for(let ix=0;ix<22;ix++){
   const x=-79+ix*7.5+(row%2?2:0);
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
 let drawCalls=0;
 const meshes=[];
 for(let ti=0;ti<tiers.length;ti++){
  const g=groups[ti],entries=instances[ti];
  for(const key of Object.keys(entries)){
   const arr=entries[key];if(!arr.length)continue;
   const mesh=new THREE.InstancedMesh(cube,materials[key],arr.length);
   mesh.name='distance-'+tiers[ti].name+'-'+key;
   mesh.frustumCulled=false;
   for(let i=0;i<arr.length;i++){
    const a=arr[i];dummy.position.set(a.x,a.y,a.z);dummy.scale.set(a.w,a.h,a.d);dummy.rotation.set(0,0,0);dummy.updateMatrix();
    mesh.setMatrixAt(i,dummy.matrix);if(a.color!==null)mesh.setColorAt(i,new THREE.Color(a.color));
   }
   mesh.instanceMatrix.needsUpdate=true;
   if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
   g.add(mesh);meshes.push(mesh);drawCalls++;
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
 function setParallax(scrollX,follow=0){for(const t of tiers){
   t.group.position.x=scrollX*t.offset;
   t.group.position.y=-follow*t.offset*.045;
 }}
 return {
  root,tiers,buildingCount:buildingDefs.length,drawCalls,streetNames:STREET_AXIS.map(s=>s.name),
  setParallax,setHealth,setVisible(on){for(const t of tiers)t.group.visible=on},
  stats(){return {rows:rowCenters.length,buildings:buildingDefs.length,drawCalls,tiers:tiers.map(t=>({name:t.name,parallax:t.offset})),smoke:damageMarkers.length,crossStreetNames:CROSS_STREETS.map(s=>s.name),crossStreetOverlaps:buildingDefs.filter(b=>occupiesCrossStreet(b.x,b.w)).length}}
 };
}
