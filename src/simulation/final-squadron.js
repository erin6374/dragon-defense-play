
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
  // Spawn a 2-ship tactical echelon formation
  const formationId=Date.now()+Math.random();
  const leaderStartX=side*160;
  const leaderStartZ=-120;
  const leaderStartY=42;

  // Lead Jet
  const g1=new THREE.Group();buildFighterModel(g1);
  g1.position.set(leaderStartX,leaderStartY,leaderStartZ);
  root.add(g1);
  fighters.push({g:g1,side,formationId,isLead:true,progress:0,speed:.115,startX:leaderStartX,fire:1.8+Math.random()*1.2,life:22});

  // Wingman Jet (trailing echelon right/left)
  const g2=new THREE.Group();buildFighterModel(g2);
  const wingOffset=new THREE.Vector3(-side*18,3.5,-16);
  g2.position.set(leaderStartX+wingOffset.x,leaderStartY+wingOffset.y,leaderStartZ+wingOffset.z);
  root.add(g2);
  fighters.push({g:g2,side,formationId,isLead:false,wingOffset,progress:-0.05,speed:.115,startX:leaderStartX,fire:2.6+Math.random()*1.2,life:22});
 }

 function fireMissile(f,dragon){
  const mesh=new THREE.Group();
  bx(mesh,missileMat,0,0,0,1.6,.22,.22);
  const nose=new THREE.Mesh(cone,missileMat);nose.scale.set(.18,.6,.18);nose.rotation.z=-Math.PI/2;nose.position.set(.9,0,0);mesh.add(nose);
  for(const ang of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
   const fin=bx(mesh,darkMat,-.6,Math.cos(ang)*.25,Math.sin(ang)*.25,.45,.28,.04);fin.rotation.x=ang;
  }
  const booster=new THREE.Mesh(cone,missileFlameMat);booster.scale.set(.16,.85,.16);booster.rotation.z=Math.PI/2;booster.position.set(-1.1,0,0);mesh.add(booster);
  mesh.position.copy(f.g.position);
  root.add(mesh);
  const vel=dragon.position.clone().sub(mesh.position).normalize().multiplyScalar(32);
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
   spawn=6.5+Math.random()*3;
  }
  for(let i=fighters.length-1;i>=0;i--){
   const f=fighters[i];
   f.life-=dt;f.fire-=dt;
   f.progress+=dt*f.speed;
   const t=Math.min(1.2,Math.max(-0.1,f.progress));

   // 3D circling combat trajectory:
   // Enters from deep background (z = -120, y = 42), banks into foreground (z = 8, y = 18), sweeps Broad St, then climbs back to z = -110
   const sweepX=f.startX-f.side*t*280;
   // Elliptical depth curve
   const sweepZ=-120+Math.sin(Math.min(1,t)*Math.PI)*132;
   const sweepY=42-Math.sin(Math.min(1,t)*Math.PI)*24+Math.sin(clock*3+i)*.7;

   const prevPos=f.g.position.clone();
   f.g.position.set(sweepX,sweepY,sweepZ);
   const moveDir=f.g.position.clone().sub(prevPos);

   if(moveDir.lengthSq()>0.001){
    // Point aircraft along flight vector with tactical bank angle
    const heading=Math.atan2(-moveDir.z,moveDir.x);
    f.g.rotation.y=heading;
    const pitch=Math.atan2(moveDir.y,Math.sqrt(moveDir.x*moveDir.x+moveDir.z*moveDir.z));
    f.g.rotation.z=-pitch;
    // Hard bank roll into turn
    const bankTurn=Math.sin(t*Math.PI*2)*.65*(f.side);
    f.g.rotation.x=bankTurn;
   }

   // Missile firing at apex of strafing pass
   if(f.fire<=0&&f.g.position.z>-30&&Math.abs(f.g.position.x)<90){
    fireMissile(f,dragon);
    f.fire=5.0+Math.random()*2;
   }

   // Afterburner smoke trail
   smokeTrail(f.g.position.clone().add(new THREE.Vector3(-f.side*2.5,0,-1)),dt,true);

   if(f.life<=0||(t>1.05&&f.g.position.z<-95)){
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
   if(m.life<=0||Math.abs(m.mesh.position.x)>260||m.mesh.position.y<-2){
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
