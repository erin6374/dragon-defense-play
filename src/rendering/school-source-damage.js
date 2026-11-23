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
    vec3 damageUv=(schoolDamagePosition-schoolDamageMin)/schoolDamageSize;
    float damage=0.0;
    if(all(greaterThanEqual(damageUv,vec3(0.0)))&&all(lessThanEqual(damageUv,vec3(1.0)))){
     damage=texture(schoolDamageMap,damageUv).r;
    }
    if(damage>${glass?'.24':'.53'})discard;

    // Dynamic procedural 3D crater carving for every meteor hit:
    // Carves out the exact section where the meteor hit with jagged procedural fracture edges!
    for(int i = 0; i < 16; i++){
      if(i >= uSchoolImpactCount) break;
      vec3 c = uSchoolImpacts[i].xyz;
      float baseR = uSchoolImpacts[i].w;
      if(baseR <= 0.05) continue;

      // High-frequency 3D procedural noise creates organic jagged bite edges
      float noise3D = sin(schoolDamagePosition.x*2.15 + schoolDamagePosition.y*2.85)*0.22 +
                      cos(schoolDamagePosition.z*2.65 - schoolDamagePosition.y*1.75)*0.18 +
                      sin(schoolDamagePosition.x*3.71 - schoolDamagePosition.z*3.33)*0.12;
      float r = baseR * (1.0 + noise3D);
      // Glass curtain wall blows out 45% wider than concrete/masonry:
      if(${glass ? 'true' : 'false'}) {
        r *= 1.45;
      }

      // Procedural vertical height sectioning:
      // 1) First-floor strike (c.y <= 4.5m): facade and floor slab blow out,
      //    while upper 3 or 4 floors and roof (Y > 7.8m) remain standing overhead!
      bool isGroundStrike = c.y <= 4.5;
      if(isGroundStrike && schoolDamagePosition.y > 7.8) continue;

      // 2) Roof strike (c.y >= 18.0m): roof and cornice crumple,
      //    while lower floors (Y < 16.0m) remain solidly standing!
      bool isRoofStrike = c.y >= 18.0;
      if(isRoofStrike && schoolDamagePosition.y < 16.0) continue;

      // 3) Mid-level strike (4.5m < c.y < 18.0m): mid-level cavity blown out,
      //    while the top floor / roof level (Y > 21.5m) remains standing overhead!
      bool isMidStrike = c.y > 4.5 && c.y < 18.0;
      if(isMidStrike && schoolDamagePosition.y > 21.5) continue;

      if(length(schoolDamagePosition - c) < r) discard;
    }

    // Catastrophic collapse only when building reaches 96%+ destruction
    if(schoolDestructionRatio >= 0.96){
      float normH=clamp((schoolDamagePosition.y-schoolDamageMin.y)/max(schoolDamageSize.y,0.001),0.0,1.0);
      float endCollapse = mix(1.0, 0.05, clamp((schoolDestructionRatio - 0.96) / 0.04, 0.0, 1.0));
      if(normH > endCollapse) discard;
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
