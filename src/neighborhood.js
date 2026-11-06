import {createDistantNeighborhood} from './rendering/distant-neighborhood.js';
import {populateCity} from './simulation/city-layout.js';
import {createStructuralCity} from './rendering/structural-city.js';
import {addStreetSetDressing} from './rendering/urban-detail.js';
export function buildNeighborhood({THREE,scene,staticGroup:g,block:b,material,mats,rand,visualBank}){
 const mat=material,walk=mat(0xa9a8a0),asphalt=mat(0x34373b),stripe=mat(0xd7c7a2),white=mat(0xe3e0d5);
 const nearStatic=new THREE.Group(),midStatic=new THREE.Group(),farStatic=new THREE.Group();
 nearStatic.name='neighborhood-near-static';midStatic.name='neighborhood-mid-static';farStatic.name='neighborhood-far-static';
 g.add(nearStatic,midStatic,farStatic);
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
 b(nearStatic,0,-.43,-30,215,.13,4,asphalt); // immediate rear service lane
 b(nearStatic,0,-.35,11.8,170,.16,4,walk);
 // Cross streets at Dauphin and Susquehanna
 for(const x of [-53,53]){b(nearStatic,x,-.43,15,12,.16,88,asphalt);b(nearStatic,x-7.35,-.31,15,1.8,.18,88,walk);b(nearStatic,x+7.35,-.31,15,1.8,.18,88,walk)}
 // Additional north-south streets behind the block (Park, 13th, Camac approximations)
 for(const x of [-20,6,31]){b(midStatic,x,-.43,-74,9.2,.12,126,asphalt);b(midStatic,x-5.9,-.31,-74,2.0,.16,126,walk);b(midStatic,x+5.9,-.31,-74,2.0,.16,126,walk);}
 // East-west residential cross streets stretching several blocks back.
 for(const z of [-48,-64,-80]){b(midStatic,0,-.43,z,176,.12,8.0,asphalt);b(midStatic,0,-.31,z-5.0,176, .14,2.0,walk);b(midStatic,0,-.31,z+5.0,176,.14,2.0,walk);}
 for(const z of [-96,-112]){b(farStatic,0,-.43,z,176,.12,8.0,asphalt);b(farStatic,0,-.31,z-5.0,176, .14,2.0,walk);b(farStatic,0,-.31,z+5.0,176,.14,2.0,walk);}
 for(let x=-95;x<96;x+=8)if(Math.abs(Math.abs(x)-53)>8){
  for(const z of [18,24,30])b(nearStatic,x,-.365,z,3,.025,.10,z===24?white:stripe);
 }
 for(const x of [-53,53])for(let z=16;z<32;z+=2)b(nearStatic,x,-.33,z,1.2,.03,1.1,white);
 // Rear crosswalk hints and lane stripes on the residential grid.
 for(const z of [-48,-64,-80])for(let x=-72;x<=72;x+=12)b(midStatic,x,-.365,z,4.5,.018,.18, stripe);
 for(const z of [-96,-112])for(let x=-72;x<=72;x+=12)b(farStatic,x,-.365,z,4.5,.018,.18, stripe);
 
 const longRange=createDistantNeighborhood({THREE,scene,root:g});
 const city=createStructuralCity(THREE,scene,visualBank);
 const school=populateCity(city);
 city.finalize();const buildings=city.buildings.filter(b=>!b.school);
 addStreetSetDressing(THREE,g);
 function roadLabel(label,x,z,rot=0){const c=document.createElement('canvas');c.width=512;c.height=96;const ctx=c.getContext('2d');ctx.fillStyle='#222c3a';ctx.fillRect(0,0,512,96);ctx.fillStyle='#f4edda';ctx.font='bold 39px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(label,256,48);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.Mesh(new THREE.PlaneGeometry(12,2.25),new THREE.MeshBasicMaterial({map:t,transparent:true,depthWrite:false}));m.position.set(x,-.21,z);m.rotation.x=-Math.PI/2;m.rotation.z=rot;nearStatic.add(m)}
 roadLabel('DAUPHIN ST',-53,0,Math.PI/2);roadLabel('SUSQUEHANNA AVE',53,0,Math.PI/2);roadLabel('N BROAD ST',0,24);

 function nearest(x,z,radius=7){return buildings.filter(b=>b.damage<1&&Math.abs(x-b.x)<b.w/2+radius&&z>b.z-b.d/2-radius&&z<b.front+radius).sort((a,b)=>Math.max(0,Math.abs(x-a.x)-a.w/2)-Math.max(0,Math.abs(x-b.x)-b.w/2)||Math.abs(z-a.front)-Math.abs(z-b.front))[0]}
 return {city,school,schoolGroup:city.groups.school,targetBuildings:buildings,buildings,windowSurfaces:[],bounds:buildings.filter(b=>!b.background).map(b=>[b.x-b.w/2,b.x+b.w/2]),longRange,parallaxGroups:{nearStatic,midStatic,farStatic,backNear:city.groups.backNear,backMid:city.groups.backMid,backFar:city.groups.backFar},
 batchStats:{intactBackgroundBuildings:buildings.filter(b=>b.background).length,drawBatches:city.stats().drawBatches,originalDrawObjects:city.stats().components},
 impact(x,y,z,radius=6.6,emit=()=>{},strength=1){return city.impact(nearest(x,z,radius*.3),new THREE.Vector3(x,y,z),radius,strength)},
 roofBreach(x,y,z,radius=2.3){const b=nearest(x,z,1);if(!b||y<b.h-1||b.roofBreached)return false;b.roofBreached=true;city.impact(b,new THREE.Vector3(x,b.h,z),radius,.45);return true},
 aftershock(x,y,z,radius=10){const primary=nearest(x,z,1);let n=0;for(const b of buildings){if(b===primary||b.damage>=1)continue;const distance=Math.hypot(Math.max(0,Math.abs(b.x-x)-b.w/2),Math.max(0,Math.abs(b.z-z)-b.d/2));if(distance<radius){n+=city.impact(b,new THREE.Vector3(x,y,z),radius*.55,.42*(1-distance/radius))}}return n},
 levelAll(){for(const b of buildings)city.forceDamage(b,1)},update:city.update,
 restore(){city.restore();for(const b of buildings)b.roofBreached=false},setAtmosphere(phase,darkness){city.setAtmosphere(darkness)},setDistantHealth(health){longRange.setHealth(health)},
 setDecorativeVisible(on){for(const key of ['backNear','backMid','backFar'])city.groups[key].visible=on;nearStatic.visible=midStatic.visible=farStatic.visible=on;longRange.setVisible(on);},
 setParallax(scrollX,follow=0){
  nearStatic.position.x=scrollX*0.04;nearStatic.position.y=-follow*0.003;
  midStatic.position.x=scrollX*0.10;midStatic.position.y=-follow*0.008;
  farStatic.position.x=scrollX*0.18;farStatic.position.y=-follow*0.014;
  city.groups.backNear.position.x=scrollX*0.08;city.groups.backNear.position.y=-follow*0.006;
  city.groups.backMid.position.x=scrollX*0.16;city.groups.backMid.position.y=-follow*0.010;
  city.groups.backFar.position.x=scrollX*0.24;city.groups.backFar.position.y=-follow*0.016;
  longRange.setParallax(scrollX,follow);
 },setRubbleVisible:city.setRubbleVisible,setParticlesEnabled:city.setParticlesEnabled
 };
}
