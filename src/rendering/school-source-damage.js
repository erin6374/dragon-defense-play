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
    float detail=1.0-smoothstep(.30,.85,max(footprint.x,footprint.y));
    vec3 masonry=mix(diffuseColor.rgb*mix(.76,1.23,variation),vec3(.19,.155,.13),mortar*.70);
    diffuseColor.rgb=mix(diffuseColor.rgb,masonry,detail*(1.0-surfaceNormal.y));
   `);
   shader.fragmentShader=shader.fragmentShader.replace('#include <dithering_fragment>',
    '#include <dithering_fragment>\n gl_FragColor.rgb*=1.0-.65*smoothstep(.03,.53,damage);');
  };
  material.customProgramCacheKey=()=> 'tech-freire-source-damage-3d-'+glass+'-'+brick;
 };
 return {stamp,patch,strikes:()=>strikes,reset:()=>{
  pixels.fill(0);
  strikes=0;
  texture.needsUpdate=true;
 }};
}
