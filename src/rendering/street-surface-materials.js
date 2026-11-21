// World-space UVs keep aggregate size constant on long road slabs, cross
// streets and merged/instanced static batches. All PBR channels stay aligned.
export function configureStreetMapping(material,tilesPerUnit){
 if(material.userData.streetTilesPerUnit===tilesPerUnit)return;
 material.userData.streetTilesPerUnit=tilesPerUnit;
 material.onBeforeCompile=shader=>{
  shader.vertexShader=shader.vertexShader.replace('#include <uv_vertex>',`#include <uv_vertex>
   vec4 streetWorld = vec4(position, 1.0);
   #ifdef USE_INSTANCING
   streetWorld = instanceMatrix * streetWorld;
   #endif
   streetWorld = modelMatrix * streetWorld;
   vec2 streetUv = streetWorld.xz * ${tilesPerUnit.toFixed(4)};
   #ifdef USE_MAP
   vMapUv = streetUv;
   #endif
   #ifdef USE_NORMALMAP
   vNormalMapUv = streetUv;
   #endif
   #ifdef USE_ROUGHNESSMAP
   vRoughnessMapUv = streetUv;
   #endif`);
 };
 material.customProgramCacheKey=()=>`street-world-uv-v1-${tilesPerUnit}`;
 material.needsUpdate=true;
}

// Apply existing PBR maps before static geometry is batched. Three BoxGeometry
// identifies itself via type; it has no isBoxGeometry flag in our vendored build.
export function applyStreetSurfaceMaterials(root,bank){
 configureStreetMapping(bank.asphalt,.35);
 configureStreetMapping(bank.asphaltCross,.35);
 configureStreetMapping(bank.sidewalk,.25);
 const counts={asphalt:0,crossStreet:0,sidewalk:0};
 root.traverse(o=>{
  if(!o.isMesh||o.geometry?.type!=='BoxGeometry'||Array.isArray(o.material))return;
  const y=o.position.y,s=o.scale;
  if(!(y<-.27&&y>-.72&&s.x>9&&s.y<.32&&s.z>3))return;
  const color=o.material.color?.getHex(),kind=o.material.userData?.pbrType;
  if([0x34373b,0x414249,0x35383f].includes(color)||kind==='asphalt'){
   const cross=s.z>s.x;o.material=cross?bank.asphaltCross:bank.asphalt;
   counts[cross?'crossStreet':'asphalt']++;
  }else if([0xa9a8a0,0xb0a99d,0xb8b1a6].includes(color)||kind==='limestone'){
   o.material=bank.sidewalk;counts.sidewalk++;
  }
 });
 return counts;
}
