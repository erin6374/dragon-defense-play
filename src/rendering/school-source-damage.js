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
  const interior=material.name==='school-interior';
  material.onBeforeCompile=shader=>{
   shader.uniforms.schoolDamageMap={value:texture};
   shader.uniforms.schoolDamageMin={value:min};
   shader.uniforms.schoolDamageSize={value:size};
   shader.vertexShader='varying vec3 schoolDamagePosition;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',
    '#include <worldpos_vertex>\n schoolDamagePosition=(modelMatrix*vec4(transformed,1.0)).xyz;');
   shader.fragmentShader=`varying vec3 schoolDamagePosition;
    uniform highp sampler3D schoolDamageMap;
    uniform vec3 schoolDamageMin;
    uniform vec3 schoolDamageSize;\n`+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`
    #include <clipping_planes_fragment>
    vec3 damageUv=(schoolDamagePosition-schoolDamageMin)/schoolDamageSize;
    float damage=0.0;
    if(all(greaterThanEqual(damageUv,vec3(0.0)))&&all(lessThanEqual(damageUv,vec3(1.0)))){
     damage=texture(schoolDamageMap,damageUv).r;
    }
    if(damage>${glass?'.24':'.53'})discard;`);
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
   if(interior)shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>',`
    #include <emissivemap_fragment>
    // The retained FBX interior previously emitted uniformly across every
    // surface. Stable room-scale light pools give the glazing real depth;
    // they do not add fake window planes or change the model/damage mask.
    vec3 roomCell=floor((schoolDamagePosition+vec3(18.,7.,68.))/vec3(5.2,6.1,7.4));
    float roomSeed=fract(sin(dot(roomCell,vec3(17.13,43.71,29.57)))*43758.5453);
    float roomLight=mix(.18,.82,smoothstep(.20,.78,roomSeed));
    vec2 roomLocal=fract((schoolDamagePosition.xz+vec2(18.,68.))/vec2(5.2,7.4));
    vec2 lightPool=sin(roomLocal*3.14159265);
    float interiorFalloff=.48+.52*lightPool.x*lightPool.y;
    totalEmissiveRadiance*=roomLight*interiorFalloff;
   `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',
    '#include <dithering_fragment>\n gl_FragColor.rgb*=1.0-.65*smoothstep(.03,.53,damage);');
  };
  material.customProgramCacheKey=()=> 'tech-freire-source-damage-3d-room-light-v2-'+glass+'-'+brick+'-'+interior;
 };
 return {stamp,patch,strikes:()=>strikes,reset:()=>{
  pixels.fill(0);
  strikes=0;
  texture.needsUpdate=true;
 }};
}
