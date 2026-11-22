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
 let strikes=0;
 const stamp=(x,y,z,radius)=>{
  const r=radius*1.2;
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
  strikes++;
  texture.needsUpdate=true;
 };
 const patch=material=>{
  const glass=material.name==='school-glass';
  const brick=material.name==='school-brick';
  material.onBeforeCompile=shader=>{
   shader.uniforms.schoolDamageMap={value:texture};
   shader.uniforms.schoolDamageMin={value:min};
   shader.uniforms.schoolDamageSize={value:size};
   shader.uniforms.schoolDestructionRatio=destructionRatio;
   shader.vertexShader='varying vec3 schoolDamagePosition;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',
    '#include <worldpos_vertex>\n schoolDamagePosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
   shader.fragmentShader=`varying vec3 schoolDamagePosition;
    uniform highp sampler3D schoolDamageMap;
    uniform vec3 schoolDamageMin;
    uniform vec3 schoolDamageSize;
    uniform float schoolDestructionRatio;\n`+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`
    #include <clipping_planes_fragment>
    vec3 damageUv=(schoolDamagePosition-schoolDamageMin)/schoolDamageSize;
    float damage=0.0;
    if(all(greaterThanEqual(damageUv,vec3(0.0)))&&all(lessThanEqual(damageUv,vec3(1.0)))){
     damage=texture(schoolDamageMap,damageUv).r;
    }
    if(damage>${glass?'.24':'.53'})discard;
     // Procedural volumetric 3D chunk damage:
     // Large irregular chunks/craters carve out the lower and middle storeys
     // while leaving upper floors and roof parapets intact overhead!
     if(schoolDestructionRatio > 0.04){
       float noise3D = sin(schoolDamagePosition.x*1.35 + schoolDamagePosition.y*1.85)*0.24 +
                       cos(schoolDamagePosition.z*1.95 - schoolDamagePosition.y*1.15)*0.18 +
                       sin(schoolDamagePosition.x*2.71 - schoolDamagePosition.z*2.33)*0.12;
       // Chunk 1: Middle-East facade breach (X ≈ 6.5, Y ≈ 10.5, Z ≈ -1.0)
       vec3 c1 = vec3(6.5, 10.5, -1.0);
       float r1 = max(0.0, (schoolDestructionRatio - 0.06) * 11.5) * (1.0 + noise3D);
       if(length(schoolDamagePosition - c1) < r1) discard;
       // Chunk 2: Mid-Level Entrance & Atrium cavity (X ≈ -4.0, Y ≈ 7.0, Z ≈ -2.0)
       vec3 c2 = vec3(-4.0, 7.0, -2.0);
       float r2 = max(0.0, (schoolDestructionRatio - 0.20) * 12.0) * (1.0 + noise3D);
       if(length(schoolDamagePosition - c2) < r2) discard;
       // Chunk 3: West wing 3rd-floor structural bite (X ≈ -8.5, Y ≈ 14.0, Z ≈ -3.5)
       vec3 c3 = vec3(-8.5, 14.0, -3.5);
       float r3 = max(0.0, (schoolDestructionRatio - 0.38) * 10.5) * (1.0 + noise3D);
       if(length(schoolDamagePosition - c3) < r3) discard;
       // Chunk 4: Rear-East Classroom blast punch (X ≈ 5.0, Y ≈ 12.0, Z ≈ -12.0)
       vec3 c4 = vec3(5.0, 12.0, -12.0);
       float r4 = max(0.0, (schoolDestructionRatio - 0.55) * 12.5) * (1.0 + noise3D);
       if(length(schoolDamagePosition - c4) < r4) discard;
       // Catastrophic collapse only when building reaches 96%+ destruction
       if(schoolDestructionRatio >= 0.96){
         float normH=clamp((schoolDamagePosition.y-schoolDamageMin.y)/max(schoolDamageSize.y,0.001),0.0,1.0);
         float endCollapse = mix(1.0, 0.05, clamp((schoolDestructionRatio - 0.96) / 0.04, 0.0, 1.0));
         if(normH > endCollapse) discard;
       }
     }`);
   if(brick)shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`
    #include <color_fragment>
    vec3 surfaceNormal=abs(normalize(cross(dFdx(schoolDamagePosition),dFdy(schoolDamagePosition))));
    float horizontal=surfaceNormal.x>surfaceNormal.z?schoolDamagePosition.z:schoolDamagePosition.x;
    vec2 course=vec2(horizontal/.235,schoolDamagePosition.y/.083);
    course.x+=mod(floor(course.y),2.0)*.5;
    vec2 joint=abs(fract(course)-.5);
    vec2 footprint=fwidth(course);
    float mortar=max(smoothstep(.46-footprint.x,.46+footprint.x,joint.x),
     smoothstep(.44-footprint.y,.44+footprint.y,joint.y));
    float variation=fract(sin(dot(floor(course),vec2(31.74,17.16)))*43758.54);
    float detail=1.0-smoothstep(.60,1.65,max(footprint.x,footprint.y));
    vec3 masonry=mix(diffuseColor.rgb*mix(.76,1.23,variation),vec3(.19,.155,.13),mortar*.70);
    diffuseColor.rgb=mix(diffuseColor.rgb,masonry,detail*(1.0-surfaceNormal.y));
    // Broad weathering survives gameplay distance when individual brick
    // courses are subpixel. It stays anchored to the original model surface.
    float weather=.5+.22*sin(horizontal*3.1+sin(schoolDamagePosition.y*2.4))+
     .16*sin(horizontal*8.7-schoolDamagePosition.y*5.3);
    float runoff=pow(.5+.5*sin(horizontal*9.2),5.)*.07;
    diffuseColor.rgb*=.88+.22*weather-runoff;

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
  material.customProgramCacheKey=()=> 'tech-freire-source-damage-3d-roomlight-v3-'+material.name;
 };
 return {stamp,patch,strikes:()=>strikes,setDestruction:ratio=>{destructionRatio.value=THREE.MathUtils.clamp(ratio,0,1);},reset:()=>{
  pixels.fill(0);
  strikes=0;
  destructionRatio.value=0;
  texture.needsUpdate=true;
 }};
}
