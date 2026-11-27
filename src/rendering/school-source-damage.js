import * as THREE from 'three';

// One cell is roughly half a game unit. Damage stays in world space so a
// hit on the street façade cannot punch the same hole through the back wall.
export function createSchoolSourceDamage() {
 const min=new THREE.Vector3(-18,-7,-68),size=new THREE.Vector3(36,46,76);
 const width=72,height=92,depth=152,cell=.5;
 const pixels=new Uint8Array(width*height*depth);
 const texture=new THREE.Data3DTexture(pixels,width,height,depth);
 texture.format=THREE.RedFormat;
 texture.minFilter=texture.magFilter=THREE.LinearFilter;
 texture.needsUpdate=true;
 const destructionRatio={value:0.0};
 const MAX_IMPACTS=16;
 const impactPoints=Array.from({length:MAX_IMPACTS},()=>new THREE.Vector4(0,0,0,0));
 const impactCount={value:0};
 const impactBoundsMin={value:new THREE.Vector3(0,0,0)},impactBoundsMax={value:new THREE.Vector3(0,0,0)};
 let strikes=0,dirtyCells=0,textureUpdates=1,unchangedStamps=0;
 function updateImpactBounds(){
  let x0=Infinity,y0=Infinity,z0=Infinity,x1=-Infinity,y1=-Infinity,z1=-Infinity;
  for(let i=0;i<impactCount.value;i++){
   const p=impactPoints[i],r=p.w*1.55+.1;
   x0=Math.min(x0,p.x-r);y0=Math.min(y0,p.y-r);z0=Math.min(z0,p.z-r);
   x1=Math.max(x1,p.x+r);y1=Math.max(y1,p.y+r);z1=Math.max(z1,p.z+r);
  }
  impactBoundsMin.value.set(x0,y0,z0);impactBoundsMax.value.set(x1,y1,z1);
 }
 const stamp=(x,y,z,radius)=>{
  if(![x,y,z,radius].every(Number.isFinite)||radius<=0)return false;
  const r=radius*1.2;
  const idx=strikes%MAX_IMPACTS;
  impactPoints[idx].set(x,y,z,Math.max(1.8,radius));
  strikes++;
  impactCount.value=Math.min(strikes,MAX_IMPACTS);
  updateImpactBounds();

  const low=(p,origin)=>Math.max(0,Math.floor((p-origin-r)/cell));
  const high=(p,origin,count)=>Math.min(count-1,Math.ceil((p-origin+r)/cell));
  const lx=low(x,min.x),hx=high(x,min.x,width),ly=low(y,min.y),hy=high(y,min.y,height),lz=low(z,min.z),hz=high(z,min.z,depth);
  const maxEdgeSq=(radius*1.050001)**2;let changed=0;
  for(let k=lz;k<=hz;k++){
   const dz=min.z+(k+.5)*cell-z;
   for(let j=ly;j<=hy;j++){
    const dy=min.y+(j+.5)*cell-y,dyz=dy*dy+dz*dz;
    if(dyz>=maxEdgeSq)continue;
    const row=(k*height+j)*width;
    for(let i=lx;i<=hx;i++){
     const offset=row+i;if(pixels[offset]===255)continue;
     const dx=min.x+(i+.5)*cell-x;if(dx*dx+dyz>=maxEdgeSq)continue;
     const edge=radius*(.92+.13*Math.sin(dx*3.7+dy*2.9+dz*4.1));
     const t=1-Math.hypot(dx,dy,dz)/edge;
     if(t<=0)continue;
     const value=Math.min(255,Math.round(t*420));
     if(value>pixels[offset]){if(!pixels[offset])dirtyCells++;pixels[offset]=value;changed++;}
    }
   }
  }
  if(changed){texture.needsUpdate=true;textureUpdates++;}else unchangedStamps++;
  return changed>0;
 };
 const patch=material=>{
  const glass=material.name==='school-glass';
  const brick=material.name==='school-brick';
  material.onBeforeCompile=shader=>{
   shader.uniforms.schoolDamageMap={value:texture};
   shader.uniforms.schoolDamageMin={value:min};
   shader.uniforms.schoolDamageSize={value:size};
   shader.uniforms.schoolDestructionRatio=destructionRatio;
   shader.uniforms.uSchoolImpacts={value:impactPoints};
   shader.uniforms.uSchoolImpactCount=impactCount;
   shader.uniforms.uSchoolImpactBoundsMin=impactBoundsMin;shader.uniforms.uSchoolImpactBoundsMax=impactBoundsMax;
   shader.vertexShader='varying vec3 schoolDamagePosition;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',
    '#include <worldpos_vertex>\n schoolDamagePosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
   shader.fragmentShader=`varying vec3 schoolDamagePosition;
    uniform highp sampler3D schoolDamageMap;
    uniform vec3 schoolDamageMin;
    uniform vec3 schoolDamageSize;
    uniform float schoolDestructionRatio;
    uniform vec4 uSchoolImpacts[16];
    uniform int uSchoolImpactCount;
    uniform vec3 uSchoolImpactBoundsMin;
    uniform vec3 uSchoolImpactBoundsMax;\n`+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`
    #include <clipping_planes_fragment>
    // RC167: High-performance GPU-friendly 3D texture crater lookup & floor collapse
    float damage=0.0;
    vec3 damageUv=(schoolDamagePosition-schoolDamageMin)/max(schoolDamageSize,vec3(0.001));
    if(uSchoolImpactCount>0&&all(greaterThanEqual(damageUv,vec3(0.0)))&&all(lessThanEqual(damageUv,vec3(1.0)))){
     damage=texture(schoolDamageMap,damageUv).r;
     if(damage>${glass?'.22':'.48'})discard;
    }

    // Direct impact craters
    if(uSchoolImpactCount>0&&all(greaterThanEqual(schoolDamagePosition,uSchoolImpactBoundsMin))&&all(lessThanEqual(schoolDamagePosition,uSchoolImpactBoundsMax))){
     for(int i=0;i<16;i++){
      if(i>=uSchoolImpactCount)break;
      vec3 c=uSchoolImpacts[i].xyz;
      float baseR=uSchoolImpacts[i].w${glass?'*1.55':''};
      if(baseR>0.05){
       vec3 delta=schoolDamagePosition-c;
       if(dot(delta,delta)<baseR*baseR){discard;}
      }
     }
    }

    // The health gauge is not a global horizontal clipping plane. Physical
    // components and localized damage masks define the visible damage.
    if(schoolDestructionRatio>=1.0){discard;}`);
   if(brick)shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`
    #include <color_fragment>
    // Authentic North Broad brick color tone with subtle vertical weathering
    float weather=sin(schoolDamagePosition.y*0.8)*0.08;
    diffuseColor.rgb*=(0.96+weather);
   `);
   // Light the existing interior surfaces by classroom bay, rather than
   // making every retained surface an equally bright beige rectangle.
   // Stable building coordinates keep light variation fixed during camera motion.
   if(material.name==='school-interior')shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`
    #include <emissivemap_fragment>
    vec3 roomCoord=(schoolDamagePosition-schoolDamageMin)/max(schoolDamageSize,vec3(.001));
    vec2 roomCell=floor(vec2(clamp(roomCoord.x,0.0,.999)*4.0,clamp(roomCoord.y,0.0,.999)*5.0));
    float roomSeed=fract(sin(dot(roomCell,vec2(17.17,91.73)))*43758.54);
    float roomHeight=fract(clamp(roomCoord.y,0.0,.999)*5.0);
    float ceilingBounce=smoothstep(.50,.88,roomHeight);
    float occupied=mix(.18,1.0,step(.24,roomSeed));
    totalEmissiveRadiance*=occupied*(.30+.70*ceilingBounce);
    totalEmissiveRadiance*=mix(vec3(1.0,.84,.66),vec3(.94,.98,1.0),roomSeed);
   `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',
    '#include <dithering_fragment>\n gl_FragColor.rgb*=1.0-.65*smoothstep(.03,.53,damage);');
  };
  material.customProgramCacheKey=()=> 'tech-freire-source-damage-3d-roomlight-v6-'+material.name;
 };
 return {
  stamp,
  patch,
  strikes:()=>strikes,
  stats:()=>({strikes,dirtyCells,textureUpdates,unchangedStamps,textureBytes:pixels.byteLength}),
  impacts:()=>impactPoints.slice(0,impactCount.value),
  setDestruction:ratio=>{destructionRatio.value=THREE.MathUtils.clamp(ratio,0,1);},
  reset:()=>{
   if(dirtyCells){pixels.fill(0);texture.needsUpdate=true;textureUpdates++;}
   dirtyCells=0;unchangedStamps=0;
   strikes=0;
   destructionRatio.value=0;
   impactCount.value=0;
   for(const p of impactPoints)p.set(0,0,0,0);
   impactBoundsMin.value.set(0,0,0);impactBoundsMax.value.set(0,0,0);
  }
 };
}
