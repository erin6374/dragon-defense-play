import * as THREE from 'three';
import { createDistantNeighborhood } from './rendering/distant-neighborhood.js';
import { createStructuralCity } from './rendering/structural-city.js';
import { craterHolesUniform,patchCraterDiscardShader } from './rendering/crater-holes.js';
import { containsParcel,viewerParcels,VIEWER_TO_GAME_X,VIEWER_TO_GAME_Z } from './simulation/viewer-parcels.js';
import { createBroadStreetSurface } from '../broad-street/broad-street-surface-review35.mjs';
import { createJunctionApproaches } from '../broad-street/junction-approaches-review36.mjs';
import { createBlockGround } from '../broad-street/block-ground-review37.mjs';
import { createPublicRealm } from '../broad-street/public-realm-review38.mjs';
import { createPublicLandscape } from '../broad-street/public-landscape-review39.mjs';
import { createFrontageTransitions } from '../broad-street/public-surface-review40.mjs';
import { groundWindStrength } from './simulation/ground-wind.js';
import { roads } from '../broad-street/district.js';

export function buildNeighborhood({scene,staticGroup,block,material,visualBank,grid}) {
 const roadSurface=createBroadStreetSurface();
 const site=createBlockGround();
 const junctions=createJunctionApproaches(grid.streets);
 const transitions=createFrontageTransitions();
 const streets=new THREE.Group();
 const asphalt=material(0x535759);
 const junctionSegments=new Set(grid.streets.map(street=>street.name));
 for(const [name,[[x,z],[u,v]]] of roads){
  if(junctionSegments.has(name)&&Math.max(z,v)>-21)continue;
  const road=block(streets,(x+u)/2,-.11,(z+v)/2,name==='WATTS'?6:9,.12,Math.hypot(u-x,v-z),asphalt);
  road.rotation.y=Math.atan2(u-x,v-z);
 }
 const nearStatic=new THREE.Group();
 nearStatic.name='Viewer street grid and public realm';
 nearStatic.position.set(VIEWER_TO_GAME_X,-.34,VIEWER_TO_GAME_Z);
 nearStatic.add(roadSurface,site,junctions,transitions,streets);
 const patched=new Set();
 nearStatic.traverse(o=>{
  if(o.isMesh)for(const mat of [o.material].flat())if(!patched.has(mat)){
   patched.add(mat);
   patchCraterDiscardShader(mat,'viewer-road-crater');
  }
 });
 const landscape=createPublicLandscape();
 const crowns=[];
 landscape.traverse(object=>{
  if(object.name==='main crown'||object.name==='crown cluster')crowns.push({
   object,x:object.position.x+VIEWER_TO_GAME_X,z:object.position.z+VIEWER_TO_GAME_Z
  });
 });
 nearStatic.add(createPublicRealm(),landscape);
 function updateWindPlanting(dt,origin,dx=0,dz=0,pulse=0){
  let peak=0;
  for(const {object,x,z} of crowns){
   const gust=origin&&pulse?groundWindStrength(x,0,z,origin.x,0,origin.z,dx,0,dz)*pulse:0;
   object.rotation.x=THREE.MathUtils.lerp(object.rotation.x,dz*gust*.55,Math.min(1,dt*8));
   object.rotation.z=THREE.MathUtils.lerp(object.rotation.z,-dx*gust*.55,Math.min(1,dt*8));
   peak=Math.max(peak,Math.hypot(object.rotation.x,object.rotation.z));
  }
  return peak;
 }
 staticGroup.add(nearStatic);
 const terrain=patchCraterDiscardShader(material(0x8d8a7e),'viewer-terrain-crater');
 block(staticGroup,0,-.69,-19,2400,.24,235,terrain);

 const city=createStructuralCity(THREE,scene,visualBank);
 for(const parcel of viewerParcels(grid.rows))city.addBuilding(parcel);
 const school=city.addBuilding({name:'tech-freire-school',x:0,w:27,h:28,d:58.8,z:-29,
  stories:5,bays:6,school:true,kind:'brick'});
 city.finalize();
 const buildings=city.buildings.filter(b=>!b.school);
 const foreground=new THREE.Group();
 const activeAt=(x,z)=>buildings.find(b=>b.damage<.97&&containsParcel(b,x,z));

 // Park/Liacouras marks the rear of the surveyed map. Continue cross
 // streets from the imported endpoints into the RC residential grid.
 const rearEndpoints=roads.flatMap(([name,points])=>points
  .filter(([,z])=>z+VIEWER_TO_GAME_Z<=-90)
  .map(([x,z])=>({name,x:x+VIEWER_TO_GAME_X,z:z+VIEWER_TO_GAME_Z})));
 const rearEdge=Math.min(...rearEndpoints.map(point=>point.z),...buildings.map(b=>b.z-b.d/2));
 const crossStreetX=[...new Map(rearEndpoints
  .filter(p=>!['PARK','LIACOURAS','WATTS'].includes(p.name))
  .map(p=>[p.name,p.x])).values()];
 const contextRoot=new THREE.Group();
 contextRoot.name='RC174 residential context beyond Viewer grid';
 staticGroup.add(contextRoot);
 // The north boundary is Cumberland (negative game X). Include mapped
 // roads as well as parcels when computing the Sandbox camera range.
 const roadXs=roads.flatMap(([,points])=>points.map(([x])=>x+VIEWER_TO_GAME_X));
 const northEdge=Math.min(...roadXs,...buildings.map(b=>b.x-b.w/2))-6;
 const southEdge=Math.max(...roadXs,...buildings.map(b=>b.x+b.w/2));
 const inspectionBounds={minX:northEdge-105,maxX:southEdge+24};
 const longRange=createDistantNeighborhood({root:contextRoot,flameTexture:visualBank.images.flame,
  context:{rearEdge,crossStreetX,northEdge}});
 return {
  city,school,updateWindPlanting,schoolGroup:city.groups.school,targetBuildings:buildings,buildings,windowSurfaces:[],
  foreground,longRange,activeAt,inspectionBounds,
  bounds:buildings.filter(b=>!b.background).map(b=>[b.x-b.w/2,b.x+b.w/2]),
  batchStats:{mappedBuildings:buildings.length,drawBatches:city.stats().drawBatches},
  impact(x,y,z,radius=6.6,emit=()=>{},strength=1){return city.impact(activeAt(x,z),new THREE.Vector3(x,y,z),radius,strength);},
  roofBreach(x,y,z,radius=2.3){
   const b=activeAt(x,z);
   if(!b||y<b.h-1||b.roofBreached)return false;
   b.roofBreached=true;
   city.impact(b,new THREE.Vector3(x,b.h,z),radius,.45);
   return true;
  },
  levelAll(){for(const b of buildings)city.forceDamage(b,1);},
  update(dt){city.update(dt);longRange.update(dt);},
  restore(){city.restore();longRange.restore();for(const b of buildings)b.roofBreached=false;this.syncCraterHoles();},
  setAtmosphere(phase,darkness){city.setAtmosphere(darkness);},
  setDistantHealth:longRange.setHealth,
  setDecorativeVisible(on){for(const key of ['backNear','backMid','backFar'])city.groups[key].visible=on;longRange.setVisible(on);},
  streetOrigins(){return [nearStatic,city.groups.backNear,city.groups.backMid,city.groups.backFar,...longRange.tiers.map(tier=>tier.group)]
   .map(group=>group.getWorldPosition(new THREE.Vector3()).toArray());},
  syncCraterHoles(activeCraters=[]){
   const surfaceCraters=activeCraters.filter(c=>!c.waterOnly&&c.life>0);
   for(const [i,hole] of craterHolesUniform.value.entries()){
    const cr=surfaceCraters[i];
    if(cr&&cr.life>0)hole.set(cr.x,cr.z,(cr.radius*(cr.isSubway?1.05:.92))**2,cr.isSubway?1:.5);
    else hole.set(0,0,0,0);
   }
  },
  getCraterUniforms:()=>craterHolesUniform.value.map(v=>({x:v.x,z:v.y,rSq:v.z,active:v.w})),
  setRubbleVisible:city.setRubbleVisible,setParticlesEnabled:city.setParticlesEnabled
 };
}
