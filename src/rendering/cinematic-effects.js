export function createCinematicEffects(T,scene,camera,bank){
 const dummy=new T.Object3D(),puffs=[],rings=[],dustPuffs=[],sparkPuffs=[];let clock=0;
 const windOrigin=new T.Vector3(),windDirection=new T.Vector3(1,0,0);
 let windStrength=0;
 function pool(capacity,material,geometry=new T.PlaneGeometry(1,1)){
  const m=new T.InstancedMesh(geometry,material,capacity);m.frustumCulled=false;m.count=0;m.instanceMatrix.setUsage(T.DynamicDrawUsage);scene.add(m);
  const alpha=new T.InstancedBufferAttribute(new Float32Array(capacity),1);m.geometry.setAttribute('fxAlpha',alpha);
  material.onBeforeCompile=s=>{s.vertexShader='attribute float fxAlpha;varying float vFxAlpha;varying vec2 vFxUv;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFxAlpha=fxAlpha;vFxUv=uv;');s.fragmentShader='varying float vFxAlpha;varying vec2 vFxUv;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat fxEdgeR=length((vFxUv-vec2(0.5))*2.0);float fxFeather=1.0-smoothstep(0.08,0.88,fxEdgeR);diffuseColor.a*=vFxAlpha*fxFeather;')};
  return {m,alpha,capacity,n:0,add(pos,w,h,opacity=1,rotation=0,col=null){if(this.n>=capacity)return;dummy.position.copy(pos);dummy.quaternion.copy(camera.quaternion);dummy.rotateZ(rotation);dummy.scale.set(w,h,1);dummy.updateMatrix();m.setMatrixAt(this.n,dummy.matrix);if(col&&m.setColorAt)m.setColorAt(this.n,col);alpha.setX(this.n++,opacity)},flush(){m.count=this.n;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;alpha.needsUpdate=true}};
 }
 const defaultSmokeColor=new T.Color(0x605c56);
 const sootColor=new T.Color(0x181512);
 const steamColor=new T.Color(0xe6f0fa);
 const flame=pool(420,new T.MeshBasicMaterial({map:bank.images.flame,color:0xffffff,transparent:true,opacity:.95,depthWrite:false,blending:T.AdditiveBlending}));
 const smoke=pool(1400,new T.MeshBasicMaterial({map:bank.images.smoke,color:0xffffff,transparent:true,opacity:.85,depthWrite:false}));
 const waterPixels=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);waterPixels[i]=waterPixels[i+1]=waterPixels[i+2]=255;waterPixels[i+3]=Math.round(255*Math.max(0,1-r)**1.4)}const waterMap=new T.DataTexture(waterPixels,32,32,T.RGBAFormat);waterMap.needsUpdate=true;
 const spray=pool(900,new T.MeshBasicMaterial({map:waterMap,color:0xe3eff2,transparent:true,opacity:.65,depthWrite:false}));
 const ring=pool(48,new T.MeshBasicMaterial({color:0xffdfb4,transparent:true,opacity:.27,depthWrite:false,blending:T.AdditiveBlending}),new T.RingGeometry(.90,1,64));
 const dust=pool(640,new T.MeshBasicMaterial({map:bank.images.dust||bank.images.smoke,color:0xbab09e,transparent:true,opacity:.78,depthWrite:false}));
 const sparkPixels=new Uint8Array(16*16*4);for(let y=0;y<16;y++)for(let x=0;x<16;x++){const i=(y*16+x)*4,r=Math.hypot((x-7.5)/7.5,(y-7.5)/7.5);sparkPixels[i]=180;sparkPixels[i+1]=235;sparkPixels[i+2]=255;sparkPixels[i+3]=Math.round(255*Math.max(0,1-r)**1.8);}const sparkMap=new T.DataTexture(sparkPixels,16,16,T.RGBAFormat);sparkMap.needsUpdate=true;
 const spark=pool(360,new T.MeshBasicMaterial({map:sparkMap,color:0xaeeaff,transparent:true,opacity:.95,depthWrite:false,blending:T.AdditiveBlending}));
 const pools=[flame,smoke,spray,ring,dust,spark];
 function burst(pos,power=1){for(let i=0;i<Math.min(32,12*power)&&puffs.length<180;i++)puffs.push({p:pos.clone(),v:new T.Vector3((Math.random()-.5)*power*5,Math.random()*3+1,(Math.random()-.5)*power*4),age:0,life:2+Math.random()*3,size:.5+Math.random()*power});shock(pos,power*4)}
 function shock(pos,radius=5){if(rings.length<48)rings.push({p:pos.clone(),radius,age:0});}
 function sparks(pos,count=10,power=1.0){
  const num=Math.min(32,Math.max(3,Math.round(count)));
  for(let i=0;i<num&&sparkPuffs.length<280;i++){
   const angle=Math.random()*Math.PI*2;
   const speed=(3.0+Math.random()*9.0)*power;
   sparkPuffs.push({
    p:pos.clone().add(new T.Vector3((Math.random()-.5)*.35,(Math.random()-.5)*.35,(Math.random()-.5)*.35)),
    v:new T.Vector3(Math.cos(angle)*speed,(Math.random()*6.0+2.0)*power,Math.sin(angle)*speed),
    age:0,life:0.18+Math.random()*0.28,
    size:0.12+Math.random()*0.22*power,
    power
   });
  }
 }
 function dustBurst(pos,power=1,opts={}){
  const num=opts.count||Math.min(48,Math.max(10,Math.round(14*power)));
  const originY=Math.max(0.2,pos.y);
  for(let i=0;i<num&&dustPuffs.length<360;i++){
   const angle=Math.random()*Math.PI*2;
   const speed=(opts.radial!==false?4.0+Math.random()*8.0:2.0+Math.random()*4.0)*power;
   const vx=Math.cos(angle)*speed;
   const vz=Math.sin(angle)*speed;
   const vy=(Math.random()*1.8+0.5)*(opts.upward||1.0)*Math.min(2.5,power);
   const life=2.2+Math.random()*2.8;
   const initialSize=0.9+Math.random()*1.2*power;
   const targetSize=initialSize*(3.6+Math.random()*3.2);
   dustPuffs.push({
    p:new T.Vector3(pos.x+(Math.random()-0.5)*1.8,originY+Math.random()*0.4,pos.z+(Math.random()-0.5)*1.8),
    v:new T.Vector3(vx,vy,vz),
    age:0,life,
    initialSize,targetSize,
    rot:Math.random()*Math.PI*2,
    rotSpeed:(Math.random()-0.5)*1.5,
    maxOpacity:0.55+Math.random()*0.30
   });
  }
  shock(pos,Math.min(18,power*3.5));
 }
 function demolitionDustWave(fromPos,toPos,power=1.8){
  const delta=toPos.clone().sub(fromPos);
  const len=delta.length();
  const steps=Math.max(4,Math.round(len/3.2));
  for(let i=0;i<=steps;i++){
   const t=i/steps;
   const pt=fromPos.clone().addScaledVector(delta,t);
   pt.y=Math.max(0.3,pt.y);
   dustBurst(pt,power,{count:16,radial:true,upward:0.75});
  }
 }
 function begin(dt){
  clock+=dt;
  for(const p of pools)p.n=0;
  for(let i=puffs.length-1;i>=0;i--){
   const p=puffs[i];p.age+=dt;p.p.addScaledVector(p.v,dt);p.v.multiplyScalar(1-dt*.6);p.v.y+=dt*.35;
   const col=p.isSteam?steamColor:defaultSmokeColor;
   smoke.add(p.p,p.size+p.age,p.size+p.age,(1-p.age/p.life)*(p.isSteam?0.62:0.7),p.age*.1,col);
   if(p.age>=p.life)puffs.splice(i,1);
  }
  for(let i=dustPuffs.length-1;i>=0;i--){
   const d=dustPuffs[i];
   d.age+=dt;
   d.v.x*=Math.max(0,1-dt*0.85);
   d.v.z*=Math.max(0,1-dt*0.85);
   d.v.y*=Math.max(0,1-dt*0.7);
   d.v.y+=dt*0.22;
   d.p.addScaledVector(d.v,dt);
   if(d.p.y<0.3){d.p.y=0.3;d.v.y=Math.abs(d.v.y)*0.25;}
   d.rot+=d.rotSpeed*dt;
   const progress=Math.min(1,d.age/d.life);
   const currentSize=d.initialSize+(d.targetSize-d.initialSize)*Math.pow(progress,0.65);
   const alpha=d.maxOpacity*Math.max(0,Math.sin(progress*Math.PI));
   dust.add(d.p,currentSize,currentSize,alpha,d.rot);
   if(d.age>=d.life)dustPuffs.splice(i,1);
  }
  for(let i=sparkPuffs.length-1;i>=0;i--){
   const s=sparkPuffs[i];s.age+=dt;
   s.p.addScaledVector(s.v,dt);
   s.v.y-=dt*19.0;s.v.x*=Math.max(0,1-dt*3.0);s.v.z*=Math.max(0,1-dt*3.0);
   s.p.x+=(Math.random()-.5)*0.08*s.power;s.p.z+=(Math.random()-.5)*0.08*s.power;
   const progress=s.age/s.life;
   const size=s.size*(1-progress*.6);
   const alpha=(1-progress)*(.75+Math.random()*.25);
   spark.add(s.p,size,size*2.2,alpha,Math.atan2(s.v.y,s.v.x));
   if(s.age>=s.life)sparkPuffs.splice(i,1);
  }
  for(let i=rings.length-1;i>=0;i--){
   const r=rings[i];r.age+=dt;const size=r.radius*Math.min(1,r.age/.55);
   ring.add(r.p,size,size,Math.max(0,1-r.age/.65));
   if(r.age>.65)rings.splice(i,1);
  }
 }
 function setWind(origin,direction,strength=0){
  windStrength=Math.max(0,Math.min(1,strength));
  if(windStrength&&origin&&direction){windOrigin.copy(origin);windDirection.copy(direction);}
 }
 function fire(pos,age,size=1,suppression=0,style='structure',sootFactor=0){
  const intensity=Math.max(0,1-suppression);
  const relX=pos.x-windOrigin.x,relY=pos.y-windOrigin.y,relZ=pos.z-windOrigin.z;
  const along=relX*windDirection.x+relY*windDirection.y+relZ*windDirection.z;
  const distanceSquared=relX*relX+relY*relY+relZ*relZ;
  const across=Math.sqrt(Math.max(0,distanceSquared-along*along));
  const windAtFire=windStrength&&along>0&&along<50&&across<10+along*.33
   ?windStrength*(1-along/80)*(1-across/(12+along*.40)):0;
  // Meteor smoke is a short, broken exhaust ribbon. Building fires produce
  // slower, denser rising plumes. Distinct caps prevent two small fragments
  // from creating opaque shafts that obscure the entire distant skyline.
  const fastTrail=style==='meteor';
  const flameCount=fastTrail?3:5;
  const smokeCount=fastTrail?5:42;
  for(let i=0;i<flameCount;i++){
   const t=age*(1.7+i*.19)+i*2.3;
   const offset=new T.Vector3(Math.sin(i*4)*size*(fastTrail?.34:.65),
    (fastTrail?.5:1)+Math.sin(t)*.24,Math.cos(i)*size*.3);
   flame.add(pos.clone().add(offset),size*(fastTrail?.85:1.6+Math.sin(t)*.35),
    size*(fastTrail?1.55:3.6+Math.sin(t*1.3)*1.0)*intensity,
    (fastTrail?.61:.75)*intensity,Math.sin(t)*.12);
  }
  for(let i=0;i<smokeCount;i++){
   const cycle=fastTrail?2.6:16.0;
   const t=fastTrail?(age*.75+i*.43)%cycle:(age*.38+i*(cycle/smokeCount))%cycle;
   const progress=t/cycle;
   const curlAngle=age*0.48+i*0.58;
   const curlR=Math.pow(progress,1.18)*(fastTrail?0.32:2.2);
   const swirlX=Math.cos(curlAngle)*curlR*(fastTrail?.25:.65);
   const swirlZ=Math.sin(curlAngle)*curlR*(fastTrail?.25:.65);
   const wandering=Math.sin(age*0.7+i*1.8)*size*(fastTrail?.25:.55);
   const scale=fastTrail?size*(.82+t*.30):size*(1.55+Math.pow(t,1.22)*1.65);
   const y=fastTrail?.5+t*.80:1.6+Math.pow(t,1.52)*4.2;
   const highWind=fastTrail?0:Math.min(26.0,Math.pow(t,1.22)*1.5);
   const smokePosition=pos.clone().add(new T.Vector3(
    wandering+swirlX+t*(fastTrail?.12:.28)+windDirection.x*windAtFire*t*2.0-highWind,
    y+windDirection.y*windAtFire*t*.75,
    swirlZ+.3+Math.cos(i*.8)*.25+windDirection.z*windAtFire*t*2.0));
   const altitudeDissipation=fastTrail?1.0:Math.max(0.015,Math.pow(1.0-progress,1.72));
   const puffAlpha=Math.sin(Math.pow(progress,0.65)*Math.PI)*(fastTrail?.22:(.42-.14*suppression)*altitudeDissipation)*(1-windAtFire*.55);
   const sootLerp=Math.min(1.0,Math.max(0.0,sootFactor));
   const currentSmokeCol=sootLerp>0.04?defaultSmokeColor.clone().lerp(sootColor,sootLerp):defaultSmokeColor;
   smoke.add(smokePosition,scale,scale*(fastTrail?1.20:1.28),puffAlpha,Math.sin(i*1.2+age*.25)*0.5,currentSmokeCol);
  }
 }
 function steamBurst(pos,power=1){
  const num=Math.min(24,Math.max(4,Math.round(8*power)));
  for(let i=0;i<num&&puffs.length<220;i++){
   puffs.push({
    p:pos.clone().add(new T.Vector3((Math.random()-.5)*1.8,0.2,(Math.random()-.5)*1.8)),
    v:new T.Vector3((Math.random()-.5)*1.4,3.2+Math.random()*3.8,(Math.random()-.5)*1.4),
    age:0,
    life:1.2+Math.random()*1.5,
    size:1.2+Math.random()*power*1.1,
    isSteam:true
   });
  }
 }
 function water(from,to,width=.12){const delta=to.clone().sub(from),length=delta.length(),steps=Math.min(56,Math.max(12,Math.ceil(length*2)));for(let i=0;i<steps;i++){const t=(i+(clock*9%1))/steps;const p=from.clone().addScaledVector(delta,t);p.y+=Math.sin(t*Math.PI)*Math.min(5,length*.13);const right=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion),up=new T.Vector3(0,1,0).applyQuaternion(camera.quaternion),angle=Math.atan2(-delta.dot(right),delta.dot(up));spray.add(p,width*(1+t*1.5),Math.max(width*2,length/steps*2),.7,angle)}for(let i=0;i<12;i++){const a=clock*7+i*2.4,r=.2+(i%4)*.18;spray.add(to.clone().add(new T.Vector3(Math.cos(a)*r,Math.abs(Math.sin(a))*r,Math.sin(a)*r)),.23,.32,.4)}}
 return {begin,fire,setWind,water,burst,shock,dustBurst,demolitionDustWave,sparks,steamBurst,flush(){for(const p of pools)p.flush()},reset(){puffs.length=0;rings.length=0;dustPuffs.length=0;sparkPuffs.length=0;windStrength=0;for(const p of pools){p.n=0;p.flush()}},setVisible(on){for(const p of pools)p.m.visible=on},stats:()=>({drawBatches:pools.length,puffs:puffs.length,dustPuffs:dustPuffs.length,shockwaves:rings.length,windStrength,smokePuffs:smoke.n})};
}
