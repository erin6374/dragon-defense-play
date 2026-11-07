import {createDistantNeighborhood} from './rendering/distant-neighborhood.js';
import {populateCity} from './simulation/city-layout.js';
import {createStructuralCity} from './rendering/structural-city.js';
import {addForegroundPlanting,addStreetSetDressing} from './rendering/urban-detail.js';
export function buildNeighborhood({THREE,scene,staticGroup:g,block:b,material,mats,rand,visualBank}){
 const mat=material,walk=mat(0xa9a8a0),asphalt=mat(0x34373b),white=mat(0xe3e0d5);
 const nearStatic=new THREE.Group();
 nearStatic.name='Broad Street and sidewalks';
 g.add(nearStatic);
 // The whole site is on the EAST side of Broad. Do not populate the west side.
 b(nearStatic,0,-.65,-18,230,.32,140,walk); // extended ground including several rear blocks
 b(nearStatic,0,-.45,24,200,.13,24,asphalt); // Broad Street frontage
 // Broad Street extends west toward the camera. Previously the near ground
 // mesh stopped at z=52, exposing the scene's sky color across the lower fifth
 // of every screenshot. Fill the exposed camera foreground with contiguous
 // street/sidewalk surfaces, WITHOUT adding buildings on the west side.
 // Continue road pavement from z=36 to z=44 and begin the west sidewalk there.
 b(nearStatic,0,-.45,40,200,.13,8,asphalt); // near curb lane, z=36..44
 const westSidewalk=mat(0x555b60),westCurb=mat(0x898d8c),westJoint=mat(0x41474c);
 // Near-camera ground should read as pavement, not absorb the distant sky haze.
 // Standard game fog still applies to the school and distant architecture.
 for(const surface of [westSidewalk,westCurb,westJoint])surface.fog=false;
 b(nearStatic,0,-.43,108,230,.12,128,westSidewalk); // west side, z=44..172
 b(nearStatic,0,-.30,44.2,230,.17,.38,westCurb); // street-facing curb
 // Small restrained pavement expansion joints break up the large solid foreground.
 for(let z=52;z<=132;z+=12)b(nearStatic,0,-.359,z,230,.012,.11,westJoint);
 b(nearStatic,0,-.43,-88,200,.13,8.5,asphalt); // rear street beyond the last playable row
 b(nearStatic,0,-.35,11.8,170,.16,4,walk);
 // Cross streets at Dauphin and Susquehanna
 for(const x of [-53,53]){
  b(nearStatic,x,-.43,-22.5,12,.16,133,asphalt);
  for(const side of [-1,1]){
   b(nearStatic,x+side*7.35,-.31,-38,1.8,.18,100,walk);
  }
 }
 // Broad Street's double yellow center markings and white lane dividers.
 const yellow=mat(0xb88d41);
 const crossings=[-53,53];
 for(const [left,right] of [[-100,-59],[-47,47],[59,100]]){
  for(const z of [23.7,24.3])b(nearStatic,(left+right)/2,-.352,z,right-left,.015,.13,yellow);
 }
 for(let x=-96;x<=96;x+=8){
  if(crossings.some(cross=>Math.abs(x-cross)<8))continue;
  for(const z of [18,31,38])b(nearStatic,x,-.352,z,3,.015,.14,white);
 }
 for(const x of crossings)for(let z=14;z<44;z+=2.15){
  for(const side of [-1,1])b(nearStatic,x+side*7.6,-.33,z,2.5,.025,.72,white);
 }
 // The vacant lot between the brownstone and the modern apartments is visible from Broad.
 b(nearStatic,25.6,-.47,-6.9,3.15,.14,14.6,mat(0x77745c));
 const foreground=addForegroundPlanting(THREE,nearStatic);
 const longRange=createDistantNeighborhood({root:g});
 const city=createStructuralCity(THREE,scene,visualBank);
 const school=populateCity(city);
 city.finalize();const buildings=city.buildings.filter(b=>!b.school);
 addStreetSetDressing(THREE,g);
 function nearest(x,z,radius=7){return buildings.filter(b=>b.damage<1&&Math.abs(x-b.x)<b.w/2+radius&&z>b.z-b.d/2-radius&&z<b.front+radius).sort((a,b)=>Math.max(0,Math.abs(x-a.x)-a.w/2)-Math.max(0,Math.abs(x-b.x)-b.w/2)||Math.abs(z-a.front)-Math.abs(z-b.front))[0]}
 return {city,school,schoolGroup:city.groups.school,targetBuildings:buildings,buildings,windowSurfaces:[],foreground,bounds:buildings.filter(b=>!b.background).map(b=>[b.x-b.w/2,b.x+b.w/2]),longRange,
 batchStats:{intactBackgroundBuildings:buildings.filter(b=>b.background).length,drawBatches:city.stats().drawBatches,originalDrawObjects:city.stats().components},
 impact(x,y,z,radius=6.6,emit=()=>{},strength=1){return city.impact(nearest(x,z,radius*.3),new THREE.Vector3(x,y,z),radius,strength)},
 roofBreach(x,y,z,radius=2.3){const b=nearest(x,z,1);if(!b||y<b.h-1||b.roofBreached)return false;b.roofBreached=true;city.impact(b,new THREE.Vector3(x,b.h,z),radius,.45);return true},
 aftershock(x,y,z,radius=10){const primary=nearest(x,z,1);let n=0;for(const b of buildings){if(b===primary||b.damage>=1)continue;const distance=Math.hypot(Math.max(0,Math.abs(b.x-x)-b.w/2),Math.max(0,Math.abs(b.z-z)-b.d/2));if(distance<radius){n+=city.impact(b,new THREE.Vector3(x,y,z),radius*.55,.42*(1-distance/radius))}}return n},
 levelAll(){for(const b of buildings)city.forceDamage(b,1)},update:city.update,
 restore(){city.restore();for(const b of buildings)b.roofBreached=false},setAtmosphere(phase,darkness){city.setAtmosphere(darkness)},setDistantHealth(health){longRange.setHealth(health)},
 setDecorativeVisible(on){for(const key of ['backNear','backMid','backFar'])city.groups[key].visible=on;nearStatic.visible=on;longRange.setVisible(on);},
 streetOrigins(){return [nearStatic,city.groups.backNear,city.groups.backMid,
  city.groups.backFar,...longRange.tiers.map(tier=>tier.group)].map(group=>group.getWorldPosition(new THREE.Vector3()).toArray());},
 setRubbleVisible:city.setRubbleVisible,setParticlesEnabled:city.setParticlesEnabled
 };
}
