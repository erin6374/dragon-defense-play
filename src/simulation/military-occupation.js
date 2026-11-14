// Campaign Preview 4: chapter-three military occupation. All meshes and projectiles are owned here.
import * as THREE from 'three';
import {detectMilitaryCollateral,segmentSphereEntry,nearestSegmentSphereHit} from './military-collateral.js';
import {slewSearchlightDirection} from './military-searchlight.js';
import {militaryWindImpulse} from './military-wind.js';
const shotCenter=shot=>shot.mesh.position,shotRadius=()=>1.8;
const shotEligible=shot=>!shot.hostile&&!shot.fireTarget&&shot.life>0;
const meteorCenter=meteor=>meteor.mesh.position,meteorRadius=meteor=>meteor.size+1;
export function createMilitaryOccupation({scene,dragon,getWave,onDragonHit,onMeteorHit,onBlast,onMessage,onCollateral,getCollateralStructures}){
 const exhaustGeo=new THREE.SphereGeometry(.32,5,4);
 const exhaustMat=new THREE.MeshBasicMaterial({color:0x879096,transparent:true,opacity:.26,depthWrite:false});
 const exhaust=[];
 function smokeTrail(position,dt){
  if(Math.random()<Math.min(1,dt*24)&&exhaust.length<130){
   const puff=new THREE.Mesh(exhaustGeo,exhaustMat.clone());puff.position.copy(position);puff.scale.setScalar(.55+Math.random()*.7);scene.add(puff);
   exhaust.push({puff,life:.9+Math.random()*.6,ttl:1.5});
  }
 }
 function updateExhaust(dt){for(let i=exhaust.length-1;i>=0;i--){const p=exhaust[i];p.life-=dt;p.puff.position.y+=dt*.9;p.puff.scale.multiplyScalar(1+dt*.8);p.puff.material.opacity=Math.max(0,p.life/p.ttl)*.26;
  if(p.life<=0){scene.remove(p.puff);p.puff.material.dispose();exhaust.splice(i,1);}}}
 function clearExhaust(){for(const p of exhaust){scene.remove(p.puff);p.puff.material.dispose();}exhaust.length=0;}
 const vehicles=[],missiles=[];
 const hullMat=new THREE.MeshStandardMaterial({color:0x48533c,roughness:.88,metalness:.12});
 const gasHullMat=hullMat.clone();gasHullMat.color.setHex(0x60b946);
 const steel=new THREE.MeshStandardMaterial({color:0x29342e,roughness:.7,metalness:.28});
 const warning=new THREE.MeshBasicMaterial({color:0xffb04a});
 const rocketMat=new THREE.MeshStandardMaterial({color:0xb5bab0,metalness:.45,roughness:.45});
 const cube=new THREE.BoxGeometry(1,1,1),ball=new THREE.SphereGeometry(1,8,6),cone=new THREE.ConeGeometry(1,1,8);
 // Two/three bounded draw calls, shared mesh/material, NO shadow-casting lights.
 // A subtle tapered visible cone creates volumetric-style searchlight pursuit.
 const searchlightGeo=new THREE.CylinderGeometry(2.65,.06,1,12,1,true);
 searchlightGeo.translate(0,.5,0); // cone starts at launcher lens, ends at far aim point
 const searchlightMat=new THREE.MeshBasicMaterial({color:0xd4e6ff,transparent:true,opacity:.075,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
 const searchlightLensMat=new THREE.MeshBasicMaterial({color:0xeef6ff});
 const searchlightUp=new THREE.Vector3(0,1,0);
 let spawnClock=0,enabled=false,collateralNotice=0;
 function box(root,mat,x,y,z,w,h,d){const mesh=new THREE.Mesh(cube,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);root.add(mesh);return mesh;}
 function deploy(x,advanced=false){
  const root=new THREE.Group();root.position.set(x,-.36,24);
  // Realistic M1 Abrams Main Battle Tank chassis
  const hull=box(root,hullMat,0,1.0,0,advanced?7.2:6.4,1.15,3.2);
  box(root,hullMat,2.8,.85,0,1.4,.75,3.0); // sloped glacis
  box(root,steel,-2.4,1.15,0,1.8,.65,2.8); // rear engine deck
  for(const z of [-1.55,1.55]){
   box(root,hullMat,0,.85,z,6.2,.85,.22); // side skirt
   box(root,steel,0,.45,z*.92,6.4,.65,.45); // rubber/steel tread belt
   for(const xx of [-2.4,-1.4,-.4,.6,1.6,2.4]){
    const wheel=new THREE.Mesh(ball,steel);
    wheel.position.set(xx,.45,z*.92);wheel.scale.set(.45,.45,.22);root.add(wheel);
   }
  }
  const turret=new THREE.Group();turret.position.set(0,1.65,0);root.add(turret);
  box(turret,hullMat,-.3,.55,0,advanced?3.4:2.9,.95,2.4);
  box(turret,hullMat,-1.8,.55,0,1.2,.85,2.1);
  box(turret,steel,-.4,1.15,.55,.65,.32,.65); // cupola
  const cannonGroup=new THREE.Group();cannonGroup.position.set(.9,.55,0);turret.add(cannonGroup);
  box(cannonGroup,steel,.5,0,0,1.0,.72,.75); // mantlet
  const barrel=new THREE.Mesh(cube,steel);barrel.position.set(3.2,0,0);barrel.scale.set(4.6,.26,.26);cannonGroup.add(barrel);
  const evac=new THREE.Mesh(ball,steel);evac.position.set(2.8,0,0);evac.scale.set(.65,.38,.38);cannonGroup.add(evac);
  const muzzle=new THREE.Mesh(cube,steel);muzzle.position.set(5.5,0,0);muzzle.scale.set(.45,.36,.36);cannonGroup.add(muzzle);

  const beacon=new THREE.Mesh(ball,warning);beacon.scale.set(.25,.25,.25);beacon.position.set(-.4,1.45,-.55);turret.add(beacon);
  const searchlight=new THREE.Mesh(searchlightGeo,searchlightMat);
  searchlight.name='military-searchlight-beam';searchlight.position.set(.5,1.15,-.65);
  searchlight.frustumCulled=false;searchlight.renderOrder=2;
  searchlight.scale.set(1,12,1);turret.add(searchlight);
  const searchLens=new THREE.Mesh(ball,searchlightLensMat);
  searchLens.scale.setScalar(.20);searchLens.position.set(.5,1.15,-.65);turret.add(searchLens);
  scene.add(root);
  vehicles.push({root,hull,turret,cannonGroup,launcher:turret,beacon,advanced,hp:advanced?7:5,cooldown:advanced?2.8:2.1,flash:0,
   patrolDir:Math.random()<.5?1:-1,speed:4.2+Math.random()*2.8,
   gasTime:0,searchlight,searchDir:new THREE.Vector3(0,1,0),searchTarget:new THREE.Vector3(0,1,0),searchClock:0});
  return root;
 }
 function updateSearchlight(v,dt){
  v.searchClock+=Math.min(.1,Math.max(0,dt));
  const origin=v.root.position.clone().add(v.searchlight.position);
  const desired=dragon.position.clone().sub(origin);
  // Deliberate slow sweeping offset: government pursuit tracks imperfectly.
  desired.x+=Math.sin(v.searchClock*.69+v.root.position.x*.14)*1.1;
  desired.y+=Math.cos(v.searchClock*.52+v.root.position.x*.11)*.48;
  const tracked=slewSearchlightDirection(v.searchDir,desired,dt,v.advanced?2.2:1.7);
  v.searchDir.set(tracked.x,tracked.y,tracked.z);
  v.searchTarget.copy(desired).normalize();
  v.searchlight.quaternion.setFromUnitVectors(searchlightUp,v.searchDir);
  v.searchlight.scale.y=Math.min(70,Math.max(5,desired.length()));
 }
 function deflectWind(origin,direction,dt){
  let affected=0,homingDisrupted=0;
  if(!origin||!direction||dt<=0)return {affected,homingDisrupted};
  for(const rocket of missiles){
   const effect=militaryWindImpulse(rocket.mesh.position,origin,direction,dt);
   if(!effect)continue;
   rocket.vel.x+=effect.x;rocket.vel.y+=effect.y;rocket.vel.z+=effect.z;
   rocket.disruptTime=Math.max(rocket.disruptTime||0,effect.disrupt);
   affected++;
   if(rocket.homing)homingDisrupted++;
  }
  return {affected,homingDisrupted};
 }
 function fire(v){const origin=v.root.position.clone().add(new THREE.Vector3(0,2.6,0));
  const aim=dragon.position.clone().sub(origin).normalize();
  const mesh=new THREE.Mesh(cone,rocketMat);mesh.scale.set(.35,1.4,.35);mesh.position.copy(origin);scene.add(mesh);
  missiles.push({mesh,vel:aim.multiplyScalar(v.advanced?26:32),homing:v.advanced,life:7,age:0,smoke:0,disruptTime:0,ballistic:true});
  v.flash=.28;
 }
 function destroy(v){onBlast(v.root.position.x,2.2,v.root.position.z,4);scene.remove(v.root);vehicles.splice(vehicles.indexOf(v),1);spawnClock=Math.min(spawnClock,5);}
 function update(dt,meteors,playerShots){const wave=getWave();collateralNotice=Math.max(0,collateralNotice-dt);
  if(wave<11||wave>14){if(enabled)reset();return;}
  if(!enabled){enabled=true;deploy(-25);deploy(25);onMessage('MILITARY OCCUPATION — MAIN BATTLE TANKS DEPLOYED');}
  if(wave>=13&&!vehicles.some(v=>v.advanced)){if(!vehicles.some(v=>v.root.position.x===0)) {deploy(0,true);onMessage('WARNING: ADVANCED RADAR TANK DEPLOYED');}}
  spawnClock-=dt;
  if(spawnClock<=0){for(const x of [-25,25])if(!vehicles.some(v=>Math.abs(v.root.position.x-x)<1))deploy(x);spawnClock=9;}
  for(let i=vehicles.length-1;i>=0;i--){const v=vehicles[i];v.cooldown-=dt;v.flash=Math.max(0,v.flash-dt);v.beacon.visible=v.flash>0;
   // Tanks actively roll up and down Broad Street
   if(v.gasTime<=0){
    v.root.position.x+=v.patrolDir*v.speed*dt;
    if(v.root.position.x>65){v.root.position.x=65;v.patrolDir=-1;}
    else if(v.root.position.x<-65){v.root.position.x=-65;v.patrolDir=1;}
   }
   const dx=dragon.position.x-v.root.position.x,dz=dragon.position.z-v.root.position.z,dy=dragon.position.y-2.2;
   if(v.turret)v.turret.rotation.y=Math.atan2(-dz,dx);
   if(v.cannonGroup)v.cannonGroup.rotation.z=Math.atan2(dy,Math.sqrt(dx*dx+dz*dz));
   v.launcher.rotation.z=Math.atan2(dy,dx)*.45;
   v.gasTime=Math.max(0,v.gasTime-dt);
   v.hull.material=v.gasTime>0?gasHullMat:hullMat;
   v.searchlight.visible=v.gasTime<=0;
   if(v.gasTime<=0)updateSearchlight(v,dt);
   if(v.gasTime<=0&&v.cooldown<=0){fire(v);v.cooldown=(v.advanced?3.2:4.6)*(0.85+Math.random()*.4);}
   for(const meteor of meteors){if(meteor.mesh.position.distanceTo(v.root.position)<meteor.size+2.5){meteor.hp=0;onMeteorHit(meteor);destroy(v);break;}}
   if(!vehicles.includes(v))continue;
   for(const shot of playerShots){if(shot.hostile||shot.fireTarget||shot.life<=0)continue;if(shot.mesh.position.distanceTo(v.root.position)<3.3){shot.life=0;v.hp--;if(v.hp<=0){destroy(v);break;}}}
  }
  updateExhaust(dt);for(let i=missiles.length-1;i>=0;i--){const m=missiles[i];m.life-=dt;m.age=(m.age||0)+dt;smokeTrail(m.mesh.position,dt);
   if(m.disruptTime>0)m.disruptTime=Math.max(0,m.disruptTime-dt);
   else if(m.homing){const wanted=dragon.position.clone().sub(m.mesh.position).normalize().multiplyScalar(21);m.vel.lerp(wanted,Math.min(1,dt*.9));}
   if(m.ballistic){m.vel.y-=14.0*dt;} // realistic ballistic gravity drop
   const previousPosition=m.mesh.position.clone();
   m.mesh.position.addScaledVector(m.vel,dt);m.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),m.vel.clone().normalize());
   let hit=false;
   // Keep established shot > meteor > dragon > collateral priority, but sweep
   // each target so low frame rates cannot let a rocket tunnel through it.
   const shotHit=nearestSegmentSphereHit(previousPosition,m.mesh.position,playerShots,shotCenter,shotRadius,shotEligible);
   if(shotHit){const {target:shot,contact}=shotHit;
    m.mesh.position.set(contact.x,contact.y,contact.z);shot.life=0;hit=true;}
   if(!hit){const meteorHit=nearestSegmentSphereHit(previousPosition,m.mesh.position,meteors,meteorCenter,meteorRadius);
    if(meteorHit){const {target:meteor,contact}=meteorHit;
     m.mesh.position.set(contact.x,contact.y,contact.z);meteor.hp=0;onMeteorHit(meteor);hit=true;}}
   if(!hit){const contact=segmentSphereEntry(previousPosition,m.mesh.position,dragon.position,2.2);
    if(contact){m.mesh.position.set(contact.x,contact.y,contact.z);onDragonHit(m.homing?'HOMING MISSILE':'MILITARY MISSILE');hit=true;}}
   // When Paulo evades, a military rocket can strike the neighborhood below.
   let collateral=false;
   if(!hit&&typeof onCollateral==='function'){
    const impact=detectMilitaryCollateral(m.mesh.position,m.age,getCollateralStructures?.()||[],previousPosition);
    if(impact){m.mesh.position.set(impact.x,impact.y,impact.z);onCollateral(impact);collateral=true;hit=true;
     if(collateralNotice<=0){onMessage(impact.type==='structure'?'MILITARY ROCKET HITS A BUILDING!':'MILITARY STRIKE CRATERS BROAD STREET!');collateralNotice=3.4;}
    }
   }
   if(hit){if(!collateral)onBlast(m.mesh.position.x,m.mesh.position.y,m.mesh.position.z,1.5);m.life=0;}
   if(m.life<=0||Math.abs(m.mesh.position.x)>110||m.mesh.position.y<0){scene.remove(m.mesh);missiles.splice(i,1);}
  }
 }
 function reset(){clearExhaust();for(const v of vehicles)scene.remove(v.root);for(const m of missiles)scene.remove(m.mesh);vehicles.length=0;missiles.length=0;spawnClock=0;collateralNotice=0;enabled=false;}
 function suppress(seconds=10){for(const v of vehicles)v.cooldown=Math.max(v.cooldown,seconds);for(const m of missiles)scene.remove(m.mesh);missiles.length=0;}
 // A production-model rocket, staged only by the ?qa=1 bridge; the normal
 // gameplay creates identical objects in fire(). This never awards player score.
 function stageWindRocket(position){
  const mesh=new THREE.Mesh(cone,rocketMat);mesh.scale.set(.35,1.4,.35);mesh.position.copy(position);scene.add(mesh);
  const rocket={mesh,vel:new THREE.Vector3(-11,0,0),homing:true,life:7,age:1,smoke:0,disruptTime:0};
  missiles.push(rocket);return rocket;
 }
 function windRocketStates(){return missiles.map(m=>({position:m.mesh.position.toArray(),velocity:m.vel.toArray(),disruptTime:m.disruptTime||0,homing:m.homing}));}
 function applyGas(point,radius=5.6,seconds=7){
  let affected=0;
  for(const v of vehicles){
   // Gas settles across the street lanes, not just the dragon's flight plane.
   if(point.y<7.2&&Math.abs(v.root.position.x-point.x)<radius&&Math.abs(v.root.position.z-point.z)<22){
    v.gasTime=Math.max(v.gasTime,seconds);v.cooldown=Math.max(v.cooldown,seconds);affected++;
   }
  }
  return affected;
 }
 return {update,reset,suppress,applyGas,gasStates:()=>vehicles.map(v=>({x:v.root.position.x,z:v.root.position.z,gasTime:v.gasTime,cooldown:v.cooldown})),deflectWind,stageWindRocket,windRocketStates,counts:()=>({batteries:vehicles.length,homingBatteries:vehicles.filter(v=>v.advanced).length,missiles:missiles.length,searchlights:vehicles.filter(v=>v.searchlight.visible).length}),
  footprints:()=>vehicles.map(({root,hull})=>{
   root.updateWorldMatrix(true,false);
   const {min,max}=new THREE.Box3().setFromObject(hull);
   return {minX:min.x,maxX:max.x,minZ:min.z,maxZ:max.z};
  }),
  searchlightStates:()=>vehicles.map(v=>({x:v.root.position.x,visible:v.searchlight.visible,length:+v.searchlight.scale.y.toFixed(2),
   direction:v.searchDir.toArray(),targetDot:+v.searchDir.dot(v.searchTarget).toFixed(4)}))};
}
