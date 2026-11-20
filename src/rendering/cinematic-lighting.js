import * as THREE from 'three';

// An original high-dynamic-range analytic sky & city probe supplies rich reflection information
// for glass and glazing across all North Broad Street buildings. Prefiltered once at startup.
export function reflectionProbePixels(preset='standard'){
 const width=preset==='cinematic'?512:256,height=preset==='cinematic'?256:128;
 const data=new Uint8Array(width*height*4);
 const sky=new THREE.Color();
 const skyTop=new THREE.Color(0x487cb0);      // Crisp daylight blue exosphere
 const horizon=new THREE.Color(0xffaa5e);     // Radiant Philadelphia amber sunset horizon
 const ground=new THREE.Color(0x181e26);      // Dark street asphalt baseline
 const meteorFire=new THREE.Color(0xffdd44);  // Brilliant meteor streak reflection

 for(let y=0;y<height;y++){
  for(let x=0;x<width;x++){
   const elevation=-Math.cos(y/(height-1)*Math.PI);
   if(elevation>=0){
    sky.copy(horizon).lerp(skyTop,Math.pow(elevation,0.6));
   }else{
    sky.copy(horizon).lerp(ground,Math.min(1,-elevation*4.5));
   }
   const azimuth=x/width*Math.PI*2;
   // Luminous softbox sunlight & cloud highlight
   const softbox=Math.exp(-Math.pow((azimuth-1.85)*2.4,2)-Math.pow((elevation-0.32)*3.0,2));
   sky.r+=softbox*1.2;
   sky.g+=softbox*1.2;
   sky.b+=softbox*1.2;

   // Distinct Center City Philadelphia skyline silhouette in southern/eastern azimuth:
   // One Liberty Place spire, Two Liberty Place, City Hall tower, Comcast Technology Center
   const towerAzimuth=azimuth-3.8;
   if(Math.abs(towerAzimuth)<1.2&&elevation>0&&elevation<0.42){
    // Liberty Place chevron spire
    const distLiberty=Math.abs(towerAzimuth+0.25);
    const libertyH=Math.max(0,0.34-distLiberty*1.8);
    // Comcast Center vertical monolith
    const distComcast=Math.abs(towerAzimuth-0.35);
    const comcastH=distComcast<0.09?0.38:0;
    // City Hall tower & statue
    const distCityHall=Math.abs(towerAzimuth+0.65);
    const cityHallH=distCityHall<0.06?0.30:(distCityHall<0.14?0.18:0);
    const maxTowerH=Math.max(libertyH,comcastH,cityHallH);
    if(elevation<maxTowerH){
     // Silhouette with lit office window grid
     const litWin=(Math.sin(x*1.8)*Math.sin(y*2.4)>0.3);
     if(litWin&&elevation>0.04){
      sky.setHex(0xfff0aa);
     }else{
      sky.lerp(new THREE.Color(0x1a2636),0.88);
     }
    }
   }

   // Opposite side of North Broad Street architectural reflection (facing west across street)
   const acrossStreet=Math.cos(azimuth);
   if(acrossStreet>0.15){
    const viewWeight=(acrossStreet-0.15)/0.85;
    const roofLine=0.10+Math.sin(azimuth*14.0)*0.04+Math.sin(azimuth*31.0)*0.018;
    if(elevation<roofLine&&elevation>-0.08){
     const buildingHue=(Math.sin(azimuth*18.0)>0)?new THREE.Color(0x8a4d40):new THREE.Color(0xa89985);
     sky.lerp(buildingHue,viewWeight*0.75);
     
     // Repeating rows of bright illuminated classroom and apartment window sashes
     const winX=Math.sin(azimuth*52.0),winY=Math.sin((elevation-0.01)*75.0);
     if(Math.abs(winX)>0.32&&Math.abs(winY)>0.30&&elevation>-0.05){
      const windowGlow=new THREE.Color(0xffe8a0);
      sky.lerp(windowGlow,viewWeight*1.2);
     }
     // Storefront display glazing & illuminated signs
     if(elevation>-0.07&&elevation<-0.01){
      const shopLight=new THREE.Color((Math.sin(azimuth*22.0)>0)?0xffc870:0x88d4ff);
      sky.lerp(shopLight,viewWeight*1.1);
     }
    }
    // Opposite streetlights along North Broad curb: bright luminous accents
    const lampSpacing=Math.sin(azimuth*28.0);
    if(lampSpacing>0.90&&Math.abs(elevation-0.01)<0.03){
     sky.lerp(new THREE.Color(0xffeedd),viewWeight*1.4);
    }
    // Rain-slicked wet asphalt street reflection below the curb
    if(elevation<=-0.08&&elevation>-0.42){
     const roadReflect=new THREE.Color(0x1a222c);
     const streak=Math.max(0,Math.sin(azimuth*28.0)>0.82?0.6:0)+Math.max(0,Math.sin(azimuth*52.0)>0.45?0.4:0);
     const streakColor=new THREE.Color(0xffba66).multiplyScalar(streak);
     roadReflect.r+=streakColor.r;roadReflect.g+=streakColor.g;roadReflect.b+=streakColor.b;
     sky.lerp(roadReflect,viewWeight*0.9);
    }
   }

   // Brilliant diagonal meteor fire streak across the sky dome
   const meteorLine=Math.abs((elevation*2.0)-(azimuth*0.4)+0.2);
   if(meteorLine<0.025&&elevation>0.15&&elevation<0.75){
    const meteorIntensity=(1.0-(meteorLine/0.025))*1.8;
    sky.r+=meteorFire.r*meteorIntensity;
    sky.g+=meteorFire.g*meteorIntensity;
    sky.b+=meteorFire.b*meteorIntensity;
   }

   const i=(y*width+x)*4;
   data[i]=Math.min(255,sky.r*255);
   data[i+1]=Math.min(255,sky.g*255);
   data[i+2]=Math.min(255,sky.b*255);
   data[i+3]=255;
  }
 }
 return {width,height,data};
}

