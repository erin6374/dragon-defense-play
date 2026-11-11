import * as THREE from 'three';

// Nine fixed UV contacts reuse the existing facade draw. No decals, lights,
// textures or GPU resources are created when a meteor hits.
export function attachFacadeFireDamage(material, count=9) {
 const contacts=Array.from({length:count},()=>new THREE.Vector4());
 const heat=new Float32Array(count);
 const uniforms={ddBurnContacts:{value:contacts},ddBurnHeat:{value:heat}};
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.fragmentShader=`uniform vec4 ddBurnContacts[${count}];
   uniform float ddBurnHeat[${count}];\n`+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`
   #include <map_fragment>
   float ddSoot=0.; float ddOpening=0.; float ddHeat=0.;
   #ifdef USE_MAP
   for(int i=0;i<${count};i++){
    vec4 c=ddBurnContacts[i];
    if(c.z>0.){
     vec2 p=(vMapUv-c.xy)/max(c.zw,vec2(.0001));
     float opening=(1.-smoothstep(.34,.53,abs(p.x)))*(1.-smoothstep(.32,.52,abs(p.y)));
     // Soot climbs above each actual broken pane, broadening with height.
     float above=max(0.,p.y);
     float soot=(1.-smoothstep(.4,1.5+above*.13,abs(p.x)))*
      (1.-smoothstep(1.,6.,above))*smoothstep(-.7,.2,p.y);
     ddSoot=max(ddSoot,soot*.78);
     ddOpening=max(ddOpening,opening);
     ddHeat+=exp(-dot(p/vec2(1.7,2.1),p/vec2(1.7,2.1)))*ddBurnHeat[i];
    }
   }
   diffuseColor.rgb*=1.-max(ddSoot,ddOpening*.94);
   #endif
  `).replace('#include <emissivemap_fragment>',`
   #include <emissivemap_fragment>
   // Extinguish the original office lights inside charred/broken windows.
   totalEmissiveRadiance*=1.-max(ddSoot,ddOpening);
   totalEmissiveRadiance+=vec3(1.,.21,.025)*min(ddHeat,.95)*(.18+.42*ddOpening);
  `);
 };
 material.customProgramCacheKey=()=>`facade-fire-damage-${count}-v1`;
 return {
  contacts,heat,
  set(index,u,v,width,height,power){
   contacts[index].set(u,v,width,height);heat[index]=power;
  },
  reset(){for(const c of contacts)c.set(0,0,0,0);heat.fill(0);}
 };
}
