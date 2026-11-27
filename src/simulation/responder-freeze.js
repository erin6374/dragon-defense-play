// Temporary immobilization and owned material cleanup for gas-hit responders.
// A plume may affect each vehicle only once, even when its sprites linger.
export const GAS_FREEZE_SECONDS=7;
export function freezeResponderForGas(car){
 if(!car||car.frozen||(!car.emergency&&!car.trainingCop))return false;
 car.frozen=true;car.stun=Math.max(car.stun||0,GAS_FREEZE_SECONDS);car.speed=0;
 car.frozenMaterials=new Map();
 const excluded=new Set([car.beacon,car.root.userData.headlightBeam,...(car.root.userData.brakes||[])]);
 car.root.traverse(mesh=>{
  if(!mesh.isMesh||excluded.has(mesh)||!mesh.material||Array.isArray(mesh.material))return;
  const original=mesh.material,temporary=original.clone();
  temporary.color?.setHex(0x60e642);
  car.frozenMaterials.set(mesh,{original,temporary});
  mesh.material=temporary;
 });
 return true;
}
export function releaseResponderFreeze(car){
 if(car.frozenMaterials){
  for(const [mesh,{original,temporary}] of car.frozenMaterials){
   if(mesh.material===temporary)mesh.material=original;
   temporary.dispose?.();
  }
  car.frozenMaterials.clear();car.frozenMaterials=null;
 }
 car.frozen=false;
}
export function advanceResponderFreeze(car,dt){
 if(!car.frozen)return false;
 car.stun=Math.max(0,(car.stun||0)-Math.max(0,dt));
 car.speed=0;
 if(car.stun>1e-6)return true;
 car.stun=0;releaseResponderFreeze(car);
 return false;
}
export function applyGasPlumeToResponder(cloud,car,freeze){
 const seen=cloud.affectedResponders??=new WeakSet();
 if(seen.has(car)||!freeze(car))return false;
 seen.add(car);return true;
}
