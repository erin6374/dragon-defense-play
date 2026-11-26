// Preview 17: bounded lane-change planner for same-direction traffic.
// No cross-direction overtaking and no passing through an occupied gap.
// RC136: Active crater and subway breach detours around road damage.
import { BROAD_LANES,CROSS_STREET_X } from './road-corridors.js';

export function adjacentLane(z,dir,detour=false){
 const [first,second]=dir>0?BROAD_LANES.slice(0,2):BROAD_LANES.slice(2);
 // There are only two marked travel lanes per direction. Parking/curb
 // space is not a third detour lane.
 if(detour)return null;
 if(Math.abs(z-first)<1.2)return second;
 if(Math.abs(z-second)<1.2)return first;
 return null;
}
export function choosePassingLane(car,cars,craters=[],{allowWithoutLeader=false}={}){
 if(!car||car.emergency||car.crossStreet||car.rearStreet||car.turning||car.turnPath?.length||car.routing||car.frozen||car.stun>0)return null;
 const x=car.root.position.x,z=car.root.position.z,dir=car.dir;
 // Restrict lane changes near cross-streets
 if(CROSS_STREET_X.some(cross=>Math.abs(x-cross)<15))return null;
 if(Math.abs(z-car.laneZ)>1.25)return null; // complete the current move first

 // Check for crater or subway breach ahead in current lane
 const craterAhead=craters.find(c=>{
  if(!c||c.life<=0)return false;
  const forward=(c.x-x)*dir;
  const latDist=Math.abs(c.z-car.laneZ);
  return forward>-1.0&&forward<(c.radius+22.0)&&latDist<(c.radius+1.6);
 });

 let candidate=null;
 if(craterAhead){
  const adjacent=adjacentLane(car.laneZ,dir,false);
  if(adjacent!==null&&craters.every(c=>!c||c.life<=0||(c.x-x)*dir<=-1||(c.x-x)*dir>=c.radius+22||Math.abs(c.z-adjacent)>=c.radius+1.6))candidate=adjacent;
  if(candidate===null)return null;
 }else{
  candidate=adjacentLane(car.laneZ,dir,false);
  if(candidate===null)return null;
  const leader=cars.find(other=>other!==car&&!other.destroyed&&other.dir===dir&&!other.turning&&Math.abs(other.root.position.z-z)<1.4&&((other.root.position.x-x)*dir)>0&&((other.root.position.x-x)*dir)<Math.max(16,car.length*2.6)&&other.speed<car.desiredSpeed-1.2);
  if(!allowWithoutLeader&&!leader)return null;
 }

 if(candidate===null)return null;
 const safetyFront=Math.max(8,car.length*1.5+Math.max(0,car.speed)*.5);
 const safetyRear=Math.max(9,car.length*1.6+Math.max(0,car.speed)*.6);
 const clear=cars.every(other=>{
  if(other===car||other.destroyed)return true;
  if(Math.abs(other.root.position.z-candidate)>1.45&&Math.abs(other.laneZ-candidate)>1.45)return true;
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
