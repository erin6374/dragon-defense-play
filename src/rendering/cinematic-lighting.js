import * as THREE from 'three';

// A small original analytic sky probe supplies the reflection information that
// glass, painted metal and asphalt otherwise lack. Prefiltered once at startup;
// no screen-space reflection pass or additional per-frame scene rendering.
export function reflectionProbePixels(){
 const width=256,height=128,data=new Uint8Array(width*height*4);
 const sky=new THREE.Color(),top=new THREE.Color(0x698cae),horizon=new THREE.Color(0xd5c5af),ground=new THREE.Color(0x242b32);
 for(let y=0;y<height;y++)for(let x=0;x<width;x++){
  const elevation=-Math.cos(y/(height-1)*Math.PI);
  if(elevation>=0)sky.copy(horizon).lerp(top,Math.pow(elevation,.65));
  else sky.copy(horizon).lerp(ground,Math.min(1,-elevation*5));
  // A broad bright sky opening and low opposite-street silhouettes give
  // curved vehicle panels and planar glazing recognizable reflected shapes.
  const azimuth=x/width*Math.PI*2;
  const softbox=Math.exp(-Math.pow((azimuth-1.9)*2.2,2)-Math.pow((elevation-.28)*3.2,2));
  const skyline=(Math.sin(azimuth*19)+Math.sin(azimuth*37)*.3)*.025+.07;
  if(elevation<skyline&&elevation>-.08)sky.multiplyScalar(.43);
  sky.multiplyScalar(.80+softbox*.55);
  const i=(y*width+x)*4;
  data[i]=Math.min(255,sky.r*255);data[i+1]=Math.min(255,sky.g*255);data[i+2]=Math.min(255,sky.b*255);data[i+3]=255;
 }
 return {width,height,data};
}
export function createCinematicLighting(renderer,scene){
 const {width,height,data}=reflectionProbePixels();
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
 texture.mapping=THREE.EquirectangularReflectionMapping;
 texture.needsUpdate=true;
 const pmrem=new THREE.PMREMGenerator(renderer),probe=pmrem.fromEquirectangular(texture);
 scene.environment=probe.texture;texture.dispose();pmrem.dispose();
 const base=new WeakMap(),materials=new Set();let lastScan=-Infinity,clock=0;
 return {update(dt,darkness){
  clock+=Math.max(0,dt);
  if(clock-lastScan>1||dt===0){
   lastScan=clock;materials.clear();
   scene.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material])){
    if(m?.isMeshStandardMaterial&&!materials.has(m)){base.set(m,m.envMapIntensity);materials.add(m);}
   }});
  }
  const strength=.54*(1-darkness)+.09*darkness;
  for(const m of materials)m.envMapIntensity=base.get(m)*strength;
 },stats:()=>({probeSize:[width,height],materials:materials.size,extraFramePasses:0})};
}
