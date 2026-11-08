// Small, non-damaging ground response to the dragon's existing wind cone.
// Values are relative mobility, not literal vehicle mass in kilograms.
// A gust lasts 0.85 s; displacement is capped independently per target.
export function groundWindWeight(vehicle){
 if(vehicle.bike||vehicle.scooter)return 1;
 if(vehicle.bus||vehicle.fireTruck||vehicle.ladder)return .065;
 if(vehicle.garbage)return .10;
 if(vehicle.truck)return .13;
 if(vehicle.ambulance)return .18;
 if(vehicle.van)return .21;
 if(vehicle.police||vehicle.ice)return .23;
 return .30; // sedans, taxis, wagons and crossovers
}

export function groundWindStep(x,y,z,ox,oy,oz,dx,dy,dz,weight,dt){
 if(!(dt>0&&weight>0))return 0;
 const rx=x-ox,ry=y-oy,rz=z-oz;
 const along=rx*dx+ry*dy+rz*dz;
 if(along<=0||along>=48)return 0;
 const across=Math.sqrt(Math.max(0,rx*rx+ry*ry+rz*rz-along*along));
 const radius=7+along*.35;
 if(across>=radius)return 0;
 const focus=(1-.55*along/48)*(1-.55*across/radius);
 return Math.max(0,Math.min(.1,dt))*1.65*weight*focus;
}


/**
 * Wind gives a single impulse per gust, followed by inertial skid and recovery.
 * This is intentionally arcade-style, and never directly damages vehicles.
 */
export function groundWindStrength(x,y,z,ox,oy,oz,dx,dy,dz) {
 const rx=x-ox,ry=y-oy,rz=z-oz,along=rx*dx+ry*dy+rz*dz;
 if(along<=0||along>=48)return 0;
 const across=Math.sqrt(Math.max(0,rx*rx+ry*ry+rz*rz-along*along));
 const radius=7+along*.35;
 if(across>=radius)return 0;
 return (1-.55*along/48)*(1-.55*across/radius);
}
export function hitVehicleWithWind(car,gustId,ox,oz,dx,dz) {
 if(!car?.root?.position||car.windGustId===gustId||car.destroyed||car.burning||car.frozen||car.routing||car.turnPath?.length)return false;
 const p=car.root.position, strength=groundWindStrength(p.x,1,p.z,ox,1,oz,dx,0,dz);
 if(strength<.17)return false;
 const mobility=Math.min(2.15,groundWindWeight(car)/.30),kick=(5+10*strength)*mobility;
 const lateralSign=Math.abs(p.z-oz)>.4?Math.sign(p.z-oz):(car.dir<0?1:-1);
 const side=dz+.52*Math.max(.2,1-Math.abs(dz))*lateralSign;
 car.windVX=(car.windVX||0)+dx*kick;car.windVZ=(car.windVZ||0)+side*kick*.84;
 car.windRecovery=Math.max(car.windRecovery||0,1.15+strength*.8);
 car.windSettle=Math.max(car.windSettle||0,3.2);
 car.windLean=Math.sign(side)*Math.min((car.bike||car.scooter)?.85:.25,.09+.28*strength*mobility);
 car.windGustId=gustId;
 if(Number.isFinite(car.speed))car.speed=Math.max(0,car.speed-Math.min(8,kick*.45));
 return true;
}
export function advanceVehicleWind(car,dt) {
 if(!car?.root?.position||!(dt>0))return false;
 const step=Math.min(dt,.1);
 const active=(car.windRecovery||0)>0||Math.abs(car.windVX||0)>.03||Math.abs(car.windVZ||0)>.03||Math.abs(car.root.rotation.x)>.004;
 if(!active){car.windRecovery=0;car.windVX=0;car.windVZ=0;car.root.rotation.x=0;car.windSettle=Math.max(0,(car.windSettle||0)-step);return false;}
 const p=car.root.position;p.x+=(car.windVX||0)*step;
 if(!car.routing&&!car.turnPath?.length){
  const lane=Number.isFinite(car.laneZ)?car.laneZ:p.z;
  const sideLimit=car.bike||car.scooter?5.3:car.bus||car.fireTruck||car.ladder?1.25:car.truck||car.garbage?2.4:3.8;
  const roadMin=car.rearStreet?-41.5:13.5,roadMax=car.rearStreet?-32:33.5;
  const shifted=Math.max(roadMin,Math.min(roadMax,Math.max(lane-sideLimit,Math.min(lane+sideLimit,p.z+(car.windVZ||0)*step))));
  if(Math.abs(shifted-p.z)<Math.abs((car.windVZ||0)*step)*.5)car.windVZ*=.68;
  p.z=shifted;
 }
 const damping=Math.exp(-step*(car.windRecovery>0?1.5:3.2));
 car.windVX=(car.windVX||0)*damping;car.windVZ=(car.windVZ||0)*damping;
 const speed=Math.hypot(car.windVX,car.windVZ);
 const tilt=(car.windRecovery>0&&speed>1)?(car.windLean||0)*Math.min(1,speed/9):0;
 car.root.rotation.x+=(tilt-car.root.rotation.x)*Math.min(1,step*8);
 if(car.windRecovery>0&&speed>1)car.root.rotation.y+=Math.max(-.24,Math.min(.24,car.windVZ*.016))*step*3;
 car.windRecovery=Math.max(0,(car.windRecovery||0)-step);
 car.windSettle=Math.max(0,(car.windSettle||0)-step);
 return true;
}