export function createCinematicLighting(renderer,scene,preset='standard'){
 const {width,height,data}=reflectionProbePixels(preset);
 const texture=new THREE.DataTexture(data,width,height,THREE.RGBAFormat);
 texture.mapping=THREE.EquirectangularReflectionMapping;
 texture.needsUpdate=true;
 const pmrem=new THREE.PMREMGenerator(renderer),probe=pmrem.fromEquirectangular(texture);
 scene.environment=probe.texture;
 texture.dispose();
 pmrem.dispose();
 const controller=createReflectionController(scene,width,height);
 controller.update(0,0);
 return controller;
}

export function createReflectionController(scene,width=256,height=128){
 const base=new WeakMap(),materials=new Set();
 let lastScan=-Infinity,clock=0;
 return {
  update(dt,darkness){
   clock+=Math.max(0,dt);
   if(clock-lastScan>0.2||dt===0){
    lastScan=clock;
    materials.clear();
    scene.traverse(o=>{
     if(!o.isMesh||!o.material)return;
     const mats=Array.isArray(o.material)?o.material:[o.material];
     for(const m of mats){
      if(!m)continue;
      const name=((m.name||'')+' '+(o.name||'')+' '+(o.parent?.name||'')).toLowerCase();
      const isWindow=m.isMeshPhysicalMaterial||name.includes('glass')||name.includes('window')||name.includes('glazing')||m.name==='window-glass'||(m.roughness??1)<=0.15;
      if(isWindow){
       if(!m.envMap&&scene.environment){
        m.envMap=scene.environment;
        m.needsUpdate=true;
       }
       m.envMapIntensity=3.2;
       m.clearcoat=1.0;
       m.clearcoatRoughness=0.06;
       materials.add(m);
      }else{
       // Masonry, roofs, concrete, asphalt remain strictly matte with zero/minimal reflection
       m.envMapIntensity=0.02;
      }
     }
    });
   }
  },
  stats:()=>({probeSize:[width,height],materials:materials.size,extraFramePasses:0})
 };
}
