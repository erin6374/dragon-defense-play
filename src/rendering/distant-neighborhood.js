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
// Depth cueing is baked into existing instanced facade colors; it does not
// introduce extra meshes, materials or per-frame work. Keep the nearer blocks
// saturated so the playable neighborhood remains the visual focus.
const distanceHaze=new THREE.Color(0x9daab4);
function atmosphericFacade(hex,tier,row,lot){
 const c=new THREE.Color(hex);
 const haze=Math.min(.34,Math.max(0,tier)*.073);
 c.lerp(distanceHaze,haze);
 // Slight deterministic tonal variation avoids identical distant houses.
 const variation=1+(((row*13+lot*7)%9)-4)*.012;
 return c.multiplyScalar(variation);
}
function seeded(seed){return ()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};}
const rand=seeded(1221237);
export function createDistantNeighborhood({root,flameTexture}){
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
  rooftop:new THREE.MeshStandardMaterial({color:0x777d7c,roughness:.82,metalness:.14}),
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
 const instances=tiers.map(t=>({main:[],roof:[],cornice:[],rooftop:[],window:[],road:[],walk:[],green:[]}));
 function add(tier,type,x,y,z,w,h,d,color=null){instances[tier][type].push({x,y,z,w,h,d,color});}
 function registerBuilding(tier,x,z,w,h,d){
  const home={id:buildingDefs.length,tier,x,z,w,h,d,parts:[],damage:0,fall:0};
  buildingDefs.push(home);
  return home;
 }
 function addPart(home,type,x,y,z,w,h,d,color=null){
  const index=instances[home.tier][type].length;
  home.parts.push({type,index});
  add(home.tier,type,x,y,z,w,h,d,color);
 }
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
   const home=registerBuilding(tier,x,z,w,h,d);
   addPart(home,'main',x,h/2,z,w,h,d,atmosphericFacade(color,tier,row,ix));
   addPart(home,'roof',x,h+.12,z,w+.18,.24,d+.18);
   // Small rooftop HVAC boxes and access housings give the distant rows a
   // varied architectural silhouette; all equipment shares one batch per tier.
   // Place equipment toward the rear, away from the front cornice.
   if((ix+row*3)%5===0){
    const unitW=modern?1.4:1.1;
    addPart(home,'rooftop',x-w*.21,h+.54,z-d*.23,unitW,.72,1.2);
   }
   if((ix*7+row)%23===0){
    addPart(home,'rooftop',x+w*.19,h+1.02,z-d*.17,1.65,1.65,1.85);
   }
   if(!modern)addPart(home,'cornice',x,h+.36,z+d/2+.02,w+.23,.20,.3);
   else addPart(home,'cornice',x,h*.47,z+d/2+.03,w*.98,.12,.25);
   for(let floor=0;floor<stories;floor++){
    for(const bay of [-1,1]){
     const yy=(floor+.55)*h/stories;const wx=x+bay*w*.24;
     addPart(home,'window',wx,yy,z+d/2+.085,w*.24,Math.min(1.43,h/stories*.57),.07);
    }
   }
   // Door and occasional stoop, no separate draw call per home.
   if((ix+row)%3===0)addPart(home,'cornice',x-w*.24,.18,z+d/2+.62,w*.35,.24,1.12);
   if(commercial)addPart(home,'window',x,1.4,z+d/2+.10,w*.78,2.15,.07);
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
    const home=registerBuilding(0,x,z,8.2,h,14);
    addPart(home,'main',x,h/2,z,8.2,h,14,color);
    addPart(home,'roof',x,h+.14,z,8.5,.28,14.2);
    for(const floor of [1,2,3]){
     for(const dx of [-1.75,1.75])addPart(home,'window',x+dx,h*floor/4,z+7.05,1.32,1.62,.12);
    }
   }
  }
 }
 const civic=registerBuilding(0,72,-12,20,5.4,19);
 addPart(civic,'main',72,2.7,-12,20,5.4,19,0x85847a);
 addPart(civic,'roof',72,5.5,-12,20.4,.2,19.2);
 add(0,'green',68,-.40,-.8,13,.08,4.6);
 let drawCalls=0;
 const batches=tiers.map(()=>({}));
 for(let ti=0;ti<tiers.length;ti++){
  const g=groups[ti],entries=instances[ti];
  for(const key of Object.keys(entries)){
   const arr=entries[key];if(!arr.length)continue;
   const mesh=new THREE.InstancedMesh(cube,materials[key],arr.length);
   batches[ti][key]=mesh;
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
 // Reuse one instanced facade-debris batch per distance tier. The zero-scale
 // instances cost no per-building draw calls and remain hidden until a collapse.
 // A stable slot per home makes restart deterministic and avoids allocating
 // meshes or geometry when meteors land.
 const rubblePerBuilding=3;
 const rubbleBatches=tiers.map((tier,ti)=>{
  const homes=buildingDefs.filter(home=>home.tier===ti);
  const mesh=new THREE.InstancedMesh(cube,materials.main,homes.length*rubblePerBuilding);
  mesh.name='distance-'+tier.name+'-facade-debris';
  mesh.frustumCulled=false; // zero-scale startup bounds must not cull later rubble
  mesh.visible=false;
  for(let j=0;j<homes.length;j++){
   const home=homes[j];
   home.rubbleStart=j*rubblePerBuilding;
   const facade=home.parts.find(part=>part.type==='main');
   const facadeColor=instances[ti].main[facade.index].color;
   for(let k=0;k<rubblePerBuilding;k++){
    const slot=home.rubbleStart+k;
    dummy.position.set(home.x,-.6,home.z);
    dummy.rotation.set(0,0,0);dummy.scale.set(0,0,0);dummy.updateMatrix();
    mesh.setMatrixAt(slot,dummy.matrix);
    mesh.setColorAt(slot,new THREE.Color(facadeColor??0x8b8c86).multiplyScalar(.68+k*.09));
   }
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  groups[ti].add(mesh);drawCalls++;
  return mesh;
 });
 // Shared translucent smoke atlas replaces obvious rigid black cones. A single
 // billboard per damaged building retains the original 28-marker visual budget.
 // The texture is constructed once; no per-frame canvas or material allocations.
 const smokeCanvas=document.createElement('canvas');
 smokeCanvas.width=64;smokeCanvas.height=128;
 const smokeCtx=smokeCanvas.getContext('2d');
 for(let i=0;i<4;i++){
  const x=32+Math.sin(i*2.1)*7,y=104-i*23,r=19+i*3;
  const gradient=smokeCtx.createRadialGradient(x,y,1,x,y,r);
  gradient.addColorStop(0,'rgba(67,71,76,.60)');
  gradient.addColorStop(.55,'rgba(93,100,106,.35)');
  gradient.addColorStop(1,'rgba(117,127,135,0)');
  smokeCtx.fillStyle=gradient;
  smokeCtx.beginPath();smokeCtx.ellipse(x,y,r*.83,r,0,0,Math.PI*2);smokeCtx.fill();
 }
 const smokeTexture=new THREE.CanvasTexture(smokeCanvas);
 smokeTexture.colorSpace=THREE.SRGBColorSpace;
 const smokeMat=new THREE.SpriteMaterial({map:smokeTexture,color:0xd1d5d8,transparent:true,opacity:.67,depthWrite:false,depthTest:true});
 const fireMat=new THREE.SpriteMaterial({map:flameTexture,color:0xffa357,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending});
 const damageMarkers=[],impactSmoke=new Map();
 const damaged=new Set(),falling=new Set();
 let fireTime=0;
 function addImpactSmoke(home){
  if(impactSmoke.has(home))return;
  if(impactSmoke.size===28){
   const oldest=impactSmoke.keys().next().value;
   const {puff,flame}=impactSmoke.get(oldest);
   puff.removeFromParent();flame.removeFromParent();impactSmoke.delete(oldest);
  }
  if(damageMarkers.length+impactSmoke.size===28)damageMarkers.pop().removeFromParent();
  const puff=new THREE.Sprite(smokeMat);
  const size=Math.min(5,home.w*.54);
  const flame=new THREE.Sprite(fireMat);
  puff.scale.set(size*1.5,size*2.8,1);
  flame.scale.set(size*.9,size*1.15,1);
  groups[home.tier??0].add(puff,flame);
  impactSmoke.set(home,{puff,flame});
  positionImpactEffects(home,1-(home.fall??home.damage)**2*.84);
 }
 function positionImpactEffects(home,heightScale){
  const effects=impactSmoke.get(home);
  if(!effects)return;
  const height=home.h*heightScale;
  effects.puff.position.set(home.x,height+effects.puff.scale.x*.85,home.z);
  effects.basePuffY=effects.puff.position.y;
  effects.flame.position.set(home.x,height+effects.flame.scale.x*.34,home.z+home.d*.34);
 }
 function applyFall(home){
  const progress=home.fall*home.fall;
  const heightScale=1-progress*.84;
  for(const {type,index} of home.parts){
   const part=instances[home.tier][type][index];
   const mesh=batches[home.tier][type];
   const roof=type==='roof',trim=type!=='main'&&!roof;
   const trimScale=trim?Math.max(.001,1-progress):1;
   // A full-size flat black roof hid the new wall fragments in the settled
   // screenshot. Fold the roof inward and cant it over the debris instead.
   // These are existing instance transforms: no new mesh or draw call.
   const roofFootprint=roof?1-progress*.58:1;
   dummy.position.set(part.x+(roof?progress*home.w*.24:0),part.y*heightScale,
    part.z+(roof?progress*home.d*.09:0));
   dummy.scale.set(part.w*trimScale*roofFootprint,part.h*heightScale*trimScale,
    part.d*trimScale*(roof?1-progress*.46:1));
   dummy.rotation.set(roof?progress*.10:0,0,roof?progress*.39:0);
   dummy.updateMatrix();
   mesh.setMatrixAt(index,dummy.matrix);
   mesh.instanceMatrix.needsUpdate=true;
  }
  // Three irregular, tinted wall fragments break the flat-pancake silhouette.
  // The pieces descend from the damaged facade and settle within the lot;
  // there is no per-frame allocation or new draw call for each collapsed home.
  const debris=rubbleBatches[home.tier];
  const visibility=Math.min(1,home.fall*4);
  const widths=[.29,.21,.37],heights=[.24,.32,.19],depths=[.25,.22,.28];
  const offsetsX=[-.29,.31,.04],offsetsZ=[.21,-.23,-.29];
  for(let k=0;k<rubblePerBuilding;k++){
   const w=home.w*widths[k]*visibility;
   const h=home.h*heights[k]*visibility;
   const d=home.d*depths[k]*visibility;
   const y=(h*.5+.06)*visibility+(1-home.fall)*home.h*.42;
   dummy.position.set(home.x+home.w*offsetsX[k],y,home.z+home.d*offsetsZ[k]);
   dummy.rotation.set(0,[.31,-.48,.42][k]*home.fall,[.27,-.34,.21][k]*home.fall);
   dummy.scale.set(w,h,d);dummy.updateMatrix();
   debris.setMatrixAt(home.rubbleStart+k,dummy.matrix);
  }
  debris.instanceMatrix.needsUpdate=true;
  if(home.fall>0)debris.visible=true;
  positionImpactEffects(home,heightScale);
 }
 function targetAt(x,z){
  let nearest=null,nearestSq=Infinity;
  for(const home of buildingDefs){
   if(home.damage>=1)continue;
   const distance=(home.x-x)**2+(home.z-z)**2;
   if(distance<nearestSq){nearest=home;nearestSq=distance;}
  }
  return nearest?{id:nearest.id,x:nearest.x,y:nearest.h,z:nearest.z}:null;
 }
 function strikeTarget(id,strength){
  const home=buildingDefs[id];
  if(!home||home.damage>=1||falling.size>=8)return false;
  home.damage=Math.min(1,home.damage+strength);
  damaged.add(home);
  addImpactSmoke(home);
  if(home.damage===1)falling.add(home);
  return true;
 }
 function strike(x,z,strength){
  const target=targetAt(x,z);
  return target&&strikeTarget(target.id,strength)?target:null;
 }
 function update(dt){
  if(impactSmoke.size){
   fireTime+=dt;
   fireMat.opacity=.82+.16*Math.sin(fireTime*13)*Math.cos(fireTime*4);
  }
  for(const home of falling){
   home.fall=Math.min(1,home.fall+dt/1.1);
   applyFall(home);
   if(home.fall===1)falling.delete(home);
  }
  // Reuse the existing impact smoke sprites (28-marker cap). Gentle lateral
  // drift and lift suggest a hot plume without extra draw calls or meshes.
  // Anchor to the latest building height after the collapse update above.
  for(const [home,effects] of impactSmoke){
   effects.puff.position.x=home.x+Math.sin(fireTime*.66+home.id*.37)*effects.puff.scale.x*.18;
   effects.puff.position.y=effects.basePuffY+Math.sin(fireTime*.42+home.id*.29)*effects.puff.scale.y*.07;
  }
 }
 function restore(){
  for(const {puff,flame} of impactSmoke.values()){puff.removeFromParent();flame.removeFromParent();}
  for(const puff of damageMarkers)puff.removeFromParent();
  impactSmoke.clear();damageMarkers.length=0;
  for(const home of damaged){home.damage=home.fall=0;applyFall(home);}
  for(const debris of rubbleBatches)debris.visible=false;
  damaged.clear();falling.clear();fireTime=0;
 }
 function setHealth(health){
  const damage=Math.max(0,Math.min(1,1-health/100));
  const targetCount=Math.min(28-impactSmoke.size,Math.floor(damage*28));
  while(damageMarkers.length<targetCount){
   const b=buildingDefs[(damageMarkers.length*41+23)%buildingDefs.length];
   const puff=new THREE.Sprite(smokeMat);
   const size=2.4+rand()*2.5;
   puff.position.set(b.x,b.h+size*.65,b.z);
   puff.scale.set(size,size*1.9,1);
   groups[b.tier].add(puff);damageMarkers.push(puff);
  }
  while(damageMarkers.length>targetCount)damageMarkers.pop().removeFromParent();
 }
 return {
  root,tiers,buildingCount:buildingDefs.length,drawCalls,streetNames:STREET_AXIS.map(s=>s.name),
  setHealth,targetAt,strikeTarget,strike,update,restore,
  burnBackgroundBuilding(home){
   addImpactSmoke(home);
   positionImpactEffects(home,1-home.damage**2*.84);
  },
  setVisible(on){base.visible=on;for(const t of tiers)t.group.visible=on},
  buildingState(id){
   const home=buildingDefs[id];
   const {index}=home.parts[0];
   batches[home.tier].main.getMatrixAt(index,dummy.matrix);
   const mainHeight=dummy.matrix.elements[5];
   const debris=rubbleBatches[home.tier],rubblePieces=[];
   for(let k=0;k<rubblePerBuilding;k++){
    debris.getMatrixAt(home.rubbleStart+k,dummy.matrix);
    const e=dummy.matrix.elements;
    rubblePieces.push({height:Math.hypot(e[4],e[5],e[6]),x:e[12],y:e[13],z:e[14]});
   }
   const roofPart=home.parts.find(part=>part.type==='roof');
   batches[home.tier].roof.getMatrixAt(roofPart.index,dummy.matrix);
   const re=dummy.matrix.elements;
   const roof={width:Math.hypot(re[0],re[1],re[2]),depth:Math.hypot(re[8],re[9],re[10]),
    tilt:Math.atan2(re[1],re[0]),x:re[12],z:re[14]};
   const smoke=impactSmoke.get(home);
   return {damage:home.damage,fall:home.fall,height:mainHeight,originalHeight:home.h,roof,
    rubbleCount:rubblePieces.filter(piece=>piece.height>.01).length,rubblePieces,
    smokePosition:smoke?[smoke.puff.position.x,smoke.puff.position.y]:null,
    smoking:!!smoke,burning:!!smoke};
  },
  stats(){return {rows:rowCenters.length,buildings:buildingDefs.length,drawCalls,tiers:tiers.map(t=>t.name),
   smoke:damageMarkers.length+impactSmoke.size,fires:impactSmoke.size,damaged:damaged.size,
   rubbleBatches:rubbleBatches.length,rubbleCapacity:buildingDefs.length*rubblePerBuilding,
   falling:falling.size,crossStreetNames:CROSS_STREETS.map(s=>s.name),
   crossStreetOverlaps:buildingDefs.filter(b=>occupiesCrossStreet(b.x,b.w)).length}}
 };
}
