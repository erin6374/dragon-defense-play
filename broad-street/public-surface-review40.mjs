/** Review40: reversible public-sidewalk transitions and subtle ground finish.
 * Broad-facing only; no rear parcels, building meshes or source imagery edited.
 * Finish is procedural, not a photographic texture or measured pavement wear.
 */
import * as T from 'three';
export const FRONTAGE_ZONES=[
 ['school-front-walk','walk',-265.7,-20.65,-246.1,-19.55],
 ['vacant-front-walk','walk',-231.9,-21.20,-224.7,-19.55]
];
export function createFrontageTransitions(){
 const root=new T.Group();root.name='Review40 frontage transitions';
 const slab=new T.MeshStandardMaterial({color:0xbcb9ad,roughness:.96});
 const joint=new T.MeshStandardMaterial({color:0x99998e,roughness:.98});
 for(const [name,kind,x0,z0,x1,z1] of FRONTAGE_ZONES){
  const add=(a,b,c,d,y,depth,material,label)=>{const m=new T.Mesh(new T.BoxGeometry(b-a,depth,d-c),material);m.position.set((a+b)/2,y,(c+d)/2);m.name=label;root.add(m);};
  add(x0,x1,z0,z1,.19,.20,slab,name);
  for(let x=x0+3;x<x1-.1;x+=3)add(x-.018,x+.018,z0+.04,z1-.04,.293,.006,joint,name+' paving joint');
 }
 root.userData={zoneCount:FRONTAGE_ZONES.length,pieceCount:root.children.length,source:'conservative sidewalk infill, approximate'};
 return root;
}
const ASPHALT=new Set([0x5a5b58,0x5e605d,0x666863]),CONCRETE=new Set([0xbcb9ad,0xc0bdb1,0xb9b5a9,0xb6b3a8]);
export function applySurfaceFinish(...groups){
 const done=new Set();
 for(const group of groups)group.traverse(o=>{
  if(!o.isMesh)return;
  for(const m of Array.isArray(o.material)?o.material:[o.material]){
   if(!m||done.has(m))continue;
   const hex=m.color?.getHex(),isRoad=ASPHALT.has(hex),isWalk=CONCRETE.has(hex);
   if(!isRoad&&!isWalk)continue;
   done.add(m);
   // World-space noise prevents a long instanced slab stretching one texture.
   // The source material is retained and only its diffuse reflectance varies.
   m.onBeforeCompile=shader=>{
    shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSurfaceWorld;');
    shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
     vec4 surfacePosition=vec4(transformed,1.0);
     #ifdef USE_INSTANCING
      surfacePosition=instanceMatrix*surfacePosition;
     #endif
     vSurfaceWorld=(modelMatrix*surfacePosition).xyz;`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <common>',`#include <common>
     varying vec3 vSurfaceWorld;
     float surfHash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
     float surfNoise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
      return mix(mix(surfHash(i),surfHash(i+vec2(1.,0.)),f.x),mix(surfHash(i+vec2(0.,1.)),surfHash(i+vec2(1.,1.)),f.x),f.y);}`);
    shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
     vec2 sp=vSurfaceWorld.xz;
     float coarse=surfNoise(sp*0.47)-0.5;
     float grain=surfNoise(sp*12.0)-0.5;
     diffuseColor.rgb *= 1.0 + coarse*${isRoad?'0.15':'0.075'} + grain*${isRoad?'0.10':'0.045'};`);
   };
   m.customProgramCacheKey=()=>isRoad?'review40-asphalt':'review40-concrete';m.needsUpdate=true;
  }
 });
 return {materialCount:done.size,worldSpace:true,source:'procedural tonal variation; not a measured texture'};
}
