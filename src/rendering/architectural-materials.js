
// v4.2: richer world-space architectural shading with bonded masonry, patina, and grime.
export function architecturalSurface(THREE,hex,kind='brick'){
 const isGlass=kind==='glass';
 const mat=new THREE.MeshStandardMaterial({color:hex,roughness:isGlass?.22:.88,metalness:isGlass?.22:.02});
 mat.userData.architecturalKind=kind;
 mat.onBeforeCompile=(shader)=>{
  shader.vertexShader='varying vec3 vArchPos; varying vec3 vArchNormal;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <beginnormal_vertex>','#include <beginnormal_vertex>\n vArchNormal=normalize(objectNormal);');
  shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
  vec4 archPos=vec4(transformed,1.0);
  #ifdef USE_INSTANCING
    archPos=instanceMatrix*archPos;
  #endif
  vArchPos=(modelMatrix*archPos).xyz;`);
  shader.fragmentShader='varying vec3 vArchPos; varying vec3 vArchNormal;\n'+shader.fragmentShader;
  let detail='';
  if(kind==='brick')detail=`
    float row=floor(vArchPos.y*2.12);
    vec2 brick=vec2(vArchPos.x*1.74+mod(row,2.0)*.52,vArchPos.y*2.12);
    vec2 cell=fract(brick);
    float joint=max(step(cell.x,.065),max(step(.935,cell.x),max(step(cell.y,.08),step(.92,cell.y))));
    float grain=fract(sin(dot(floor(brick),vec2(12.9898,78.233)))*43758.5453);
    float freckles=fract(sin(dot(floor(vArchPos.xy*31.0),vec2(41.3,11.7)))*17341.13);
    float darker=smoothstep(.72,1.0,grain);
    diffuseColor.rgb*=mix(.80,1.16,grain)*mix(.94,1.05,freckles);
    diffuseColor.rgb*=mix(1.0,.42,joint);
    diffuseColor.rgb*=1.0-darker*.045;
  `;
  else if(kind==='stone'||kind==='concrete')detail=`
    vec2 slab=vec2(vArchPos.x*1.04+mod(floor(vArchPos.y*.78),2.0)*.37,vArchPos.y*.82);
    vec2 cell=fract(slab);
    float grout=max(step(cell.x,.028),max(step(.972,cell.x),max(step(cell.y,.035),step(.965,cell.y))));
    float speck=fract(sin(dot(floor(vArchPos.xy*16.0),vec2(41.3,19.7)))*43758.5453);
    float veins=fract(sin(dot(floor(vArchPos.xy*4.3),vec2(18.7,57.1)))*23167.31);
    diffuseColor.rgb*=mix(.87,1.08,speck)*mix(.96,1.06,veins);
    diffuseColor.rgb*=mix(1.0,.70,grout);
  `;
  else detail=`
    float seam=step(fract(vArchPos.x*1.8),.025)+step(fract(vArchPos.y*1.2),.02);
    diffuseColor.rgb*=1.0-seam*.14;
  `;
  shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    ${detail}
    float patch=fract(sin(dot(floor(vArchPos.xy*.52),vec2(37.6,17.8)))*5133.53);
    float soot=smoothstep(.74,1.0,fract(sin(dot(floor(vArchPos.xz*.75),vec2(92.8,31.1)))*43758.54));
    float lower=1.0-smoothstep(.0,7.0,vArchPos.y);
    float streak=smoothstep(.35,.95,fract(sin(floor(vArchPos.x*1.8)*12.1)*437.3))*(1.0-smoothstep(.0,10.0,vArchPos.y));
    float cavity=max(0.,dot(normalize(vNormal),vec3(.0,.0,1.0)));
    diffuseColor.rgb*=mix(.90,1.04,patch);
    diffuseColor.rgb*=1.0-.09*lower-.05*soot;
    diffuseColor.rgb-=streak*.035;
    diffuseColor.rgb*=mix(.93,1.03,cavity);
  `);
 };
 mat.customProgramCacheKey=()=>`dragon-architecture-${kind}-v42`;
 return mat;
}
