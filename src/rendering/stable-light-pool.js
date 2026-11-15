// Three.js specializes lighting shaders by scene light count. Keep all slots
// attached and visible; inactive slots have zero intensity instead of disappearing.
export function createStableLightPool(scene, size, createLight) {
 const lights=Array.from({length:size},()=>{
  const light=createLight();light.intensity=0;scene.add(light);
  if(light.isSpotLight)scene.add(light.target);
  return light;
 });
 const active=new Set();
 return {
  lights:Object.freeze(lights),
  get activeCount(){return active.size},
  acquire(){const light=lights.find(l=>!active.has(l));if(!light)return null;active.add(light);return light},
  release(light){if(!lights.includes(light))return;light.intensity=0;active.delete(light)},
  reset(){for(const light of lights)light.intensity=0;active.clear()}
 };
}

// Preserve the position/aim of a light formerly parented to the helicopter,
// including its rotation and scale. The pooled light and target stay in the scene.
export function syncHelicopterSearchlight(root, light, targetPos=null) {
 if(!root || !light) return;
 if(light.position){
  light.position.set(1.35,-.62,0);
  root.localToWorld(light.position);
 }
 if(light.target?.position){
  if(targetPos){
   light.target.position.copy(targetPos);
  }else{
   light.target.position.set(1.35,-16,0);
   root.localToWorld(light.target.position);
  }
 }
}
