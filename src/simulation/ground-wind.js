// Arcade mobility and cone tuning for the street-level wind response.
export function groundWindWeight(vehicle){
 if(vehicle.bike||vehicle.scooter)return 1;
 if(vehicle.bus||vehicle.fireTruck||vehicle.ladder)return .56;
 if(vehicle.garbage)return .60;
 if(vehicle.truck)return .68;
 if(vehicle.ambulance)return .70;
 if(vehicle.van)return .72;
 if(vehicle.police||vehicle.ice)return .79;
 return .85; // sedans, taxis, wagons and crossovers
}

export function groundWindStrength(x,y,z,ox,oy,oz,dx,dy,dz) {
 const rx=x-ox,ry=y-oy,rz=z-oz,along=rx*dx+ry*dy+rz*dz;
 if(along<=0||along>=64)return 0;
 const across=Math.sqrt(Math.max(0,rx*rx+ry*ry+rz*rz-along*along));
 const radius=15+along*.55;
 if(across>=radius)return 0;
 return (1-.55*along/64)*(1-.55*across/radius);
}
export function hitVehicleWithWind(car,gustId,ox,oz,dx,dz) {
 if(!car?.root?.position||car.windGustId===gustId||car.destroyed||car.burning||car.frozen||car.routing||car.turnPath?.length)return false;
 const p=car.root.position, strength=groundWindStrength(p.x,1,p.z,ox,1,oz,dx,0,dz);
 if(strength<=0)return false;
 const mobility=groundWindWeight(car),kick=(12+28*strength)*mobility;
 const heavy=mobility<=.68;
 const lateralSign=Math.abs(p.z-oz)>.4?Math.sign(p.z-oz):(car.dir<0?1:-1);
 const side=dz+.52*Math.max(.2,1-Math.abs(dz))*lateralSign;
 car.windVX=(car.windVX||0)+dx*kick;car.windVZ=(car.windVZ||0)+side*kick*.84;
 car.windRecovery=Math.max(car.windRecovery||0,1.15+strength*.8);
 car.windSettle=Math.max(car.windSettle||0,3.2);
 car.windRollTime=0;
 car.windLean=-Math.sign(side)*(
  heavy?.14+.19*strength:car.bike||car.scooter?.7+strength*.55:.38+1.25*strength);
 car.windPitch=-dx*(car.dir||1)*(heavy?.14:.22)*strength;
 car.windGustId=gustId;
 if(Number.isFinite(car.speed))car.speed=0;
 return true;
}
export function advanceVehicleWind(car,dt) {
 if(car.windGustId===undefined||!(dt>0))return false;
 const step=Math.min(dt,.1);
 const active=(car.windRecovery||0)>0||Math.abs(car.windVX||0)>.03||Math.abs(car.windVZ||0)>.03||Math.abs(car.root.rotation.x)>.004||Math.abs(car.root.rotation.z||0)>.004;
 if(!active){car.windRecovery=0;car.windVX=0;car.windVZ=0;car.root.rotation.x=0;car.root.rotation.z=0;car.windSettle=Math.max(0,(car.windSettle||0)-step);return false;}
 const p=car.root.position;
 if(!car.frozen&&!car.burning&&!car.destroyed)p.x+=(car.windVX||0)*step;
 if(!car.frozen&&!car.burning&&!car.destroyed&&!car.routing&&!car.turnPath?.length){
  const lane=Number.isFinite(car.laneZ)?car.laneZ:p.z;
  const sideLimit=car.bike||car.scooter?6:groundWindWeight(car)<=.68?2.4:4.8;
  const roadMin=car.rearStreet?-41.5:13.5,roadMax=car.rearStreet?-32:33.5;
  const shifted=Math.max(roadMin,Math.min(roadMax,Math.max(lane-sideLimit,Math.min(lane+sideLimit,p.z+(car.windVZ||0)*step))));
  if(Math.abs(shifted-p.z)<Math.abs((car.windVZ||0)*step)*.5)car.windVZ*=.68;
  p.z=shifted;
 }
 const damping=Math.exp(-step*(car.windRecovery>0?1.5:3.2));
 car.windVX=(car.windVX||0)*damping;car.windVZ=(car.windVZ||0)*damping;
 const speed=Math.hypot(car.windVX,car.windVZ);
 car.windRollTime=(car.windRollTime||0)+step;
 const rock=Math.sin(car.windRollTime*7)*Math.exp(-car.windRollTime*1.15);
 car.root.rotation.x=(car.windLean||0)*rock*1.32;
 car.root.rotation.z=(car.windPitch||0)*rock;
 if(car.windRecovery>0&&speed>1)car.root.rotation.y+=Math.max(-.24,Math.min(.24,car.windVZ*.016))*step*3;
 car.windRecovery=Math.max(0,(car.windRecovery||0)-step);
 car.windSettle=Math.max(0,(car.windSettle||0)-step);
 return true;
}


// Wind knockdowns are temporary and separate from injuries that award rescue points.
export function hitPedestrianWithWind(person,gustId,ox,oz,dx,dz){
 if(person.down>0||person.windFall>0||person.windGustId===gustId||!person.g?.visible)return;
 const p=person.g.position;
 const force=groundWindStrength(p.x,0,p.z,ox,0,oz,dx,0,dz);
 if(force<=0)return;
 const kick=9+19*force;
 person.windGustId=gustId;
 person.windFall=1.5+force*.5;
 person.windVX=dx*kick;
 person.windVZ=dz*kick;
 person.g.rotation.set(0,Math.atan2(dx,dz),0,'YXZ');
}

export function advancePedestrianWind(person,dt){
 if(!(person.windFall>0))return false;
 if(person.down>0){
  person.windFall=0;
  person.g.rotation.set(0,person.g.rotation.y,0,'XYZ');
  return false;
 }
 person.windFall=Math.max(0,person.windFall-dt);
 const p=person.g.position;
 p.x+=person.windVX*dt;
 p.z=Math.max(9,Math.min(38,p.z+person.windVZ*dt));
 const drag=Math.exp(-2.1*dt);
 person.windVX*=drag;
 person.windVZ*=drag;
 const pose=1.44*Math.min(1,person.windFall/.36);
 person.g.rotation.x+=(pose-person.g.rotation.x)*Math.min(1,dt*14);
 if(!person.windFall)person.g.rotation.set(0,person.g.rotation.y,0,'XYZ');
 return true;
}
