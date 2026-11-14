
import * as THREE from 'three';
// Chapter 4: realistic military attack jet squadron (F-16 / F-22 style).
// Tactical formations (lead + wingman) circle from background (z = -120) to foreground (z = 10) in 3D strafing sweeps.
export function createFinalSquadron(scene) {
 const root=new THREE.Group();scene.add(root);
 const hullMat=new THREE.MeshStandardMaterial({color:0x4d5b68,metalness:.62,roughness:.38});
 const darkMat=new THREE.MeshStandardMaterial({color:0x2c353f,metalness:.5,roughness:.5});
 const canopyMat=new THREE.MeshStandardMaterial({color:0xb89548,metalness:.85,roughness:.15,transparent:true,opacity:.78});
 const afterburnerMat=new THREE.MeshBasicMaterial({color:0xff7722});
 const burnerCoreMat=new THREE.MeshBasicMaterial({color:0xffffff});
 const missileMat=new THREE.MeshStandardMaterial({color:0xdfe4e8,metalness:.4,roughness:.4});
 const missileFlameMat=new THREE.MeshBasicMaterial({color:0xffaa33});

 const box=new THREE.BoxGeometry(1,1,1);
 const cone=new THREE.ConeGeometry(1,1,8);
 const cyl=new THREE.CylinderGeometry(1,1,1,8);
 const sphere=new THREE.SphereGeometry(1,6,5);

 const exhaustGeo=new THREE.SphereGeometry(.42,6,5);
 const exhaustMat=new THREE.MeshBasicMaterial({color:0xbcc3c9,transparent:true,opacity:.38,depthWrite:false});
 const exhaust=[];
 function smokeTrail(position,dt,intense=false){
  if(Math.random()<Math.min(1,dt*(intense?42:24))&&exhaust.length<160){
   const puff=new THREE.Mesh(exhaustGeo,exhaustMat.clone());puff.position.copy(position);
   puff.scale.setScalar((intense?.75:.55)+Math.random()*.8);scene.add(puff);
   exhaust.push({puff,life:1.1+Math.random()*.7,ttl:1.8});
  }
 }
 function updateExhaust(dt){
  for(let i=exhaust.length-1;i>=0;i--){
   const p=exhaust[i];p.life-=dt;p.puff.position.y+=dt*.7;p.puff.scale.multiplyScalar(1+dt*.95);
   p.puff.material.opacity=Math.max(0,p.life/p.ttl)*.35;
   if(p.life<=0){scene.remove(p.puff);p.puff.material.dispose();exhaust.splice(i,1);}
  }
 }
 function clearExhaust(){for(const p of exhaust){scene.remove(p.puff);p.puff.material.dispose();}exhaust.length=0;}

 const fighters=[],missiles=[];
 let clock=0,spawn=0,enabled=false;

 function bx(parent,mat,x,y,z,w,h,d){const m=new THREE.Mesh(box,mat);m.position.set(x,y,z);m.scale.set(w,h,d);parent.add(m);return m;}

 function buildFighterModel(g){
  // F-22 / F-16 stealth delta-wing fighter airframe
  // Central fuselage
  bx(g,hullMat,0,0,0,5.8,.65,1.4);
  // Nose radome cone
  const nose=new THREE.Mesh(cone,hullMat);
  nose.scale.set(.70,2.6,.55);
  nose.rotation.z=-Math.PI/2;
  nose.position.set(4.0,0,0);
  g.add(nose);
  // Golden bubble cockpit canopy
  const canopy=bx(g,canopyMat,1.2,.42,0,2.2,.55,.62);
  // Cropped swept delta wings
  const wingLeft=bx(g,darkMat,-.5,-.05,-2.2,3.6,.10,3.2);
  wingLeft.rotation.y=-0.22;
  const wingRight=bx(g,darkMat,-.5,-.05,2.2,3.6,.10,3.2);
  wingRight.rotation.y=0.22;
  // Twin canted vertical stabilizers (tilted 22 degrees outward)
  const finLeft=bx(g,darkMat,-2.1,.85,-.85,1.6,1.4,.10);
  finLeft.rotation.z=-.18;finLeft.rotation.x=-.38;
  const finRight=bx(g,darkMat,-2.1,.85,.85,1.6,1.4,.10);
  finRight.rotation.z=-.18;finRight.rotation.x=.38;
  // Horizontal tailplanes
  bx(g,darkMat,-2.4,-.02,-1.4,1.8,.08,1.2);
  bx(g,darkMat,-2.4,-.02,1.4,1.8,.08,1.2);
  // Wingtip missile rails & Sidewinder missiles
  bx(g,missileMat,-.2,-.05,-3.8,1.8,.15,.15);
  bx(g,missileMat,-.2,-.05,3.8,1.8,.15,.15);
  // Twin afterburner exhaust nozzles
  for(const z of [-.38,.38]){
   const nozzle=new THREE.Mesh(cyl,darkMat);
   nozzle.scale.set(.32,.65,.32);
   nozzle.rotation.z=Math.PI/2;
   nozzle.position.set(-3.1,0,z);
   g.add(nozzle);
   const flame=new THREE.Mesh(cone,afterburnerMat);
   flame.scale.set(.28,1.6,.28);
   flame.rotation.z=Math.PI/2;
   flame.position.set(-4.0,0,z);
   g.add(flame);
   const core=new THREE.Mesh(cone,burnerCoreMat);
   core.scale.set(.12,.8,.12);
   core.rotation.z=Math.PI/2;
   core.position.set(-3.6,0,z);
   g.add(core);
  }
 }

 function spawnFormation(side){
  // Spawn a 2-ship tactical echelon formation from deep background
  const formationId=Date.now()+Math.random();
  const leaderStartX=side*190;
  const leaderStartZ=-240;
  const leaderStartY=62;

  // Lead Jet (high altitude pattern, deep background origin)
  const g1=new THREE.Group();buildFighterModel(g1);
  g1.position.set(leaderStartX,leaderStartY,leaderStartZ);
  root.add(g1);
  fighters.push({g:g1,side,formationId,isLead:true,progress:0,speed:.085,startX:leaderStartX,fire:1.8+Math.random()*1.0,volleyRemaining:0,volleyTimer:0,life:36});

  // Wingman Jet (trailing echelon right/left in deep background)
  const g2=new THREE.Group();buildFighterModel(g2);
  const wingOffset=new THREE.Vector3(-side*22,4.0,-26);
  g2.position.set(leaderStartX+wingOffset.x,leaderStartY+wingOffset.y,leaderStartZ+wingOffset.z);
  root.add(g2);
  fighters.push({g:g2,side,formationId,isLead:false,wingOffset,progress:-0.06,speed:.085,startX:leaderStartX,fire:2.6+Math.random()*1.0,volleyRemaining:0,volleyTimer:0,life:36});
 }

 function fireMissile(f,dragon){
  const mesh=new THREE.Group();
  bx(mesh,missileMat,0,0,0,1.8,.24,.24);
  const nose=new THREE.Mesh(cone,missileMat);nose.scale.set(.20,.7,.20);nose.rotation.z=-Math.PI/2;nose.position.set(1.0,0,0);mesh.add(nose);
  for(const ang of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
   const fin=bx(mesh,darkMat,-.7,Math.cos(ang)*.28,Math.sin(ang)*.28,.52,.32,.04);fin.rotation.x=ang;
  }
  // Fiery rocket booster cone with luminous core
  const booster=new THREE.Mesh(cone,missileFlameMat);booster.scale.set(.22,1.2,.22);booster.rotation.z=Math.PI/2;booster.position.set(-1.3,0,0);mesh.add(booster);
  const core=new THREE.Mesh(cone,burnerCoreMat);core.scale.set(.12,.7,.12);core.rotation.z=Math.PI/2;core.position.set(-1.0,0,0);mesh.add(core);
  mesh.position.copy(f.g.position);
  root.add(mesh);
  const targetAim=dragon.position.clone().add(new THREE.Vector3((Math.random()-.5)*3,(Math.random()-.5)*2,0));
  const vel=targetAim.sub(mesh.position).normalize().multiplyScalar(34);
  missiles.push({mesh,vel,life:6.5,age:0});
 }

 function clear(){
  clearExhaust();
  for(const f of fighters)root.remove(f.g);
  for(const m of missiles)root.remove(m.mesh);
  fighters.length=0;missiles.length=0;clock=0;spawn=0;enabled=false;root.visible=false;
 }

 function start(){clear();enabled=true;root.visible=true;spawn=.4;}

 function update(dt,dragon,onHit,onExplosion){
  if(!enabled)return;
  clock+=dt;spawn-=dt;
  if(spawn<=0&&fighters.length<4){
   spawnFormation(Math.random()<.5?-1:1);
   spawn=7.5+Math.random()*3;
  }
  for(let i=fighters.length-1;i>=0;i--){
   const f=fighters[i];
   f.life-=dt;f.fire-=dt;
   f.progress+=dt*f.speed;

   // Volley firing logic: launches a volley of 2-3 missiles in rapid succession
   if(f.volleyRemaining>0){
    f.volleyTimer-=dt;
    if(f.volleyTimer<=0){
     fireMissile(f,dragon);
     f.volleyRemaining--;
     f.volleyTimer=.24;
    }
   } else if(f.fire<=0&&f.g.position.z>-60&&Math.abs(f.g.position.x)<105){
    f.volleyRemaining=3;
    f.volleyTimer=0;
    f.fire=7.0+Math.random()*2.5;
   }

   // 3D circling combat trajectory:
   // Originates in deep background (z = -240), sweeps high above buildings (y = 52 to 72),
   // delivers volleys of missiles, then banks in a climbing arc circling back into the deep background.
   const cycle=f.progress;
   let sweepX,sweepY,sweepZ;
   if(cycle<1.0){
    // Ingress sweep from deep background (z = -240) to foreground attack zone (z = -20)
    const t=cycle;
    sweepX=f.startX-f.side*t*280;
    sweepZ=-240+Math.sin(t*Math.PI*0.5)*220;
    // High altitude pattern well above building rooftops (y = 52 to 66)
    sweepY=64-Math.sin(t*Math.PI*0.5)*12+Math.sin(clock*3+i)*.7;
   }else if(cycle<2.0){
    // Climbing break & circling turn back to deep background (z = -240)
    const t=cycle-1.0;
    sweepX=(f.startX-f.side*280)+f.side*Math.sin(t*Math.PI)*120;
    sweepZ=-20-Math.sin(t*Math.PI*0.5)*220;
    sweepY=52+Math.sin(t*Math.PI*0.5)*20; // Climbs to 72 altitude
   }else{
    // Circuit completed: re-loop from deep background if still active
    f.progress=0;
    f.side=-f.side;
    f.startX=f.side*190;
    f.fire=1.5+Math.random();
    continue;
   }

   const prevPos=f.g.position.clone();
   f.g.position.set(sweepX,sweepY,sweepZ);
   const moveDir=f.g.position.clone().sub(prevPos);

   if(moveDir.lengthSq()>0.001){
    // Point aircraft along flight vector with tactical bank angle
    const heading=Math.atan2(-moveDir.z,moveDir.x);
    f.g.rotation.y=heading;
    const pitch=Math.atan2(moveDir.y,Math.sqrt(moveDir.x*moveDir.x+moveDir.z*moveDir.z));
    f.g.rotation.z=-pitch;
    // Hard tactical bank roll into turn
    const bankTurn=Math.sin(cycle*Math.PI)*.72*(f.side);
    f.g.rotation.x=bankTurn;
   }

   // Afterburner smoke and fire trail
   smokeTrail(f.g.position.clone().add(new THREE.Vector3(-f.side*2.5,0,-1)),dt,true);

   if(f.life<=0&&f.g.position.z<-180){
    root.remove(f.g);fighters.splice(i,1);
   }
  }

  updateExhaust(dt);
  for(let i=missiles.length-1;i>=0;i--){
   const m=missiles[i];
   m.life-=dt;m.age=(m.age||0)+dt;
   smokeTrail(m.mesh.position,dt,true);
   m.mesh.position.addScaledVector(m.vel,dt);
   m.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(1,0,0),m.vel.clone().normalize());
   if(m.mesh.position.distanceTo(dragon.position)<2.6){onHit();m.life=0;}
   if(m.life<=0||Math.abs(m.mesh.position.x)>320||m.mesh.position.y<-2){
    root.remove(m.mesh);missiles.splice(i,1);
   }
  }
 }

 function intercept(position,radius,onExplosion){
  let count=0;
  for(let i=missiles.length-1;i>=0;i--){
   if(missiles[i].mesh.position.distanceTo(position)<radius){
    onExplosion?.(missiles[i].mesh.position);root.remove(missiles[i].mesh);missiles.splice(i,1);count++;
   }
  }
  for(let i=fighters.length-1;i>=0;i--){
   if(fighters[i].g.position.distanceTo(position)<radius+2){
    onExplosion?.(fighters[i].g.position);root.remove(fighters[i].g);fighters.splice(i,1);count++;
   }
  }
  return count;
 }

 return {start,clear,update,intercept,stats:()=>({fighters:fighters.length,missiles:missiles.length,active:enabled})};
}
