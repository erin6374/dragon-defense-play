import {CROSS_STREETS,BROAD_LANES} from './road-corridors.js';
export function advanceSpeed(current,target,dt,acceleration=2.1,braking=5.8){const delta=target-current;return Math.max(0,current+Math.sign(delta)*Math.min(Math.abs(delta),(delta>0?acceleration:braking)*dt))}
export function safeApproachSpeed(distance,braking=5.8,buffer=1.3){return Math.sqrt(2*braking*Math.max(0,distance-buffer))}
export function trafficTarget(car,cars,pedestrians,red,blocked,time){
 let target=car.desiredSpeed*(.92+.08*Math.sin(time*.3+car.driverPhase));const x=car.root.position.x,z=car.root.position.z;
 const ahead=d=>(d-x)*car.dir;
 if(red&&!car.emergency&&!car.crossStreet&&!car.rearStreet&&z>=BROAD_LANES[0]-1.5&&z<=BROAD_LANES[3]+1.5)for(const {x:intersection,roadHalfWidth} of CROSS_STREETS){const distance=ahead(intersection-car.dir*(roadHalfWidth+1.5+car.length*.5));if(distance>-.5&&distance<28)target=Math.min(target,safeApproachSpeed(distance))}
 for(const other of cars){if(other===car||other.destroyed||other.dir!==car.dir||Math.abs(other.root.position.z-z)>1.6)continue;const gap=ahead(other.root.position.x)-(car.length+other.length)*.5;if(gap>-.5&&gap<28)target=Math.min(target,Math.max(0,other.speed+ (gap-2.5)*.65))}
 for(const p of pedestrians){if(p.down>0||!p.crossing)continue;const distance=ahead(p.g.position.x)-car.length*.5;const dz=Math.abs(p.g.position.z-z);if(distance>-.5&&distance<30&&dz<3.5)target=Math.min(target,safeApproachSpeed(distance,5.8,2))}
 if(car.fireTruck&&car.serviceTarget){const distance=ahead(car.serviceEntryX??car.serviceTarget.root.position.x);if(distance>0&&distance<28)target=Math.min(target,safeApproachSpeed(distance,5.8,2.5))}
 if(car.serviceStop||blocked||car.hostile&&car.police&&Math.abs(x)<25)target=0;
 return target;
}

// The car's X coordinate stays fixed during target-speed and passing-lane
// decisions. Retain every possible leader, safety gap and contact candidate.
// Preserve list order for the original forward and reverse scans.
export function trafficNeighborCandidates(car,cars,maxLength){
 const x=car.root.position.x,length=car.length,speed=Math.max(0,car.speed,car.desiredSpeed);
 if(![x,length,speed,maxLength].every(Number.isFinite)||length<0||maxLength<0)return cars;
 const radius=Math.max(28+(length+maxLength)*.5,16,length*2.6,
  Math.max(8,length*1.5+speed*.5)+maxLength*.5,
  Math.max(9,length*1.6+speed*.6)+maxLength*.5,7.5)+.001;
 return cars.filter(other=>other===car||!Number.isFinite(other.root.position.x)||Math.abs(other.root.position.x-x)<=radius);
}
export function maximumTrafficLength(cars){
 let max=0;
 for(const car of cars){if(!Number.isFinite(car.length)||car.length<0)return Infinity;max=Math.max(max,car.length);}
 return max;
}
