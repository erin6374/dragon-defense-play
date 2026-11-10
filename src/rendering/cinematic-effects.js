export function createCinematicEffects(T,scene,camera,bank){
 const dummy=new T.Object3D(),puffs=[],rings=[];let clock=0;
 const windOrigin=new T.Vector3(),windDirection=new T.Vector3(1,0,0);
 let windStrength=0;
 function pool(capacity,material,geometry=new T.PlaneGeometry(1,1)){
  const m=new T.InstancedMesh(geometry,material,capacity);m.frustumCulled=false;m.count=0;m.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(m);
  const alpha=new T.InstancedBufferAttribute(new Float32Array(capacity),1);m.geometry.setAttribute('fxAlpha',alpha);
  material.onBeforeCompile=s=>{s.vertexShader='attribute float fxAlpha;varying float vFxAlpha;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFxAlpha=fxAlpha;');s.fragmentShader='varying float vFxAlpha;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.a*=vFxAlpha;')};
  return {m,alpha,capacity,n:0,add(pos,w,h,opacity=1,rotation=0){if(this.n>=capacity)return;dummy.position.copy(pos);dummy.quaternion.copy(camera.quaternion);dummy.rotateZ(rotation);dummy.scale.set(w,h,1);dummy.updateMatrix();m.setMatrixAt(this.n,dummy.matrix);alpha.setX(this.n++,opacity)},flush(){m.count=this.n;m.instanceMatrix.needsUpdate=true;alpha.needsUpdate=true}};
 }
 const flame=pool(420,new T.MeshBasicMaterial({map:bank.images.flame,color:0xffffff,transparent:true,opacity:.92,depthWrite:false,blending:T.NormalBlending}));
 const smoke=pool(560,new T.MeshBasicMaterial({map:bank.images.smoke,color:0x3c3b39,transparent:true,opacity:.85,depthWrite:false}));
 const waterPixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);waterPixels[i]=waterPixels[i+1]=waterPixels[i+2]=255;waterPixels[i+3]=Math.round(255*Math.max(0,1-r)**1.4)}const waterMap=new T.DataTexture(waterPixels,32,32,T.RGBAFormat);waterMap.needsUpdate=true;
 const spray=pool(900,new T.MeshBasicMaterial({map:waterMap,color:0xe3eff2,transparent:true,opacity:.65,depthWrite:false}));
 const ring=pool(48,new T.MeshBasicMaterial({color:0xffdfb4,transparent:true,opacity:.27,depthWrite:false,blending:T.AdditiveBlending}),new T.RingGeometry(.90,1,64));
 const pools=[flame,smoke,spray,ring];
 function burst(pos,power=1){for(let i=0;i<Math.min(32,12*power)&&puffs.length<180;i++)puffs.push({p:pos.clone(),v:new T.Vector3((Math.random()-.5)*power*5,Math.random()*3+1,(Math.random()-.5)*power*4),age:0,life:2+Math.random()*3,size:.5+Math.random()*power});shock(pos,power*4)}
 function shock(pos,radius=5){if(rings.length<48)rings.push({p:pos.clone(),radius,age:0});}
 function begin(dt){clock+=dt;for(const p of pools)p.n=0;for(let i=puffs.length-1;i>=0;i--){const p=puffs[i];p.age+=dt;p.p.addScaledVector(p.v,dt);p.v.multiplyScalar(1-dt*.6);p.v.y+=dt*.35;smoke.add(p.p,p.size+p.age,p.size+p.age,(1-p.age/p.life)*.7,p.age*.1);if(p.age>=p.life)puffs.splice(i,1)}for(let i=rings.length-1;i>=0;i--){const r=rings[i];r.age+=dt;const size=r.radius*Math.min(1,r.age/.55);ring.add(r.p,size,size,Math.max(0,1-r.age/.65));if(r.age>.65)rings.splice(i,1)}}
 function setWind(origin,direction,strength=0){
  windStrength=Math.max(0,Math.min(1,strength));
  if(windStrength&&origin&&direction){windOrigin.copy(origin);windDirection.copy(direction);}
 }
 function fire(pos,age,size=1,suppression=0){const intensity=Math.max(0,1-suppression);
  const relX=pos.x-windOrigin.x,relY=pos.y-windOrigin.y,relZ=pos.z-windOrigin.z;
  const along=relX*windDirection.x+relY*windDirection.y+relZ*windDirection.z;
  const distanceSquared=relX*relX+relY*relY+relZ*relZ;
  const across=Math.sqrt(Math.max(0,distanceSquared-along*along));
  const windAtFire=windStrength&&along>0&&along<50&&across<10+along*.33
   ?windStrength*(1-along/80)*(1-across/(12+along*.40)):0;for(let i=0;i<5;i++){const t=age*(1.7+i*.19)+i*2.3,offset=new T.Vector3(Math.sin(i*4)*size*.65,1+Math.sin(t)*.24,Math.cos(i)*size*.3);flame.add(pos.clone().add(offset),size*(1.6+Math.sin(t)*.35),size*(3.6+Math.sin(t*1.3)*1.0)*intensity,.75*intensity,Math.sin(t)*.12)}for(let i=0;i<10;i++){const t=(age*.55+i*.61)%6,scale=size*(1.8+t*.95);smoke.add(pos.clone().add(new T.Vector3(Math.sin(i*2.4)*size*.6+t*.45+windDirection.x*windAtFire*t*2.2,2.2+t*2.0+windDirection.y*windAtFire*t*.8,1.1+Math.cos(i)*.4+windDirection.z*windAtFire*t*2.2)),scale,scale*1.2,Math.sin(t/6*Math.PI)*(.8-.3*suppression)*(1-windAtFire*.55),Math.sin(i)*.4)}}
 function water(from,to,width=.12){const delta=to.clone().sub(from),length=delta.length(),steps=Math.min(56,Math.max(12,Math.ceil(length*2)));for(let i=0;i<steps;i++){const t=(i+(clock*9%1))/steps;const p=from.clone().addScaledVector(delta,t);p.y+=Math.sin(t*Math.PI)*Math.min(5,length*.13);const right=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new T.Vector3(0,1,0).applyQuaternion(camera.quaternion),angle=Math.atan2(-delta.dot(right),delta.dot(up));spray.add(p,width*(1+t*1.5),Math.max(width*2,length/steps*2),.7,angle)}for(let i=0;i<12;i++){const a=clock*7+i*2.4,r=.2+(i%4)*.18;spray.add(to.clone().add(new T.Vector3(Math.cos(a)*r,Math.abs(Math.sin(a))*r,Math.sin(a)*r)),.23,.32,.4)}}
 return {begin,fire,setWind,water,burst,shock,flush(){for(const p of pools)p.flush()},reset(){puffs.length=0;rings.length=0;windStrength=0;for(const p of pools){p.n=0;p.flush()}},setVisible(on){for(const p of pools)p.m.visible=on},stats:()=>({drawBatches:4,puffs:puffs.length,shockwaves:rings.length,windStrength})};
}
