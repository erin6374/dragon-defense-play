
import * as THREE from 'three';
// Chapter 4: reusable low-draw-call fighter squadron. All meshes share geometry/materials.
export function createFinalSquadron(scene) {
 const root=new THREE.Group();scene.add(root);
 const hull=new THREE.MeshStandardMaterial({color:0x576679,metalness:.55,roughness:.48});
 const wing=new THREE.MeshStandardMaterial({color:0x343e50,metalness:.5,roughness:.55});
 const glow=new THREE.MeshBasicMaterial({color:0xffa753});
 const missileMat=new THREE.MeshBasicMaterial({color:0xffd6a0});
 const bodyGeo=new THREE.ConeGeometry(.65,4.3,6);
 const wingGeo=new THREE.BoxGeometry(6,.14,1.5);
 const tailGeo=new THREE.BoxGeometry(2.1,.65,.12);
 const nozzleGeo=new THREE.SphereGeometry(.23,6,5);
 const missileGeo=new THREE.SphereGeometry(.36,6,5);
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
 const fighters=[],missiles=[];
 let clock=0,spawn=0,enabled=false;
 function makeFighter(side) {
  const g=new THREE.Group(),body=new THREE.Mesh(bodyGeo,hull);
  body.rotation.z=-Math.PI/2;g.add(body);
  const w=new THREE.Mesh(wingGeo,wing);g.add(w);
  const t=new THREE.Mesh(tailGeo,wing);t.position.x=-1.5;g.add(t);
  const e=new THREE.Mesh(nozzleGeo,glow);e.position.x=-2.2;g.add(e);
  g.position.set(side*105,17+Math.random()*24,-4-Math.random()*13);
  g.scale.x=side>0?-1:1;root.add(g);
  fighters.push({g,side,life:18,fire:1.1+Math.random()*1.6});
 }
 function fire(f,dragon) {
  const mesh=new THREE.Mesh(missileGeo,missileMat);
  mesh.position.copy(f.g.position);root.add(mesh);
  const vel=dragon.position.clone().sub(mesh.position).normalize().multiplyScalar(25);
  missiles.push({mesh,vel,life:5});
 }
 function clear() {clearExhaust();
  for(const f of fighters)root.remove(f.g);
  for(const m of missiles)root.remove(m.mesh);
  fighters.length=0;missiles.length=0;clock=0;spawn=0;enabled=false;root.visible=false;
 }
 function start(){clear();enabled=true;root.visible=true;spawn=.4;}
 function update(dt,dragon,onHit,onExplosion) {
  if(!enabled)return;
  clock+=dt;spawn-=dt;
  if(spawn<=0&&fighters.length<4){makeFighter(Math.random()<.5?-1:1);spawn=5+Math.random()*2;}
  for(let i=fighters.length-1;i>=0;i--){
   const f=fighters[i];f.g.position.x-=f.side*dt*15;
   f.g.position.y+=Math.sin(clock*2+i)*dt*.8;f.life-=dt;f.fire-=dt;
   if(f.fire<=0){fire(f,dragon);f.fire=2.7+Math.random()*1.3;}
   if(f.life<=0||Math.abs(f.g.position.x)>118&&f.life<11){root.remove(f.g);fighters.splice(i,1);}
  }
  updateExhaust(dt);for(let i=missiles.length-1;i>=0;i--){
   const m=missiles[i];smokeTrail(m.mesh.position,dt);m.mesh.position.addScaledVector(m.vel,dt);m.life-=dt;
   if(m.mesh.position.distanceTo(dragon.position)<2.4){onHit();m.life=0;}
   if(m.life<=0){root.remove(m.mesh);missiles.splice(i,1);}
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
