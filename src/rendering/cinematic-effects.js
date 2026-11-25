export function createCinematicEffects(T,scene,camera,bank){
 const dummy=new T.Object3D();let clock=0;
 const windOrigin=new T.Vector3(),windDirection=new T.Vector3(1,0,0);
 let windStrength=0;

 // Pre-allocated scratch objects to completely eliminate runtime garbage collection
 const _v1=new T.Vector3(),_v2=new T.Vector3(),_v3=new T.Vector3(),_v4=new T.Vector3();
 const _delta=new T.Vector3(),_right=new T.Vector3(),_up=new T.Vector3(),_offset=new T.Vector3();
 const _col1=new T.Color(),_col2=new T.Color();

 function pool(capacity,material,geometry=new T.PlaneGeometry(1,1)){
  const m=new T.InstancedMesh(geometry,material,capacity);
  m.frustumCulled=false;m.count=0;m.instanceMatrix.setUsage(T.DynamicDrawUsage);
  scene.add(m);
  const alpha=new T.InstancedBufferAttribute(new Float32Array(capacity),1);
  m.geometry.setAttribute('fxAlpha',alpha);
  const colors=new T.InstancedBufferAttribute(new Float32Array(capacity*3),3);
  m.geometry.setAttribute('fxColor',colors);
  material.onBeforeCompile=s=>{
   s.vertexShader='attribute float fxAlpha;attribute vec3 fxColor;varying float vFxAlpha;varying vec3 vFxColor;varying vec2 vFxUv;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvFxAlpha=fxAlpha;vFxColor=fxColor;vFxUv=uv;');
   s.fragmentShader='varying float vFxAlpha;varying vec3 vFxColor;varying vec2 vFxUv;\n'+s.fragmentShader;
   s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\nfloat fxEdgeR=length((vFxUv-vec2(0.5))*2.0);float fxFeather=1.0-smoothstep(0.08,0.92,fxEdgeR);diffuseColor.rgb*=vFxColor;diffuseColor.a*=vFxAlpha*fxFeather;');
  };
  return {
   m,alpha,colors,capacity,n:0,
   add(pos,w,h,opacity=1,rotation=0,col=null){
    if(this.n>=capacity)return;
    dummy.position.copy(pos);
    dummy.quaternion.copy(camera.quaternion);
    dummy.rotateZ(rotation);
    dummy.scale.set(w,h,1);
    dummy.updateMatrix();
    m.setMatrixAt(this.n,dummy.matrix);
    if(col){colors.setXYZ(this.n,col.r,col.g,col.b);}
    else{colors.setXYZ(this.n,1.0,1.0,1.0);}
    alpha.setX(this.n++,opacity);
   },
   flush(){
    m.count=this.n;
    m.instanceMatrix.needsUpdate=true;
    colors.needsUpdate=true;
    alpha.needsUpdate=true;
   }
  };
 }

 const defaultSmokeColor=new T.Color(0x605c56);
 const sootColor=new T.Color(0x181512);
 const steamColor=new T.Color(0xe6f0fa);
 const waterWhiteColor=new T.Color(0xffffff);
 const waterMistColor=new T.Color(0xf0f7ff);
 const waterFoamColor=new T.Color(0xe6f4fc);

 const flame=pool(420,new T.MeshBasicMaterial({map:bank.images.flame,color:0xffffff,transparent:true,opacity:.95,depthWrite:false,blending:T.AdditiveBlending}));
 const smoke=pool(1400,new T.MeshBasicMaterial({map:bank.images.smoke,color:0xffffff,transparent:true,opacity:.85,depthWrite:false}));

 // Soft feathered cubic smoothstep alpha texture for photorealistic water droplets and vapor
 const waterPixels=new Uint8Array(64*64*4);
 for(let y=0;y<64;y++){
  for(let x=0;x<64;x++){
   const idx=(y*64+x)*4;
   const r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);
   const a=Math.max(0,1.0-r);
   const smooth=a*a*(3.0-2.0*a);
   waterPixels[idx]=255;
   waterPixels[idx+1]=255;
   waterPixels[idx+2]=255;
   waterPixels[idx+3]=Math.round(255*Math.pow(smooth,1.35));
  }
 }
 const waterMap=new T.DataTexture(waterPixels,64,64,T.RGBAFormat);
 waterMap.needsUpdate=true;

 const spray=pool(1400,new T.MeshBasicMaterial({map:waterMap,color:0xffffff,transparent:true,opacity:.82,depthWrite:false}));
 const ring=pool(48,new T.MeshBasicMaterial({color:0xffdfb4,transparent:true,opacity:.27,depthWrite:false,blending:T.AdditiveBlending}),new T.RingGeometry(.90,1,64));
 const dust=pool(640,new T.MeshBasicMaterial({map:bank.images.dust||bank.images.smoke,color:0xbab09e,transparent:true,opacity:.78,depthWrite:false}));

 const sparkPixels=new Uint8Array(16*16*4);
 for(let y=0;y<16;y++){
  for(let x=0;x<16;x++){
   const idx=(y*16+x)*4,r=Math.hypot((x-7.5)/7.5,(y-7.5)/7.5);
   sparkPixels[idx]=180;sparkPixels[idx+1]=235;sparkPixels[idx+2]=255;
   sparkPixels[idx+3]=Math.round(255*Math.max(0,1-r)**1.8);
  }
 }
 const sparkMap=new T.DataTexture(sparkPixels,16,16,T.RGBAFormat);
 sparkMap.needsUpdate=true;
 const spark=pool(360,new T.MeshBasicMaterial({map:sparkMap,color:0xaeeaff,transparent:true,opacity:.95,depthWrite:false,blending:T.AdditiveBlending}));

 const pools=[flame,smoke,spray,ring,dust,spark];

 // PRE-ALLOCATED ZERO-GC POOLS
 const MAX_PUFFS=180;
 const puffs=[];
 for(let i=0;i<MAX_PUFFS;i++)puffs.push({active:false,p:new T.Vector3(),v:new T.Vector3(),age:0,life:1,size:1,isSteam:false});
 let puffHead=0;

 const MAX_RINGS=32;
 const rings=[];
 for(let i=0;i<MAX_RINGS;i++)rings.push({active:false,p:new T.Vector3(),radius:5,age:0,life:0.55});
 let ringHead=0;

 const MAX_DUST_PUFFS=240;
 const dustPuffs=[];
 for(let i=0;i<MAX_DUST_PUFFS;i++)dustPuffs.push({active:false,p:new T.Vector3(),v:new T.Vector3(),age:0,life:1,initialSize:1,targetSize:3,rot:0,rotSpeed:0,maxOpacity:0.6});
 let dustHead=0;

 const MAX_SPARK_PUFFS=200;
 const sparkPuffs=[];
 for(let i=0;i<MAX_SPARK_PUFFS;i++)sparkPuffs.push({active:false,p:new T.Vector3(),v:new T.Vector3(),age:0,life:0.25,size:0.2,power:1});
 let sparkHead=0;

 // DEDICATED HIGH-VELOCITY PARTICLE WATER ENGINE
 const MAX_WATER=480;
 const waterParticles=[];
 for(let i=0;i<MAX_WATER;i++){
  waterParticles.push({
   active:false,p:new T.Vector3(),v:new T.Vector3(),age:0,life:1.0,
   initialSize:0.4,targetSize:2.0,maxOpacity:0.8,rot:0,rotSpeed:0,
   isMist:false,color:new T.Color(0xffffff)
  });
 }
 let waterHead=0;

 function spawnWaterParticle(x,y,z,vx,vy,vz,life,initialSize,targetSize,opacity,isMist,col){
  const wp=waterParticles[waterHead];
  waterHead=(waterHead+1)%MAX_WATER;
  wp.active=true;
  wp.p.set(x,y,z);
  wp.v.set(vx,vy,vz);
  wp.age=0;
  wp.life=life;
  wp.initialSize=initialSize;
  wp.targetSize=targetSize;
  wp.maxOpacity=opacity;
  wp.rot=Math.random()*Math.PI*2;
  wp.rotSpeed=(Math.random()-0.5)*3.2;
  wp.isMist=!!isMist;
  if(col)wp.color.copy(col);else wp.color.setHex(0xffffff);
  return wp;
 }

 function burst(pos,power=1){
  const num=Math.min(24,Math.round(10*power));
  for(let i=0;i<num;i++){
   const p=puffs[puffHead];puffHead=(puffHead+1)%MAX_PUFFS;
   p.active=true;
   p.p.copy(pos);
   p.v.set((Math.random()-.5)*power*5,Math.random()*3+1,(Math.random()-.5)*power*4);
   p.age=0;p.life=2+Math.random()*2.5;p.size=.5+Math.random()*power;p.isSteam=false;
  }
  shock(pos,power*4);
 }

 function shock(pos,radius=5,life=0.55){
  const r=rings[ringHead];ringHead=(ringHead+1)%MAX_RINGS;
  r.active=true;r.p.copy(pos);r.radius=radius;r.age=0;r.life=life;
 }

 function sparks(pos,count=10,power=1.0){
  const num=Math.min(24,Math.max(3,Math.round(count)));
  for(let i=0;i<num;i++){
   const angle=Math.random()*Math.PI*2;
   const speed=(3.0+Math.random()*8.0)*power;
   const s=sparkPuffs[sparkHead];sparkHead=(sparkHead+1)%MAX_SPARK_PUFFS;
   s.active=true;
   s.p.set(pos.x+(Math.random()-.5)*.35,pos.y+(Math.random()-.5)*.35,pos.z+(Math.random()-.5)*.35);
   s.v.set(Math.cos(angle)*speed,(Math.random()*6.0+2.0)*power,Math.sin(angle)*speed);
   s.age=0;s.life=0.18+Math.random()*0.28;s.size=0.12+Math.random()*0.22*power;s.power=power;
  }
 }

 function dustBurst(pos,power=1,opts={}){
  const num=opts.count||Math.min(32,Math.max(8,Math.round(12*power)));
  const originY=Math.max(0.2,pos.y);
  for(let i=0;i<num;i++){
   const angle=Math.random()*Math.PI*2;
   const speed=(opts.radial!==false?4.0+Math.random()*7.0:2.0+Math.random()*4.0)*power;
   const vx=Math.cos(angle)*speed;
   const vz=Math.sin(angle)*speed;
   const vy=(Math.random()*1.6+0.5)*(opts.upward||1.0)*Math.min(2.5,power);
   const life=1.8+Math.random()*2.4;
   const initialSize=0.9+Math.random()*1.2*power;
   const targetSize=initialSize*(3.2+Math.random()*2.8);
   const d=dustPuffs[dustHead];dustHead=(dustHead+1)%MAX_DUST_PUFFS;
   d.active=true;
   d.p.set(pos.x+(Math.random()-0.5)*1.8,originY+Math.random()*0.4,pos.z+(Math.random()-0.5)*1.8);
   d.v.set(vx,vy,vz);
   d.age=0;d.life=life;d.initialSize=initialSize;d.targetSize=targetSize;
   d.rot=Math.random()*Math.PI*2;d.rotSpeed=(Math.random()-0.5)*1.5;
   d.maxOpacity=0.50+Math.random()*0.25;
  }
  if(opts.shock)shock(pos,Math.min(18,power*3.5));
 }

 function demolitionDustWave(fromPos,toPos,power=1.8){
  _delta.subVectors(toPos,fromPos);
  const len=_delta.length();
  const steps=Math.max(4,Math.round(len/3.5));
  for(let i=0;i<=steps;i++){
   const t=i/steps;
   _v1.copy(fromPos).addScaledVector(_delta,t);
   _v1.y=Math.max(0.3,_v1.y);
   dustBurst(_v1,power,{count:12,radial:true,upward:0.75});
  }
 }

 function waterJet(pos,dt,opts={}){
  const rate=opts.rate||8;
  const power=opts.power||1.0;
  const originY=pos.y||0.2;

  // High-velocity upward pressurized water droplets
  for(let i=0;i<rate;i++){
   const spreadR=Math.random()*0.22*power;
   const angle=Math.random()*Math.PI*2;
   const ox=pos.x+Math.cos(angle)*spreadR;
   const oz=pos.z+Math.sin(angle)*spreadR;
   const speed=(18.0+Math.random()*12.0)*power;
   const tiltAngle=Math.random()*(opts.spread||0.18);
   const tiltDir=Math.random()*Math.PI*2;
   const vx=Math.cos(tiltDir)*Math.sin(tiltAngle)*speed*0.35;
   const vz=Math.sin(tiltDir)*Math.sin(tiltAngle)*speed*0.35;
   const vy=Math.cos(tiltAngle)*speed;
   const life=0.9+Math.random()*0.55;
   const initSize=0.32+Math.random()*0.30;
   const targetSize=initSize*(3.2+Math.random()*2.2);
   const alpha=0.68+Math.random()*0.22;
   spawnWaterParticle(ox,originY,oz,vx,vy,vz,life,initSize,targetSize,alpha,false,waterWhiteColor);
  }

  // Soft billowing white mist canopy at apex
  if(Math.random()<0.85){
   const mistAngle=Math.random()*Math.PI*2;
   const mistR=Math.random()*0.55;
   const mx=pos.x+Math.cos(mistAngle)*mistR;
   const mz=pos.z+Math.sin(mistAngle)*mistR;
   const mvy=(13.0+Math.random()*9.0)*power;
   const mvx=(Math.random()-0.5)*3.2;
   const mvz=(Math.random()-0.5)*3.2;
   const life=1.5+Math.random()*0.9;
   const initSize=0.75+Math.random()*0.55;
   const targetSize=initSize*(3.8+Math.random()*2.8);
   const alpha=0.35+Math.random()*0.25;
   spawnWaterParticle(mx,originY+0.4,mz,mvx,mvy,mvz,life,initSize,targetSize,alpha,true,waterMistColor);
  }

  // Ground churning boiling foam around rupture
  if(Math.random()<0.70){
   const foamAngle=Math.random()*Math.PI*2;
   const foamDist=Math.random()*1.1*power;
   const fx=pos.x+Math.cos(foamAngle)*foamDist;
   const fz=pos.z+Math.sin(foamAngle)*foamDist;
   const fvx=Math.cos(foamAngle)*(2.0+Math.random()*2.5);
   const fvz=Math.sin(foamAngle)*(2.0+Math.random()*2.5);
   const fvy=0.5+Math.random()*1.0;
   const life=0.40+Math.random()*0.30;
   const initSize=0.65+Math.random()*0.45;
   const targetSize=initSize*2.0;
   const alpha=0.62+Math.random()*0.26;
   spawnWaterParticle(fx,originY+0.1,fz,fvx,fvy,fvz,life,initSize,targetSize,alpha,false,waterFoamColor);
  }
 }

 function waterSpray(pos,dir,dt,opts={}){
  const rate=opts.rate||4;
  const power=opts.power||1.0;
  for(let i=0;i<rate;i++){
   const speed=(14.0+Math.random()*8.0)*power;
   const spread=0.22;
   const vx=(dir.x+(Math.random()-0.5)*spread)*speed;
   const vy=(dir.y+(Math.random()-0.5)*spread)*speed*0.5+1.8;
   const vz=(dir.z+(Math.random()-0.5)*spread)*speed;
   const life=0.65+Math.random()*0.45;
   const initSize=0.28+Math.random()*0.22;
   const targetSize=initSize*3.0;
   const alpha=0.55+Math.random()*0.25;
   spawnWaterParticle(pos.x,pos.y,pos.z,vx,vy,vz,life,initSize,targetSize,alpha,false,waterWhiteColor);
  }
 }

 function begin(dt){
  clock+=dt;
  for(const p of pools)p.n=0;

  // Update smoke & steam puffs
  for(let i=0;i<MAX_PUFFS;i++){
   const p=puffs[i];
   if(!p.active)continue;
   p.age+=dt;
   if(p.age>=p.life){p.active=false;continue;}
   p.p.addScaledVector(p.v,dt);
   p.v.multiplyScalar(Math.max(0,1-dt*.6));
   p.v.y+=dt*.35;
   const col=p.isSteam?steamColor:defaultSmokeColor;
   smoke.add(p.p,p.size+p.age,p.size+p.age,(1-p.age/p.life)*(p.isSteam?0.62:0.7),p.age*.1,col);
  }

  // Update dust puffs
  for(let i=0;i<MAX_DUST_PUFFS;i++){
   const d=dustPuffs[i];
   if(!d.active)continue;
   d.age+=dt;
   if(d.age>=d.life){d.active=false;continue;}
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
  }

  // Update spark puffs
  for(let i=0;i<MAX_SPARK_PUFFS;i++){
   const s=sparkPuffs[i];
   if(!s.active)continue;
   s.age+=dt;
   if(s.age>=s.life){s.active=false;continue;}
   s.p.addScaledVector(s.v,dt);
   s.v.y-=dt*19.0;
   s.v.x*=Math.max(0,1-dt*3.0);
   s.v.z*=Math.max(0,1-dt*3.0);
   s.p.x+=(Math.random()-.5)*0.08*s.power;
   s.p.z+=(Math.random()-.5)*0.08*s.power;
   const progress=s.age/s.life;
   const size=s.size*(1-progress*.6);
   const alpha=(1-progress)*(.75+Math.random()*.25);
   spark.add(s.p,size,size*2.2,alpha,Math.atan2(s.v.y,s.v.x));
  }

  // Update shockwave rings
  for(let i=0;i<MAX_RINGS;i++){
   const r=rings[i];
   if(!r.active)continue;
   r.age+=dt;
   if(r.age>=r.life){r.active=false;continue;}
   const size=r.radius*Math.min(1,r.age/.55);
   ring.add(r.p,size,size,Math.max(0,1-r.age/.65));
  }

  // Update high-velocity water mist and spray particles
  for(let i=0;i<MAX_WATER;i++){
   const wp=waterParticles[i];
   if(!wp.active)continue;
   wp.age+=dt;
   if(wp.age>=wp.life){wp.active=false;continue;}

   // Dynamic gravity & aerodynamic drag
   wp.v.y-=(wp.isMist?4.8:19.5)*dt;
   wp.v.x*=Math.max(0,1-dt*(wp.isMist?1.1:0.42));
   wp.v.z*=Math.max(0,1-dt*(wp.isMist?1.1:0.42));

   // Urban wind deflection
   if(windStrength>0){
    wp.v.x+=windDirection.x*windStrength*dt*(wp.isMist?3.2:1.1);
    wp.v.z+=windDirection.z*windStrength*dt*(wp.isMist?3.2:1.1);
   }

   wp.p.addScaledVector(wp.v,dt);

   // Ground collision bounce / pavement splash mist
   if(wp.p.y<0.22){
    wp.p.y=0.22;
    wp.v.y=Math.abs(wp.v.y)*0.16;
    wp.v.x*=0.55;
    wp.v.z*=0.55;
   }

   wp.rot+=wp.rotSpeed*dt;
   const progress=wp.age/wp.life;
   const size=wp.initialSize+(wp.targetSize-wp.initialSize)*Math.pow(progress,0.68);
   const alpha=wp.maxOpacity*Math.sin(Math.pow(progress,0.45)*Math.PI);
   spray.add(wp.p,size,size,alpha,wp.rot,wp.color);
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

  const fastTrail=style==='meteor';
  const flameCount=fastTrail?3:5;
  const smokeCount=fastTrail?5:36; // Optimized smoke count to guarantee 60fps

  for(let i=0;i<flameCount;i++){
   const t=age*(1.7+i*.19)+i*2.3;
   _offset.set(Math.sin(i*4)*size*(fastTrail?.34:.65),
    (fastTrail?.5:1)+Math.sin(t)*.24,Math.cos(i)*size*.3);
   _v1.copy(pos).add(_offset);
   flame.add(_v1,size*(fastTrail?.85:1.6+Math.sin(t)*.35),
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

   _offset.set(
    wandering+swirlX+t*(fastTrail?.12:.28)+windDirection.x*windAtFire*t*2.0-highWind,
    y+windDirection.y*windAtFire*t*.75,
    swirlZ+.3+Math.cos(i*.8)*.25+windDirection.z*windAtFire*t*2.0
   );
   _v1.copy(pos).add(_offset);

   const altitudeDissipation=fastTrail?1.0:Math.max(0.015,Math.pow(1.0-progress,1.72));
   const puffAlpha=Math.sin(Math.pow(progress,0.65)*Math.PI)*(fastTrail?.22:(.42-.14*suppression)*altitudeDissipation)*(1-windAtFire*.55);
   const sootLerp=Math.min(1.0,Math.max(0.0,sootFactor));

   if(sootLerp>0.04){
    _col1.copy(defaultSmokeColor).lerp(sootColor,sootLerp);
   }else{
    _col1.copy(defaultSmokeColor);
   }
   smoke.add(_v1,scale,scale*(fastTrail?1.20:1.28),puffAlpha,Math.sin(i*1.2+age*.25)*0.5,_col1);
  }
 }

 function steamBurst(pos,power=1){
  const num=Math.min(20,Math.max(4,Math.round(7*power)));
  for(let i=0;i<num;i++){
   const p=puffs[puffHead];puffHead=(puffHead+1)%MAX_PUFFS;
   p.active=true;
   p.p.set(pos.x+(Math.random()-.5)*1.8,0.2,pos.z+(Math.random()-.5)*1.8);
   p.v.set((Math.random()-.5)*1.4,3.2+Math.random()*3.5,(Math.random()-.5)*1.4);
   p.age=0;p.life=1.1+Math.random()*1.4;p.size=1.2+Math.random()*power*1.1;p.isSteam=true;
  }
 }

 function water(from,to,width=.12){
  _delta.subVectors(to,from);
  const length=_delta.length();
  const steps=Math.min(48,Math.max(10,Math.ceil(length*2)));
  _right.set(1,0,0).applyQuaternion(camera.quaternion);
  _up.set(0,1,0).applyQuaternion(camera.quaternion);
  const angle=Math.atan2(-_delta.dot(_right),_delta.dot(_up));

  for(let i=0;i<steps;i++){
   const t=(i+(clock*9%1))/steps;
   _v1.copy(from).addScaledVector(_delta,t);
   _v1.y+=Math.sin(t*Math.PI)*Math.min(5,length*.13);
   spray.add(_v1,width*(1+t*1.5),Math.max(width*2,length/steps*2),.7,angle,waterWhiteColor);
  }
  for(let i=0;i<10;i++){
   const a=clock*7+i*2.4,r=.2+(i%4)*.18;
   _v1.set(to.x+Math.cos(a)*r,to.y+Math.abs(Math.sin(a))*r,to.z+Math.sin(a)*r);
   spray.add(_v1,.23,.32,.4,0,waterWhiteColor);
  }
 }

 return {
  begin,fire,setWind,water,waterJet,waterSpray,burst,shock,dustBurst,demolitionDustWave,sparks,steamBurst,
  getWaterParticleCount:()=>waterParticles.filter(p=>p.active).length,
  flush(){for(const p of pools)p.flush();},
  reset(){
   puffs.forEach(p=>p.active=false);
   rings.forEach(r=>r.active=false);
   dustPuffs.forEach(d=>d.active=false);
   sparkPuffs.forEach(s=>s.active=false);
   waterParticles.forEach(w=>w.active=false);
   windStrength=0;
   for(const p of pools){p.n=0;p.flush();}
  },
  setVisible(on){for(const p of pools)p.m.visible=on;},
  stats:()=>({
   drawBatches:pools.length,
   activeWaterParticles:waterParticles.filter(p=>p.active).length,
   activeDustPuffs:dustPuffs.filter(d=>d.active).length,
   activeSparks:sparkPuffs.filter(s=>s.active).length,
   smokePuffs:smoke.n
  })
 };
}
