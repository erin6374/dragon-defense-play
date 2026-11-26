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
 let strikes=0;
 const stamp=(x,y,z,radius)=>{
  const r=radius*1.2;
  const idx=strikes%MAX_IMPACTS;
  impactPoints[idx].set(x,y,z,Math.max(1.8,radius));
  strikes++;
  impactCount.value=Math.min(strikes,MAX_IMPACTS);

  const low=(p,origin)=>Math.max(0,Math.floor((p-origin-r)/cell));
  const high=(p,origin,count)=>Math.min(count-1,Math.ceil((p-origin+r)/cell));
  for(let k=low(z,min.z);k<=high(z,min.z,depth);k++){
   const dz=min.z+(k+.5)*cell-z;
   for(let j=low(y,min.y);j<=high(y,min.y,height);j++){
    const dy=min.y+(j+.5)*cell-y;
    for(let i=low(x,min.x);i<=high(x,min.x,width);i++){
     const dx=min.x+(i+.5)*cell-x;
     const edge=radius*(.92+.13*Math.sin(dx*3.7+dy*2.9+dz*4.1));
     const t=1-Math.hypot(dx,dy,dz)/edge;
     if(t<=0)continue;
     const offset=(k*height+j)*width+i;
     pixels[offset]=Math.max(pixels[offset],Math.min(255,Math.round(t*420)));
    }
   }
  }
  texture.needsUpdate=true;
  if(texture.source)texture.source.needsUpdate=true;
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
   shader.vertexShader='varying vec3 schoolDamagePosition;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',
    '#include <worldpos_vertex>\n schoolDamagePosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
   shader.fragmentShader=`varying vec3 schoolDamagePosition;
    uniform highp sampler3D schoolDamageMap;
    uniform vec3 schoolDamageMin;
    uniform vec3 schoolDamageSize;
    uniform float schoolDestructionRatio;
    uniform vec4 uSchoolImpacts[16];
    uniform int uSchoolImpactCount;\n`+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`
    #include <clipping_planes_fragment>
    // RC167: High-performance GPU-friendly 3D texture crater lookup & floor collapse
    float damage=0.0;
    vec3 damageUv=(schoolDamagePosition-schoolDamageMin)/max(schoolDamageSize,vec3(0.001));
    if(all(greaterThanEqual(damageUv,vec3(0.0)))&&all(lessThanEqual(damageUv,vec3(1.0)))){
     damage=texture(schoolDamageMap,damageUv).r;
     if(damage>${glass?'.22':'.48'})discard;
    }

    // Direct impact craters
    if(uSchoolImpactCount>0){
     for(int i=0;i<8;i++){
      if(i>=uSchoolImpactCount)break;
      vec3 c=uSchoolImpacts[i].xyz;
      float baseR=uSchoolImpacts[i].w${glass?'*1.55':''};
      if(baseR>0.05){
       vec3 delta=schoolDamagePosition-c;
       if(dot(delta,delta)<baseR*baseR){discard;}
      }
     }
    }

    // Gradual progressive floor collapse
    if(schoolDestructionRatio>0.02){
     float normY=clamp((schoolDamagePosition.y-schoolDamageMin.y)/max(schoolDamageSize.y,0.001),0.0,1.0);
     float collapseCutoff=(1.0-normY)*0.92;
     if(collapseCutoff<schoolDestructionRatio){discard;}
    }`);
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
  material.customProgramCacheKey=()=> 'tech-freire-source-damage-3d-roomlight-v4-'+material.name;
 };
 return {
  stamp,
  patch,
  strikes:()=>strikes,
  impacts:()=>impactPoints.slice(0,impactCount.value),
  setDestruction:ratio=>{destructionRatio.value=THREE.MathUtils.clamp(ratio,0,1);},
  reset:()=>{
   pixels.fill(0);
   strikes=0;
   destructionRatio.value=0;
   impactCount.value=0;
   for(const p of impactPoints)p.set(0,0,0,0);
   texture.needsUpdate=true;
   if(texture.source)texture.source.needsUpdate=true;
  }
 };
}
