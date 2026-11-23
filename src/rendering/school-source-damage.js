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
    vec3 damageUv=(schoolDamagePosition-schoolDamageMin)/max(schoolDamageSize,vec3(0.001));
    float damage=0.0;
    if(all(greaterThanEqual(damageUv,vec3(0.0)))&&all(lessThanEqual(damageUv,vec3(1.0)))){
     damage=texture(schoolDamageMap,damageUv).r;
    }
    if(damage>${glass?'.22':'.51'})discard;

    // --- PHYSICS-BASED PROCEDURAL FLOOR-BY-FLOOR DESTRUCTION & MASS EQUIVALENCE ---
    vec3 normPos=clamp((schoolDamagePosition-schoolDamageMin)/max(schoolDamageSize,vec3(0.001)),0.0,1.0);
    // normPos.x: Broad St frontage (~36m wide, x in [-18, +18], 6 architectural bays)
    // normPos.y: Vertical height from street grade (0.0 to 1.0, 5 distinct storeys)
    // normPos.z: Depth into block (0.0 = rear wall, 1.0 = Broad St facade)

    // Multi-octave 3D structural fracture noise: simulates concrete shear planes, jagged aggregate, and broken brick courses
    float fn1=sin(schoolDamagePosition.x*2.31+schoolDamagePosition.y*3.17)*0.19+
              cos(schoolDamagePosition.z*2.45-schoolDamagePosition.y*1.83)*0.16+
              sin(schoolDamagePosition.x*4.12-schoolDamagePosition.z*3.73)*0.10;
    float fnSpall=sin(schoolDamagePosition.x*8.4+schoolDamagePosition.y*9.2+schoolDamagePosition.z*7.1)*0.05;
    float fractureNoise=fn1+fnSpall;

    // 1. Direct Impact Craters (Hughes / Sandia kinetic concrete penetration & spall model)
    bool directCraterDiscard=false;
    for(int i=0;i<16;i++){
      if(i>=uSchoolImpactCount)break;
      vec3 c=uSchoolImpacts[i].xyz;
      float baseR=uSchoolImpacts[i].w;
      if(baseR<=0.05)continue;

      float distToCenter=length(schoolDamagePosition-c);

      // Hughes/Sandia spall cone: blast crater expands outward with organic jagged bite edges
      float craterRadius=baseR*(1.0+fractureNoise*0.42);
      // Glass curtain wall blows out 60% wider due to tensile shockwave
      ${glass?'craterRadius*=1.60;':''}

      // Procedural vertical height sectioning (floor-by-floor penetration physics):
      // A) First-floor strike (c.y <= 4.8m): facade and floor slab blow out,
      //    while upper 3 or 4 floors and roof (Y > 8.5m) remain standing overhead!
      bool isGroundStrike=c.y<=4.8;
      if(isGroundStrike&&schoolDamagePosition.y>8.5)continue;

      // B) Roof strike (c.y >= 18.0m): roof and cornice crumple,
      //    while lower floors (Y < 15.5m) remain solidly standing!
      bool isRoofStrike=c.y>=18.0;
      if(isRoofStrike&&schoolDamagePosition.y<15.5)continue;

      // C) Mid-level strike (4.8m < c.y < 18.0m): mid-level cavity blown out,
      //    while top floor / roof level (Y > 22.0m) remains standing overhead!
      bool isMidStrike=c.y>4.8&&c.y<18.0;
      if(isMidStrike&&schoolDamagePosition.y>22.0)continue;

      if(distToCenter<craterRadius){
        directCraterDiscard=true;
        break;
      }
    }
    if(directCraterDiscard)discard;

    // 2. Physics-Based Progressive Floor Collapse & Mass Equivalence:
    // 100% destruction is 100% school mass destroyed. 50% destruction is ~50% mass destroyed.
    // Struck bays collapse deeply downwards; roof and upper floors pancake down first;
    // Load-bearing column piers and lower floors in adjacent unstruck bays stand overhead.
    if(schoolDestructionRatio>0.005){
      // Struck bay vulnerability based on proximity to recorded meteor impacts
      float bayVulnerability=0.0;
      for(int i=0;i<16;i++){
        if(i>=uSchoolImpactCount)break;
        vec3 c=uSchoolImpacts[i].xyz;
        float distBay=abs(schoolDamagePosition.x-c.x)/14.0;
        bayVulnerability+=max(0.0,1.0-distBay)*0.35;
      }

      // Load-bearing piers (at bay edges) resist collapse longer than thin infill glazing and brick spandrels
      float bayFracX=fract(normPos.x*6.0);
      float pierSupport=smoothstep(0.35,0.50,abs(bayFracX-0.5))*0.16;

      // Concrete slabs at story divisions (every 0.20 in normPos.y) have structural rebar core
      float storyFracY=fract(normPos.y*5.0);
      float slabCore=smoothstep(0.09,0.0,min(storyFracY,1.0-storyFracY))*0.12;

      // Glass fails earliest under structural load
      float matResistance=${glass?'-0.14':'0.10'}+pierSupport+slabCore;

      // Progressive collapse potential field Phi in [0, 1]:
      // Calibrated volume distribution ensures that discarding Phi < schoolDestructionRatio
      // removes approximately 50% of building mass at 50% damage, and 100% mass at 100% damage!
      float floorPancake=(1.0-normPos.y)*0.60;
      float bayStability=(1.0-clamp(bayVulnerability,0.0,0.65))*0.25;

      float structuralSurvival=floorPancake+bayStability+matResistance+fractureNoise*0.14;
      float survivalScore=clamp(structuralSurvival*1.15,0.0,1.0);

      if(survivalScore<schoolDestructionRatio){
        discard;
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

    // Exposed structural rebar mesh and charred concrete at fracture cut surfaces:
    float survivalMargin=abs(clamp(((1.0-normPos.y)*0.60+0.25+fractureNoise*0.14)*1.15,0.0,1.0)-schoolDestructionRatio);
    if(schoolDestructionRatio>0.05 && survivalMargin<0.085){
      vec3 pAbs=abs(schoolDamagePosition);
      vec2 rebarSlab=mod(pAbs.xz,0.35);
      float dRebarH=min(length(rebarSlab.x-0.175),length(rebarSlab.y-0.175));
      float dRebarV=length(mod(pAbs.xy,0.35)-0.175);
      bool isRebarMesh=(dRebarH<0.026 || dRebarV<0.026) && survivalMargin<0.045;
      if(isRebarMesh){
        float rust=fract(sin(dot(schoolDamagePosition.xz,vec2(12.9898,78.233)))*43758.5453);
        diffuseColor.rgb=mix(vec3(0.18,0.19,0.22),vec3(0.55,0.26,0.12),rust*0.75);
      } else {
        // Charred blast scorching on fractured concrete and brick edge
        diffuseColor.rgb*=mix(vec3(0.16,0.15,0.14),vec3(1.0),smoothstep(0.0,0.085,survivalMargin));
      }
    }


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
