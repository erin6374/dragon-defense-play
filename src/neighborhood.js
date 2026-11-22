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
 // Continuous Broad Street ground and pavement spanning full widescreen camera frustum
 b(nearStatic,0,-.65,-18,2400,.32,160,walk); // extended ground including several rear blocks
 b(nearStatic,0,-.45,24,2400,.13,24,asphalt); // Broad Street frontage
 b(nearStatic,0,-.45,40,2400,.13,8,asphalt); // near curb lane, z=36..44
 const westSidewalk=mat(0x555b60),westCurb=mat(0x898d8c),westJoint=mat(0x41474c);
 for(const surface of [westSidewalk,westCurb,westJoint])surface.fog=false;
 b(nearStatic,0,-.43,108,2400,.12,128,westSidewalk); // west side, z=44..172
 b(nearStatic,0,-.30,44.2,2400,.17,.38,westCurb); // street-facing curb
 for(let z=52;z<=132;z+=12)b(nearStatic,0,-.359,z,2400,.012,.11,westJoint);
 // North-South streets parallel to Broad:
 // N Park Ave: Centerline z = -66.0, road width = 9.0 (spans z in [-70.5, -61.5])
 b(nearStatic,0,-.43,-66.0,2400,.13,9.0,asphalt);
 b(nearStatic,0,-.31,-60.5,2400,.18,2.0,walk); // East sidewalk
 b(nearStatic,0,-.31,-71.5,2400,.18,2.0,walk); // West sidewalk
 // N 13th St: Centerline z = -104.0, road width = 9.0 (spans z in [-108.5, -99.5])
 b(nearStatic,0,-.43,-104.0,2400,.13,9.0,asphalt);
 b(nearStatic,0,-.31,-98.5,2400,.18,2.0,walk); // East sidewalk
 b(nearStatic,0,-.31,-109.5,2400,.18,2.0,walk); // West sidewalk
 b(nearStatic,0,-.35,11.8,2400,.16,4,walk);
 // Cross streets at York (x=-270), Dauphin (x=-102), Susquehanna (x=78), and Diamond (x=256)
 // Continuous pavement corridors extending through Broad, Watts, Park, and 13th back to Camac
 for(const x of [-270,-102,78,256]){
  b(nearStatic,x,-.43,-48.0,14,.16,184,asphalt);
  for(const side of [-1,1]){
   b(nearStatic,x+side*8.2,-.31,-48.0,2.0,.18,184,walk);
  }
 }
 // Broad Street's double yellow center markings and white lane dividers.
 const yellow=mat(0xb88d41);
 const crossings=[-270,-102,78,256];
 for(const [left,right] of [[-1150,-278],[-262,-110],[-94,70],[86,248],[264,1150]]){
  for(const z of [23.7,24.3])b(nearStatic,(left+right)/2,-.352,z,right-left,.015,.13,yellow);
 }
 for(let x=-1150;x<=1150;x+=8){
  if(crossings.some(cross=>Math.abs(x-cross)<9.5))continue;
  for(const z of [18,31,38])b(nearStatic,x,-.352,z,3,.015,.14,white);
 }
 for(const x of crossings)for(let z=14;z<44;z+=2.15){
  for(const side of [-1,1])b(nearStatic,x+side*8.4,-.33,z,2.5,.025,.72,white);
 }
 // 2100-Block Commercial Ground Parking Aprons (McDonald's & ArchWell / Former CVS)
 // Paved customer parking apron with yellow stall striping in front of McDonald's (x in [178, 202], z in [-5, 10])
 b(nearStatic,190.0,-.39,2.5,24.0,.14,15.0,asphalt);
 for(let px=180.0;px<=200.0;px+=2.8){
  b(nearStatic,px,-.31,3.0,.12,.02,4.8,yellow);
 }
 // Drive-thru lane apron and approach connecting to McDonald's
 b(nearStatic,207.0,-.39,-12.0,12.0,.14,24.0,asphalt);
 // ArchWell / Former CVS customer parking apron (x in [92, 116], z in [-4, 10])
 b(nearStatic,104.0,-.39,3.0,24.0,.14,14.0,asphalt);
 for(let px=94.0;px<=114.0;px+=2.8){
  b(nearStatic,px,-.31,3.5,.12,.02,4.8,yellow);
 }
 // The vacant lot between the brownstone and the modern apartments is visible from Broad.
 b(nearStatic,25.6,-.47,-6.9,3.15,.14,14.6,mat(0x77745c));
 b(nearStatic,25.6,-.15,0.2,3.15,.55,.32,mat(0x4a302b));
 b(nearStatic,25.6,.25,0.2,3.15,.25,.08,westCurb);
 const foreground=addForegroundPlanting(THREE,nearStatic);
 const longRange=createDistantNeighborhood({root:g,flameTexture:visualBank.images.flame});
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
 levelAll(){for(const b of buildings)city.forceDamage(b,1)},
 update(dt){city.update(dt);longRange.update(dt);},
 restore(){city.restore();longRange.restore();for(const b of buildings)b.roofBreached=false},setAtmosphere(phase,darkness){city.setAtmosphere(darkness)},setDistantHealth(health){longRange.setHealth(health)},
 setDecorativeVisible(on){for(const key of ['backNear','backMid','backFar'])city.groups[key].visible=on;nearStatic.visible=on;longRange.setVisible(on);},
 streetOrigins(){return [nearStatic,city.groups.backNear,city.groups.backMid,
  city.groups.backFar,...longRange.tiers.map(tier=>tier.group)].map(group=>group.getWorldPosition(new THREE.Vector3()).toArray());},
 setRubbleVisible:city.setRubbleVisible,setParticlesEnabled:city.setParticlesEnabled
 };
}
