// Preview 17: bounded lane-change planner for same-direction traffic.
// No cross-direction overtaking and no passing through an occupied gap.
export function adjacentLane(z,dir){
 if(dir>0){if(Math.abs(z-17)<1.2)return 20;if(Math.abs(z-20)<1.2)return 17;}
 if(dir<0){if(Math.abs(z-27)<1.2)return 30;if(Math.abs(z-30)<1.2)return 27;}
 return null;
}
export function choosePassingLane(car,cars,craters=[],{allowWithoutLeader=false}={}){
 if(!car||car.emergency||car.rearStreet||car.turning||car.turnPath?.length||car.routing||car.frozen||car.stun>0)return null;
 const x=car.root.position.x,z=car.root.position.z,dir=car.dir;
 // Restrict lane changes near cross-streets and existing road damage.
 if([-53,53].some(cross=>Math.abs(x-cross)<15))return null;
 if(craters.some(c=>c.life>0&&Math.abs(c.x-x)<12&&Math.abs(c.z-z)<8))return null;
 if(Math.abs(z-car.laneZ)>1.05)return null; // complete the current move first
 const candidate=adjacentLane(car.laneZ,dir);
 if(candidate===null)return null;
 const leader=cars.find(other=>other!==car&&!other.destroyed&&other.dir===dir&&!other.turning&&Math.abs(other.root.position.z-z)<1.4&&((other.root.position.x-x)*dir)>0&&((other.root.position.x-x)*dir)<Math.max(16,car.length*2.6)&&other.speed<car.desiredSpeed-1.2);
 if(!allowWithoutLeader&&!leader)return null;
 const safetyFront=Math.max(11,car.length*1.9+Math.max(0,car.speed)*.7);
 const safetyRear=Math.max(13,car.length*2.0+Math.max(0,car.speed)*.8);
 const clear=cars.every(other=>{
  if(other===car||other.destroyed)return true;
  if(Math.abs(other.root.position.z-candidate)>1.55&&Math.abs(other.laneZ-candidate)>1.55)return true;
  const forward=(other.root.position.x-x)*dir;
  const gap=forward>=0?safetyFront+other.length*.5:safetyRear+other.length*.5;
  return Math.abs(forward)>gap;
 });
 return clear?candidate:null;
}
export function laneChangeYaw(error,dir,speed){
 if(Math.abs(error)<.06)return 0;
 const lateral=Math.max(-.32,Math.min(.32,error*.12));
 return dir>0?-lateral:lateral;
}
export function laneChangeSpeedCap(car){
 const delta=Math.abs((car.laneZ??0)-(car.root?.position?.z??0));
 return delta>.5?Math.min(car.desiredSpeed,9.5):car.desiredSpeed;
}
