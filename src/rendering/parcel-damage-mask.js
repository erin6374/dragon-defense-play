// Damage is local to one imported parcel and remains in world coordinates.
// Allocate only when the parcel takes a hit. Original shared materials are
// never mutated; repair releases the temporary shader variants and mask.
export function createParcelDamageMask(T,model,bounds){
 const pad=.8;
 const min=new T.Vector3(bounds.minX-pad,bounds.minY-pad,bounds.minZ-pad);
 const size=new T.Vector3(bounds.maxX-bounds.minX+pad*2,bounds.maxY-bounds.minY+pad*2,bounds.maxZ-bounds.minZ+pad*2);
 const dims=[size.x,size.y,size.z].map(v=>Math.max(8,Math.min(48,Math.ceil(v/.45))));
 const [nx,ny,nz]=dims;
 const data=new Uint8Array(nx*ny*nz);
 const texture=new T.Data3DTexture(data,nx,ny,nz);
 texture.format=T.RedFormat;
 texture.minFilter=texture.magFilter=T.LinearFilter;
 texture.unpackAlignment=1;
 texture.needsUpdate=true;
 const uniforms={map:{value:texture},min:{value:min},size:{value:size}};
 const originals=new Map(),clones=new Map();
 let strikes=0,disposed=false,unchangedStamps=0,textureUpdates=1;
 function patch(original){
  if(clones.has(original))return clones.get(original);
  const mat=original.clone();
  const prior=original.onBeforeCompile;
  const priorKey=original.customProgramCacheKey?.()??'';
  mat.onBeforeCompile=function(shader,renderer){
   prior?.call(this,shader,renderer);
   shader.uniforms.uParcelDamageMap=uniforms.map;
   shader.uniforms.uParcelDamageMin=uniforms.min;
   shader.uniforms.uParcelDamageSize=uniforms.size;
   shader.vertexShader='varying vec3 vParcelDamageWorld;\n'+shader.vertexShader;
   shader.vertexShader=shader.vertexShader.replace('#include <worldpos_vertex>',`#include <worldpos_vertex>
    vec4 parcelLocal=vec4(transformed,1.0);
    #ifdef USE_INSTANCING
    parcelLocal=instanceMatrix*parcelLocal;
    #endif
    vParcelDamageWorld=(modelMatrix*parcelLocal).xyz;`);
   shader.fragmentShader='uniform highp sampler3D uParcelDamageMap;\nuniform vec3 uParcelDamageMin;\nuniform vec3 uParcelDamageSize;\nvarying vec3 vParcelDamageWorld;\n'+shader.fragmentShader;
   shader.fragmentShader=shader.fragmentShader.replace('#include <clipping_planes_fragment>',`#include <clipping_planes_fragment>
    float parcelDamage=0.0;
    vec3 parcelUv=(vParcelDamageWorld-uParcelDamageMin)/uParcelDamageSize;
    if(all(greaterThanEqual(parcelUv,vec3(0.0)))&&all(lessThanEqual(parcelUv,vec3(1.0)))){
     parcelDamage=texture(uParcelDamageMap,parcelUv).r;
     if(parcelDamage>0.48)discard;
    }`);
   shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
    diffuseColor.rgb*=1.0-0.55*smoothstep(0.02,0.48,parcelDamage);`);
  };
  mat.customProgramCacheKey=()=>priorKey+'|parcel-damage-v1';
  mat.needsUpdate=true;
  clones.set(original,mat);
  return mat;
 }
 model.traverse(node=>{
  if(!node.isMesh||!node.material)return;
  originals.set(node,node.material);
  node.material=Array.isArray(node.material)?node.material.map(patch):patch(node.material);
 });
 function stamp(point,radius,strength=1){
  if(disposed||!Number.isFinite(radius)||radius<=0||!Number.isFinite(strength)||strength<=0||
   !point||![point.x,point.y,point.z].every(Number.isFinite))return false;
  const r=Math.min(4.2,Math.max(.65,radius*.55))*Math.min(1,Math.max(.45,Math.sqrt(Math.max(0,strength))));
  const cell=[size.x/nx,size.y/ny,size.z/nz],center=[point.x,point.y,point.z],origin=[min.x,min.y,min.z];
  const low=center.map((v,i)=>Math.max(0,Math.floor((v-origin[i]-r*1.2)/cell[i])));
  const high=center.map((v,i)=>Math.min(dims[i]-1,Math.ceil((v-origin[i]+r*1.2)/cell[i])));
  let changed=false;
  const maxEdgeSq=(r*1.040001)**2;
  for(let z=low[2];z<=high[2];z++){
   const dz=min.z+(z+.5)*cell[2]-point.z;
   for(let y=low[1];y<=high[1];y++){
    const dy=min.y+(y+.5)*cell[1]-point.y,dyz=dy*dy+dz*dz;
    if(dyz>=maxEdgeSq)continue;
    const row=(z*ny+y)*nx;
    for(let x=low[0];x<=high[0];x++){
     const idx=row+x;if(data[idx]===255)continue;
     const dx=min.x+(x+.5)*cell[0]-point.x;if(dx*dx+dyz>=maxEdgeSq)continue;
   const edge=r*(.92+.12*Math.sin(dx*3.7+dy*2.9+dz*4.1));
   const t=1-Math.hypot(dx,dy,dz)/edge;
   if(t<=0)continue;
   const value=Math.min(255,Math.round(t*440));
   if(value>data[idx]){data[idx]=value;changed=true;}
    }
   }
  }
  if(changed){strikes++;texture.needsUpdate=true;textureUpdates++;}else unchangedStamps++;
  return changed;
 }
 return {stamp,strikes:()=>strikes,stats:()=>({strikes,unchangedStamps,textureUpdates,textureBytes:data.byteLength}),byteLength:data.byteLength,dispose(){
  if(disposed)return;disposed=true;
  for(const [node,original] of originals)node.material=original;
  for(const mat of clones.values())mat.dispose();
  texture.dispose();originals.clear();clones.clear();
 }};
}
