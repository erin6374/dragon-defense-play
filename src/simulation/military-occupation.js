// Campaign Preview 4: chapter-three military occupation. All meshes and projectiles are owned here.
import * as THREE from 'three';
import {detectMilitaryCollateral,segmentSphereEntry} from './military-collateral.js';
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
 const steel=new THREE.MeshStandardMaterial({color:0x29342e,roughness:.7,metalness:.28});
 const warning=new THREE.MeshBasicMaterial({color:0xffb04a});
 const rocketMat=new THREE.MeshStandardMaterial({color:0xb5bab0,metalness:.45,roughness:.45});
 const cube=new THREE.BoxGeometry(1,1,1),ball=new THREE.SphereGeometry(1,8,6),cone=new THREE.ConeGeometry(1,1,8);
 let spawnClock=0,enabled=false,collateralNotice=0;
 function box(root,mat,x,y,z,w,h,d){const mesh=new THREE.Mesh(cube,mat);mesh.position.set(x,y,z);mesh.scale.set(w,h,d);root.add(mesh);return mesh;}
 function deploy(x,advanced=false){
  const root=new THREE.Group();root.position.set(x,0,advanced?3.4:3.1);
  box(root,hullMat,0,1.1,0,advanced?6:5.4,1.5,2.7);
  box(root,steel,0,2.1,0,3.1,.8,2.2);
  for(const xx of [-1.75,1.75])for(const zz of [-1,1]){
   const wheel=new THREE.Mesh(ball,steel);wheel.position.set(xx,.65,zz);wheel.scale.set(.72,.72,.28);root.add(wheel);
  }
  const launcher=new THREE.Group();launcher.position.set(0,2.8,0);root.add(launcher);
  box(launcher,steel,0,0,0,advanced?2.7:1.9,.65,1.35);
  for(const z of [-.48,.48])box(launcher,rocketMat,0,.15,z,advanced?2.4:1.7,.23,.25);
  const beacon=new THREE.Mesh(ball,warning);beacon.scale.set(.25,.25,.25);beacon.position.set(0,3.1,0);root.add(beacon);
  scene.add(root);vehicles.push({root,launcher,beacon,advanced,hp:advanced?6:4,cooldown:advanced?3.2:2.3,flash:0});
  return root;
 }
 function fire(v){const origin=v.root.position.clone().add(new THREE.Vector3(0,3.1,0));
  const aim=dragon.position.clone().sub(origin).normalize();
  const mesh=new THREE.Mesh(cone,rocketMat);mesh.scale.set(.35,1.4,.35);mesh.position.copy(origin);scene.add(mesh);
  missiles.push({mesh,vel:aim.multiplyScalar(v.advanced?18:24),homing:v.advanced,life:7,age:0,smoke:0});
  v.flash=.28;
 }
 function destroy(v){onBlast(v.root.position.x,2.2,v.root.position.z,4);scene.remove(v.root);vehicles.splice(vehicles.indexOf(v),1);spawnClock=Math.min(spawnClock,5);}
 function update(dt,meteors,playerShots){const wave=getWave();collateralNotice=Math.max(0,collateralNotice-dt);
  if(wave<11||wave>14){if(enabled)reset();return;}
  if(!enabled){enabled=true;deploy(-25);deploy(25);onMessage('MILITARY OCCUPATION — MISSILE BATTERIES DEPLOYED');}
  if(wave>=13&&!vehicles.some(v=>v.advanced)){if(!vehicles.some(v=>v.root.position.x===0)) {deploy(0,true);onMessage('WARNING: HOMING MISSILE BATTERY DEPLOYED');}}
  spawnClock-=dt;
  if(spawnClock<=0){for(const x of [-25,25])if(!vehicles.some(v=>Math.abs(v.root.position.x-x)<1))deploy(x);spawnClock=9;}
  for(let i=vehicles.length-1;i>=0;i--){const v=vehicles[i];v.cooldown-=dt;v.flash=Math.max(0,v.flash-dt);v.beacon.visible=v.flash>0;
   const dx=dragon.position.x-v.root.position.x,dy=dragon.position.y-3;
   v.launcher.rotation.z=Math.atan2(dy,dx)*.45;
   if(v.cooldown<=0){fire(v);v.cooldown=(v.advanced?3.7:5.3)*(0.85+Math.random()*.4);}
   for(const meteor of meteors){if(meteor.mesh.position.distanceTo(v.root.position)<meteor.size+2.5){meteor.hp=0;onMeteorHit(meteor);destroy(v);break;}}
   if(!vehicles.includes(v))continue;
   for(const shot of playerShots){if(shot.hostile||shot.fireTarget||shot.life<=0)continue;if(shot.mesh.position.distanceTo(v.root.position)<3.3){shot.life=0;v.hp--;if(v.hp<=0){destroy(v);break;}}}
  }
  updateExhaust(dt);for(let i=missiles.length-1;i>=0;i--){const m=missiles[i];m.life-=dt;m.age=(m.age||0)+dt;smokeTrail(m.mesh.position,dt);
   if(m.homing){const wanted=dragon.position.clone().sub(m.mesh.position).normalize().multiplyScalar(21);m.vel.lerp(wanted,Math.min(1,dt*.9));}
   const previousPosition=m.mesh.position.clone();
   m.mesh.position.addScaledVector(m.vel,dt);m.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),m.vel.clone().normalize());
   let hit=false;
   // Keep established shot > meteor > dragon > collateral priority, but sweep
   // each target so low frame rates cannot let a rocket tunnel through it.
   for(const shot of playerShots){if(shot.hostile||shot.fireTarget||shot.life<=0)continue;
    const contact=segmentSphereEntry(previousPosition,m.mesh.position,shot.mesh.position,1.8);
    if(contact){m.mesh.position.set(contact.x,contact.y,contact.z);shot.life=0;hit=true;break;}}
   if(!hit)for(const meteor of meteors){
    const contact=segmentSphereEntry(previousPosition,m.mesh.position,meteor.mesh.position,meteor.size+1);
    if(contact){m.mesh.position.set(contact.x,contact.y,contact.z);meteor.hp=0;onMeteorHit(meteor);hit=true;break;}}
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
 return {update,reset,suppress,counts:()=>({batteries:vehicles.length,homingBatteries:vehicles.filter(v=>v.advanced).length,missiles:missiles.length})};
}
