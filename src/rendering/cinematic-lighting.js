import * as THREE from 'three';

// A small original analytic sky probe supplies the reflection information that
// glass, painted metal and asphalt otherwise lack. Prefiltered once at startup;
// no screen-space reflection pass or additional per-frame scene rendering.
export function reflectionProbePixels(preset='standard'){
 const width=preset==='cinematic'?512:256,height=preset==='cinematic'?256:128;
 const data=new Uint8Array(width*height*4);
 const sky=new THREE.Color(),top=new THREE.Color(0x384a6b),horizon=new THREE.Color(0xec9a6c),ground=new THREE.Color(0x1a2026);
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

  // Opposite side of North Broad Street architectural reflection (facing west across street)
  // Reflecting rays looking across the street toward the west side of North Broad (azimuth near 0 / 2pi):
  const acrossStreet=Math.cos(azimuth);
  if(acrossStreet>0.2){
   const viewWeight=(acrossStreet-.2)/.8;
   // Opposite rowhouse building facades along the western curb
   const roofLine=0.08+Math.sin(azimuth*14.0)*0.035+Math.sin(azimuth*31.0)*0.015;
   if(elevation<roofLine&&elevation>-0.07){
    // Rowhouse masonry tone (alternating Philadelphia red brick and limestone)
    const buildingHue=(Math.sin(azimuth*18.0)>0)?new THREE.Color(0x754338):new THREE.Color(0x948674);
    sky.lerp(buildingHue,viewWeight*0.75);
    
    // Windows: repeating rows of warm illuminated classroom and apartment sashes
    const winX=Math.sin(azimuth*52.0),winY=Math.sin((elevation-0.01)*75.0);
    if(Math.abs(winX)>0.38&&Math.abs(winY)>0.36&&elevation>-0.04){
     const windowGlow=new THREE.Color(0xffdf96);
     sky.lerp(windowGlow,viewWeight*0.95);
    }
    // Ground floor illuminated storefront display glazing & signs
    if(elevation>-0.06&&elevation<-0.01){
     const shopLight=new THREE.Color((Math.sin(azimuth*22.0)>0)?0xffbe70:0x88c4ee);
     sky.lerp(shopLight,viewWeight*0.85);
    }
   }
   // Opposite streetlights along North Broad curb: bright amber luminous accents
   const lampSpacing=Math.sin(azimuth*28.0);
   if(lampSpacing>0.92&&Math.abs(elevation-0.01)<0.025){
    const streetLamp=new THREE.Color(0xffcc66);
    sky.lerp(streetLamp,viewWeight*0.98);
   }
   // Rain-slicked wet asphalt street reflection below the curb
   if(elevation<=-0.07&&elevation>-0.38){
    const roadReflect=new THREE.Color(0x161d24);
    // Vertical reflection streak from the streetlights and warm storefronts
    const streak=Math.max(0,Math.sin(azimuth*28.0)>0.85?0.4:0)+Math.max(0,Math.sin(azimuth*52.0)>0.5?0.25:0);
    roadReflect.add(new THREE.Color(0xec9a6c).multiplyScalar(streak));
    sky.lerp(roadReflect,viewWeight*0.85);
   }
  }

  const i=(y*width+x)*4;
  data[i]=Math.min(255,sky.r*255);data[i+1]=Math.min(255,sky.g*255);data[i+2]=Math.min(255,sky.b*255);data[i+3]=255;
 }
 return {width,height,data};
}
export function createCinematicLighting(renderer,scene,preset='standard'){
 const {width,height,data}=reflectionProbePixels(preset);
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
 texture.mapping=THREE.EquirectangularReflectionMapping;
 texture.needsUpdate=true;
 const pmrem=new THREE.PMREMGenerator(renderer),probe=pmrem.fromEquirectangular(texture);
 scene.environment=probe.texture;texture.dispose();pmrem.dispose();
 return createReflectionController(scene,width,height);
}
export function createReflectionController(scene,width=256,height=128){
 const base=new WeakMap(),materials=new Set();let lastScan=-Infinity,clock=0;
 return {update(dt,darkness){
  clock+=Math.max(0,dt);
  if(clock-lastScan>1||dt===0){
   lastScan=clock;materials.clear();
   scene.traverse(o=>{for(const m of (Array.isArray(o.material)?o.material:[o.material])){
    if(m?.isMeshStandardMaterial&&!materials.has(m)){
     if(!base.has(m))base.set(m,m.envMapIntensity);
     materials.add(m);
    }
   }});
  }
  const strength=.54*(1-darkness)+.16*darkness;
  for(const m of materials)m.envMapIntensity=base.get(m)*strength;
 },stats:()=>({probeSize:[width,height],materials:materials.size,extraFramePasses:0,
  strengthRange:[Math.min(...Array.from(materials,m=>m.envMapIntensity/(base.get(m)||1))),Math.max(...Array.from(materials,m=>m.envMapIntensity/(base.get(m)||1)))]})};
}
